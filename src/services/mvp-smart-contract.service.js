import { ethers } from "ethers";
import poapContractJson from "../utils/Poap.json";

const POAP_CONTRACT_ADDRESS = "0xD2f00C7e3Ae394B860d9077B26B9e07d6746D20A";
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
      const fromBlock = Math.max(1, currentBlock - 5000); // Last 5000 blocks
      
      console.log(`Querying events from block ${fromBlock} to ${currentBlock}`);
      
      const events = await staticContract.queryFilter(
        "EventCreated", 
        fromBlock, 
        "latest"
      );
      
      console.log("🚀 ~ getAllEvents ~ events:=========================", events);
      
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
          const eventTotalSupply = await staticContract.getEventTotalSupply(eventId);
          
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
            available: maxSupply - Number(eventTotalSupply),
          });
        }
      }
  
      return eventData.sort((a, b) => a.isExpired - b.isExpired);
    } catch (error) {
      console.error("Failed to get events:", error);
      return [];
    }
  }

  // Create event
  async createEvent(issuerId, eventId, maxSupply, mintExpiration, eventOrganizer) {
    try {
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
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error("Failed to create event:", error);
      throw error;
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

  // Get event details
  async getEventDetails(eventId) {
    try {
      const [maxSupply, totalSupply, mintExpiration] = await Promise.all([
        this.contract.getEventMaxSupply(eventId),
        this.contract.getEventTotalSupply(eventId),
        this.contract.getEventMintExpiration(eventId),
      ]);

      return {
        eventId: Number(eventId),
        maxSupply: Number(maxSupply),
        totalSupply: Number(totalSupply),
        mintExpiration: Number(mintExpiration),
        available: Number(maxSupply) - Number(totalSupply),
      };
    } catch (error) {
      console.error("Failed to get event details:", error);
      return null;
    }
  }
}

export const mvpSmartContractService = new MVPSmartContractService();