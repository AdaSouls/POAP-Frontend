import { ethers } from "ethers";
import poapContractJson from "../utils/Poap.json";

const POAP_CONTRACT_ADDRESS = "0x9b394Aaaf2985415215aeC036457B1F38bDdcb2e";
const POAP_CONTRACT_ABI = poapContractJson;

// Provider configuration
const providerRPC = {
  name: "Amoy",
  rpc: "https://rpc-amoy.polygon.technology",
  chainId: 80002,
};

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
  async createEvent(issuerId, eventId, maxSupply, eventStartDate, mintExpiration, eventOrganizer) {
    try {
      // Check if user is admin before attempting transaction
      // const isUserAdmin = await this.isAdmin(this.signer.address);
      // if (!isUserAdmin) {
      //   throw new Error("Only admins can create events. Your address is not authorized as an admin.");
      // }

      // Use retry logic with exponential backoff for rate limit errors
      const result = await retryWithBackoff(async () => {
        // First, estimate gas to catch revert reasons early
        let gasEstimate;
        try {
          gasEstimate = await this.contract.createEventId.estimateGas(
            issuerId,
            eventId,
            maxSupply,
            eventStartDate,
            mintExpiration,
            eventOrganizer
          );
        } catch (estimateError) {
          // Extract revert reason from gas estimation error
          const revertReason = this.extractRevertReason(estimateError);
          throw new Error(revertReason || "Transaction would fail. Please check your permissions and event parameters.");
        }

        const tx = await this.contract.createEventId(
          issuerId,
          eventId,
          maxSupply,
          eventStartDate,
          mintExpiration,
          eventOrganizer,
          { gasLimit: gasEstimate + (gasEstimate / 5n) }
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
      // console.error("Failed to create event:", error);
      
      // Provide user-friendly error message for rate limits
      if (isRateLimitError(error)) {
        const rateLimitError = new Error("The network is currently busy. Please wait a moment and try again.");
        rateLimitError.name = "RateLimitError";
        throw rateLimitError;
      }
      
      // Re-throw with the error message (which may now include revert reason)
      throw error;
    }
  }

  // Helper function to extract revert reason from errors
  extractRevertReason(error) {
    if (!error) return null;
    
    // Check for revert reason in error data
    if (error.data) {
      // Try to decode the revert reason
      if (typeof error.data === 'string' && error.data.startsWith('0x')) {
        try {
          // Common revert reason signatures
          const reason = this.contract.interface.parseError(error.data);
          if (reason) {
            return reason.name;
          }
        } catch (e) {
          // If parsing fails, try to extract from error message
        }
      }
    }
    
    // Check error message for revert reason
    const errorMessage = error.message || error.toString();
    
    // Common revert reasons to look for
    if (errorMessage.includes("onlyAdmin") || errorMessage.includes("AccessControl")) {
      return "Only admins can perform this action. Your address is not authorized.";
    }
    if (errorMessage.includes("onlyEventMinter") || errorMessage.includes("not authorized to mint")) {
      return "You are not authorized to mint tokens for this event. Please ensure you are added as an event minter.";
    }
    if (errorMessage.includes("minter is event holder") || errorMessage.includes("event holder")) {
      return "The recipient already has a token for this event. Each address can only receive one token per event.";
    }
    if (errorMessage.includes("event does not exist") || errorMessage.includes("Poap: event does not exist")) {
      return "This event does not exist. Please verify the event ID.";
    }
    if (errorMessage.includes("issuer does not exist") || errorMessage.includes("Poap: issuer does not exist")) {
      return "The issuer does not exist. Please verify the issuer ID.";
    }
    if (errorMessage.includes("event mint has expired") || errorMessage.includes("Poap: event mint has expired") || errorMessage.includes("expired")) {
      return "This event's minting period has expired.";
    }
    if (errorMessage.includes("max supply reached") || errorMessage.includes("Poap: max supply reached") || errorMessage.includes("max supply")) {
      return "This event has reached its maximum supply. No more tokens can be minted.";
    }
    if (errorMessage.includes("whenNotPaused") || errorMessage.includes("Pausable")) {
      return "Contract is currently paused. Please try again later.";
    }
    if (errorMessage.includes("event already created") || errorMessage.includes("already exists")) {
      return "This event ID already exists. Please use a different event ID.";
    }
    if (errorMessage.includes("revert")) {
      // Try to extract the revert reason after "revert"
      const revertMatch = errorMessage.match(/revert\s+(.+?)(?:\s+\(|$)/i);
      if (revertMatch) {
        return revertMatch[1].trim();
      }
    }
    
    // Check for error in nested error objects
    if (error.error) {
      return this.extractRevertReason(error.error);
    }
    
    // Check for reason in error object
    if (error.reason) {
      return error.reason;
    }
    
    return null;
  }

  // Mint token
  async mintToken(issuerId, eventId, to) {
    try {
      // Pre-flight validation checks
      try {
        // Check if user can mint for this event
        // const canMint = await this.canMintForEvent(eventId, this.signer.address);
        // if (!canMint) {
        //   throw new Error("You are not authorized to mint tokens for this event. Please ensure you are added as an event minter.");
        // }

        // Check event details
        const eventDetails = await this.getEventDetails(eventId);
        
        if (eventDetails.available <= 0) {
          throw new Error("This event has reached its maximum supply. No more tokens can be minted.");
        }
        if (eventDetails.eventStartDate > 0 && eventDetails.eventStartDate * 1000 > Date.now()) {
          throw new Error("This event has not started yet. Please try again later.");
        }
        if (eventDetails.mintExpiration > 0 && eventDetails.mintExpiration * 1000 <= Date.now()) {
          throw new Error("This event's minting period has expired.");
        }
      } catch (validationError) {
        // If it's already a user-friendly error, throw it
        if (validationError.message && !validationError.message.includes("Failed to")) {
          throw validationError;
        }
        // Otherwise, continue to try the transaction (might be a network error)
      }

      // Use retry logic with exponential backoff for rate limit errors
      const result = await retryWithBackoff(async () => {
        // First, estimate gas to catch revert reasons early
        let gasEstimate;
        try {
          gasEstimate = await this.contract.mintToken.estimateGas(
            issuerId,
            eventId,
            to
          );
        } catch (estimateError) {
          // Extract revert reason from gas estimation error
          const revertReason = this.extractRevertReason(estimateError);
          throw new Error(revertReason || "Transaction would fail. Please check your permissions and event parameters.");
        }

        // Use gas estimate with a small buffer (20% more) to avoid MetaMask rejection
        const tx = await this.contract.mintToken(issuerId, eventId, to, {
          gasLimit: gasEstimate + (gasEstimate / 5n), // Add 20% buffer
        });
        
        const receipt = await tx.wait();
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
        };
      }, 3, 1000); // 3 retries, starting with 1 second delay
      
      return result;
    } catch (error) {
      console.error("Failed to mint token:", error);
      
      // Provide user-friendly error message for rate limits
      if (isRateLimitError(error)) {
        const rateLimitError = new Error("The network is currently busy. Please wait a moment and try again.");
        rateLimitError.name = "RateLimitError";
        throw rateLimitError;
      }
      
      // Re-throw with the error message (which may now include revert reason)
      throw error;
    }
  }

  async checkEventsExist() {
    try {
      const staticProvider = new ethers.JsonRpcProvider(providerRPC.rpc, {
        chainId: providerRPC.chainId,
        name: providerRPC.name,
      });
      
      // Check if contract exists
      const code = await staticProvider.getCode(POAP_CONTRACT_ADDRESS);
      
      if (code === "0x") {
        console.error("Contract not deployed at address:", POAP_CONTRACT_ADDRESS);
        return false;
      }
      
      // Try to get total supply
      // try {
      //   const totalSupply = await staticContract.totalSupply();
      // } catch (error) {
      //   console.error("Failed to get total supply:", error);
      // }
      
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
    const [maxSupply, totalSupply, mintExpiration, eventStartDate] = await Promise.all([
      this.contract.eventMaxSupply(eventId),
      this.contract.eventTotalSupply(eventId),
      this.contract.eventMintExpiration(eventId),
      this.contract.eventStartDate(eventId),
    ]);
    
    return {
      eventId: Number(eventId),
      maxSupply: Number(maxSupply),
      totalSupply: Number(totalSupply),
      mintExpiration: Number(mintExpiration),
      available: Number(maxSupply) - Number(totalSupply),
      eventStartDate: Number(eventStartDate),
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