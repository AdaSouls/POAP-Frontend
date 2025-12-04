import { ethers } from "ethers";
import poapContractJson from "../utils/Poap.json";

const POAP_CONTRACT_ADDRESS = "0x7b04cD65718eA503e0A641c1D23cb57688B808F9";
const POAP_CONTRACT_ABI = poapContractJson;

// Provider configuration
const providerRPC = {
  name: "Amoy",
  rpc: "https://rpc-amoy.polygon.technology",
  chainId: 80002,
};

const provider = new ethers.JsonRpcProvider(providerRPC.rpc, {
  chainId: providerRPC.chainId,
  name: providerRPC.name,
});

// Utility function to check if error is a rate limit error
const isRateLimitError = (error) => {
  if (!error) return false;
  
  // Check for HTTP 429 status
  if (error.code === -32005 || error.data?.httpStatus === 429) {
    return true;
  }
  
  // Check error message
  const errorMessage = error.message?.toLowerCase() || "";
  if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
    return true;
  }
  
  // Check nested error data
  if (error.error?.data?.httpStatus === 429 || error.error?.code === -32005) {
    return true;
  }
  
  return false;
};

// Retry utility with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (isRateLimitError(error)) {
        if (isLastAttempt) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`Rate limit hit, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For non-rate-limit errors, throw immediately
      throw error;
    }
  }
};

// Smart Contract Service Class
export class MVPSmartContractService {
  constructor() {
    this.contract = null;
    this.signer = null;
  }

  // Initialize with user's wallet
  async initialize(ethereum) {
    try {
      const web3Provider = new ethers.BrowserProvider(ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      this.signer = await web3Provider.getSigner();

      this.contract = new ethers.Contract(
        POAP_CONTRACT_ADDRESS,
        POAP_CONTRACT_ABI,
        this.signer
      );
      return true;
    } catch (error) {
      console.error("Failed to initialize smart contract service:", error);
      throw error;
    }
  }

  // Get all events from blockchain
  async getAllEvents() {
    try {
      
      // Use static provider for read operations
      const staticProvider = new ethers.JsonRpcProvider(providerRPC.rpc, {
        chainId: providerRPC.chainId,
        name: providerRPC.name,
      });
      
      const staticContract = new ethers.Contract(
        POAP_CONTRACT_ADDRESS,
        POAP_CONTRACT_ABI,
        staticProvider
      );
      
      // Get current block and query from a reasonable range
      const currentBlock = await staticProvider.getBlockNumber();
      
      const fromBlock = Math.max(1, currentBlock - 50000);
      
      const events = await staticContract.queryFilter(
        "EventCreated", 
        fromBlock, 
        "latest"
      );
      
      const eventData = [];
      for (const event of events) {
        const {
          issuerId,
          eventId,
          eventMaxSupply,
          eventMintExpiration,
          eventOrganizer,
        } = event.args;
  
        const maxSupply = Number(eventMaxSupply);
        const mintExpiration = Number(eventMintExpiration);
        const issuerIdNumber = Number(issuerId);
        const eventIdNumber = Number(eventId);
  
        const isExpired = () => {
          return mintExpiration * 1000 <= Date.now();
        };
  
        if (maxSupply > 0) {
          const eventTotalSupply = await staticContract.eventTotalSupply(eventId);
          const available = maxSupply - Number(eventTotalSupply);
          
          eventData.push({
            issuerId: issuerIdNumber,
            eventId: eventIdNumber,
            maxSupply: maxSupply,
            totalSupply: Number(eventTotalSupply),
            mintExpiration: mintExpiration,
            eventOrganizer,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber,
            isExpired: isExpired(),
            available: available,
          });
        }
      }
  
      return eventData.sort((a, b) => a.isExpired - b.isExpired);
    } catch (error) {
      console.error("Failed to get events:", error);
      return [];
    }
  }

  // Get user's tokens
  async getUserTokens(userAddress) {
    try {
      const balance = await this.contract.balanceOf(userAddress);
      const tokens = [];

      for (let i = 0; i < balance; i++) {
        const { tokenId, eventId } = await this.contract.tokenDetailsOfOwnerByIndex(userAddress, i);
        tokens.push({
          tokenId: Number(tokenId),
          eventId: Number(eventId),
        });
      }

      return tokens;
    } catch (error) {
      console.error("Failed to get user tokens:", error);
      return [];
    }
  }

  // Create event
  async createEvent(issuerId, eventId, maxSupply, mintExpiration, eventOrganizer) {
    try {
      // Use retry logic with exponential backoff for rate limit errors
      const result = await retryWithBackoff(async () => {
        const tx = await this.contract.createEventId(
          issuerId,
          eventId,
          maxSupply,
          mintExpiration,
          eventOrganizer,
          { gasLimit: 1000000 }
        );
        
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
        };
      }, 3, 1000); // 3 retries, starting with 1 second delay
      
      return result;
    } catch (error) {
      console.error("Failed to create event:", error);
      
      // Provide user-friendly error message for rate limits
      if (isRateLimitError(error)) {
        const rateLimitError = new Error("The network is currently busy. Please wait a moment and try again.");
        rateLimitError.name = "RateLimitError";
        throw rateLimitError;
      }
      
      throw error;
    }
  }

  // Mint token
  async mintToken(issuerId, eventId, to) {
    try {
      const tx = await this.contract.mintToken(issuerId, eventId, to, {
        gasLimit: 800000,
      });
      
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("Failed to mint token:", error);
      throw error;
    }
  }

  async checkEventsExist() {
    try {
      const staticProvider = new ethers.JsonRpcProvider(providerRPC.rpc, {
        chainId: providerRPC.chainId,
        name: providerRPC.name,
      });
      
      const staticContract = new ethers.Contract(
        POAP_CONTRACT_ADDRESS,
        POAP_CONTRACT_ABI,
        staticProvider
      );
      
      // Check if contract exists
      const code = await staticProvider.getCode(POAP_CONTRACT_ADDRESS);
      
      if (code === "0x") {
        console.error("Contract not deployed at address:", POAP_CONTRACT_ADDRESS);
        return false;
      }
      
      // Try to get total supply
      try {
        const totalSupply = await staticContract.totalSupply();
      } catch (error) {
        console.error("Failed to get total supply:", error);
      }
      
      return true;
    } catch (error) {
      console.error("Failed to check events:", error);
      return false;
    }
  }

  // Check if user is admin
  async isAdmin(address) {
    try {
      return await this.contract.isAdmin(address);
    } catch (error) {
      console.error("Failed to check admin status:", error);
      return false;
    }
  }

  // Check if user is an issuer
  async isIssuer(address) {
    const issuerId = await this.contract.issuersById(address);
    return {
      isIssuer: issuerId > 0,
      issuerId: Number(issuerId)
    };
  }

  // Get all events for an issuer
  async getIssuerEvents(issuerId) {
    const events = [];
    let index = 0;
    
    while (true) {
      try {
        const eventId = await this.contract.issuerEvents(issuerId, index);
        if (eventId > 0) {
          events.push(Number(eventId));
          index++;
        } else {
          break;
        }
      } catch (error) {
        break;
      }
    }
    
    return events;
  }
  // Get event details
  async getEventDetails(eventId) {
    const [maxSupply, totalSupply, mintExpiration] = await Promise.all([
      this.contract.eventMaxSupply(eventId),
      this.contract.eventTotalSupply(eventId),
      this.contract.eventMintExpiration(eventId),
    ]);
    
    return {
      eventId: Number(eventId),
      maxSupply: Number(maxSupply),
      totalSupply: Number(totalSupply),
      mintExpiration: Number(mintExpiration),
      available: Number(maxSupply) - Number(totalSupply),
    };
  }

  // Check if user can mint for specific event
  async canMintForEvent(eventId, address) {
    return await this.contract.isEventMinter(eventId, address);
  }

  // Get events for organizer
  async getOrganizerEvents(organizerAddress) {
    const { isIssuer, issuerId } = await this.isIssuer(organizerAddress);
    if (!isIssuer) return [];
    
    const eventIds = await this.getIssuerEvents(issuerId);
    const events = [];
    
    for (const eventId of eventIds) {
      const eventDetails = await this.getEventDetails(eventId);
      events.push(eventDetails);
    }
    
    return events;
  }

  // Get events for attendee (events they have tokens for)
  async getAttendeeEvents(attendeeAddress) {
    const tokens = await this.getUserTokens(attendeeAddress);
    const eventIds = [...new Set(tokens.map(token => token.eventId))];
    const events = [];
    
    for (const eventId of eventIds) {
      const eventDetails = await this.getEventDetails(eventId);
      events.push(eventDetails);
    }
    
    return events;
  }

  // Add event minter to specific event
  async addEventMinter(eventId, address) {
    try {
      const tx = await this.contract.addEventMinter(eventId, address, {
        gasLimit: 500000,
      });
      
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("Failed to add event minter:", error);
      throw error;
    }
  }

  // Remove event minter from specific event
  async removeEventMinter(eventId, address) {
    try {
      const tx = await this.contract.removeEventMinter(eventId, address, {
        gasLimit: 500000,
      });
      
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("Failed to remove event minter:", error);
      throw error;
    }
  }

  // Bulk mint tokens to multiple addresses
  async bulkMintTokens(issuerId, eventId, addresses) {
    try {
      const tx = await this.contract.mintEventToManyUsers(
        issuerId,
        eventId,
        addresses,
        { gasLimit: 2000000 }
      );
      
      const receipt = await tx.wait();
      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("Failed to bulk mint tokens:", error);
      throw error;
    }
  }

  // Get event organizer address
  async getEventOrganizer(eventId) {
    try {
      return await this.contract.eventOrganizer(eventId);
    } catch (error) {
      console.error("Failed to get event organizer:", error);
      return null;
    }
  }

  // Get issuer address by issuer ID
  async getIssuerAddress(issuerId) {
    try {
      return await this.contract.issuerHolders(issuerId, 0);
    } catch (error) {
      console.error("Failed to get issuer address:", error);
      return null;
    }
  }

  // Get all tokens for a user with detailed information
  async getUserTokensDetailed(userAddress) {
    try {
      const balance = await this.contract.balanceOf(userAddress);
      const tokens = [];

      for (let i = 0; i < balance; i++) {
        const { tokenId, eventId } = await this.contract.tokenDetailsOfOwnerByIndex(userAddress, i);
        const eventDetails = await this.getEventDetails(eventId);
        
        tokens.push({
          tokenId: Number(tokenId),
          eventId: Number(eventId),
          ...eventDetails
        });
      }

      return tokens;
    } catch (error) {
      console.error("Failed to get user tokens detailed:", error);
      return [];
    }
  }

  // Get event statistics
  async getEventStatistics(eventId) {
    try {
      const [maxSupply, totalSupply, mintExpiration, organizer] = await Promise.all([
        this.contract.eventMaxSupply(eventId),
        this.contract.eventTotalSupply(eventId),
        this.contract.eventMintExpiration(eventId),
        this.getEventOrganizer(eventId)
      ]);

      return {
        eventId: Number(eventId),
        maxSupply: Number(maxSupply),
        totalSupply: Number(totalSupply),
        mintExpiration: Number(mintExpiration),
        available: Number(maxSupply) - Number(totalSupply),
        organizer,
        mintedPercentage: Number(totalSupply) / Number(maxSupply) * 100,
        isExpired: Number(mintExpiration) > 0 && Number(mintExpiration) * 1000 <= Date.now()
      };
    } catch (error) {
      console.error("Failed to get event statistics:", error);
      return null;
    }
  }

  async testContract() {
    try {
      const staticProvider = new ethers.JsonRpcProvider(providerRPC.rpc, {
        chainId: providerRPC.chainId,
        name: providerRPC.name,
      });
      
      const staticContract = new ethers.Contract(
        POAP_CONTRACT_ADDRESS,
        POAP_CONTRACT_ABI,
        staticProvider
      );
      
      // Test basic contract calls
      const name = await staticContract.name();
      const symbol = await staticContract.symbol();
      const totalSupply = await staticContract.totalSupply();
      
      return { name, symbol, totalSupply: totalSupply.toString() };
    } catch (error) {
      console.error("Contract test failed:", error);
      throw error;
    }
  }
}

export const mvpSmartContractService = new MVPSmartContractService();