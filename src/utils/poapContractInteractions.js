import { ethers } from "ethers";
// const { ethers } = require('ethers');
// import dotenv from "dotenv";
// import path from "path";
import poapContractJson from "./Poap.json";
import {
  errorFunction,
  succesfullBlockchainCreation,
  loadingFunction,
} from "../jsx/toasts/sweetAlerts";
// const poapContractJson = require('./Poap.json');

// dotenv.config({ path: path.join(__dirname, "../.././env") });

const {
  // REACT_APP_DEV_OWNER_ADDRESS,
  REACT_APP_POAP_CONTRACT_ADDRESS_POLYGON_AMOY,
  REACT_APP_MNEMONIC_DEVNET,
  REACT_APP_POLYGON_AMOY_RPC,
  REACT_APP_POAP_CONTRACT_ADDRESS_HARDHAT,
  REACT_APP_HARDHAT_PK_0,
} = process.env;

// Hardhat Localhost Provider
const providerRPC = {
  name: "localhost",
  rpc: "http://localhost:8545",
  chainId: 31337,
};

// Polygon Amoy Provider
// const providerRPC = {
//   name: "Amoy",
//   rpc: REACT_APP_POLYGON_AMOY_RPC,
//   chainId: 80002,
// };

const provider = new ethers.JsonRpcProvider(providerRPC.rpc, {
  chainId: providerRPC.chainId,
  name: providerRPC.name,
});

const poapContractAbi = poapContractJson;
const poapContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// const poapContractAddress = REACT_APP_POAP_CONTRACT_ADDRESS_POLYGON_AMOY;

// let wallet = ethers.Wallet.fromPhrase(REACT_APP_MNEMONIC_DEVNET);
// wallet = wallet.connect(provider);

// Create a wallet instance from private key
const wallet = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);

/**
 *
 * @param issuerId: number
 * @param eventId: number
 * @param maxSupply: number
 * @param mintExpiration: number
 * @param eventOrganizer: string
 *
 */
export const createEventId = async (
  issuerId,
  eventId,
  maxSupply,
  mintExpiration,
  eventOrganizer,
  ethereum
) => {
  // console.log("🚀 ~ issuerId:", issuerId);
  // console.log("🚀 ~ eventId:", eventId);
  // console.log("🚀 ~ maxSupply:", maxSupply);
  // console.log("🚀 ~ mintExpiration:", mintExpiration);
  // console.log("🚀 ~ eventOrganizer:", eventOrganizer);

  // 1. Connect to MetaMask
  const provider = new ethers.BrowserProvider(ethereum);
  await provider.send("eth_requestAccounts", []);

  // 2. Get the connected signer
  const signer = await provider.getSigner();
  try {
    const poapContract = await new ethers.Contract(
      poapContractAddress,
      poapContractAbi,
      signer
    );
    // const gasPrice = (await provider.getFeeData()).gasPrice;
    const createReceipt = await poapContract.createEventId(
      issuerId,
      eventId,
      maxSupply,
      mintExpiration,
      eventOrganizer,
      {
        // gasPrice,
        gasLimit: 1000000,
        // gasLimit: ethers.parseUnits('800000', 'wei'),
        //value: tokenPrice.toString(),
      }
    );
    console.log("🚀 ~ createReceipt:", createReceipt);
    loadingFunction("Creating Event", "Please wait...", "");

    const receipt = await createReceipt.wait();
    console.log("🚀 ~ receipt:", receipt);

    succesfullBlockchainCreation(
      "Event Created",
      "Event created successfully.",
      `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`
    );

    return receipt;
  } catch (error) {
    if (error.code === 4001) {
      console.error("User denied transaction signature:", error);
      errorFunction(
        "Transaction Rejected",
        "Please approve the transaction in MetaMask.",
        ""
      );
    } else {
      console.error("Failed to create event ID:", error);
      console.error("Error message:", error.message);
      errorFunction(
        "Error",
        "An error occurred while creating the event. Please try again.",
        ""
      );
    }
  }
};

// export const getTokenEventId = async (tokenId: number) => {
export const getTokenEventId = async (tokenId, signer) => {
  try {
    const poapContract = new ethers.Contract(
      poapContractAddress,
      poapContractAbi,
      signer
    );
    const txResponse = await poapContract.tokenEvent(tokenId);
    console.log("Transaction submitted:", txResponse.hash);
    const receipt = await txResponse.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    return receipt;
  } catch (error) {
    console.error("Failed to get Token Event ID:", error);
    throw error;
  }
};

export const getOwner = async (signer) => {
  try {
    const poapContract = new ethers.Contract(
      poapContractAddress,
      poapContractAbi,
      signer
    );
    const txResponse = await poapContract.owner();
    console.log("getOwner Transaction response:", txResponse);
    return txResponse;
  } catch (error) {
    console.error("Failed to get Owner:", error);
    throw error;
  }
};

// export const isAdmin = async (address: string) => {
export const isAdmin = async (address, signer) => {
  try {
    const poapContract = new ethers.Contract(
      poapContractAddress,
      poapContractAbi,
      signer
    );
    const txResponse = await poapContract.isAdmin(address);
    console.log("isAdmin Transaction response:", txResponse);
    return txResponse;
  } catch (error) {
    console.error("Failed to check if is Admin:", error);
    throw error;
  }
};

// issuerId: number,
// eventId: number,
// to: string,
// // initialData: string
export const mintToken = async (issuerId, eventId, to, ethereum) => {
  // 1. Connect to MetaMask
  const provider = new ethers.BrowserProvider(ethereum);
  await provider.send("eth_requestAccounts", []);

  // 2. Get the connected signer
  const signer = await provider.getSigner();
  try {
    const poapContract = new ethers.Contract(
      poapContractAddress,
      poapContractAbi,
      signer
    );
    // const gasPrice = (await provider.getFeeData()).gasPrice;
    const createReceipt = await poapContract.mintToken(issuerId, eventId, to, {
      // gasPrice,
      gasLimit: 800000,
    });
    console.log("🚀 ~ createReceipt:", createReceipt);
    loadingFunction("Minting Token", "Please wait...", "");
    const receipt = await createReceipt.wait();
    console.log("🚀 ~ receipt:", receipt);
    // console.log("mintToken Transaction response:", receipt);
    succesfullBlockchainCreation(
      "Token Minted",
      "Token minted successfully.",
      `https://amoy.polygonscan.com/tx/${receipt.transactionHash}`
    );
    return receipt;
  } catch (error) {
    if (error.code === 4001) {
      console.error("User denied transaction signature:", error);
      // alert(
      //   "Transaction was rejected. Please approve the transaction in MetaMask."
      // );
      errorFunction(
        "Transaction Rejected",
        "Please approve the transaction in MetaMask.",
        ""
      );
    } else {
      // Handle other errors
      console.error("Failed to create event ID:", error);
      errorFunction(
        "Error",
        "An error occurred while creating the event. Please try again.",
        ""
      );
      // alert("An error occurred while creating the event. Please try again.");
    }
  }
};

// eventId: number,
// to: string[],
// initialData: string
export const mintEventToManyUsers = async (
  eventId,
  to,
  initialData,
  signer
) => {
  try {
    const poapContract = new ethers.Contract(
      poapContractAddress,
      poapContractAbi,
      signer
    );
    const txResponse = await poapContract.mintToken(eventId, to, initialData);
    console.log("mintToken Transaction response:", txResponse);
    return txResponse;
  } catch (error) {
    console.error("Failed to mint Event to many Users:", error);
    throw error;
  }
};

// eventIds: number[],
// to: string,
// initialData: string
export const mintUserToManyEvents = async (
  eventIds,
  to,
  initialData,
  signer
) => {
  try {
    const poapContract = new ethers.Contract(
      poapContractAddress,
      poapContractAbi,
      signer
    );
    const txResponse = await poapContract.mintToken(eventIds, to, initialData);
    console.log("mintToken Transaction response:", txResponse);
    return txResponse;
  } catch (error) {
    console.error("Failed to mint User to many Events:", error);
    throw error;
  }
};

// export const ownerOf = async (tokenId: number) => {
export const ownerOf = async (tokenId, signer) => {
  try {
    const poapContract = new ethers.Contract(
      poapContractAddress,
      poapContractAbi,
      signer
    );
    const txResponse = await poapContract.ownerOf(tokenId);
    console.log("mintToken Transaction response:", txResponse);
    return txResponse;
  } catch (error) {
    console.error("Failed to create event ID:", error);
    throw error;
  }
};

export const getEvents = async () => {
  const poapContract = new ethers.Contract(
    poapContractAddress,
    poapContractAbi,
    wallet
  );
  console.log("In getEvents");

  try {
    // Create a filter for the EventCreated event
    // const eventFilter = poapContract.filters;
    // console.log("🚀 ~ getEvents ~ eventFilter:", eventFilter);
    // const eventCreated = poapContract.filters.EventCreated();
    // console.log("🚀 ~ getEvents ~ eventFilter:", eventCreated);

    // Get all past EventCreated events
    const events = await poapContract.queryFilter(
      "EventCreated",
      1,
      // 12722760,
      "latest"
    );
    // console.log("🚀 ~ getEvents ~ events:", events[0])
    // console.log("🚀 ~ getEvents ~ events:", events);

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
      // Check if maxSupply is greater than zero
      if (maxSupply > 0) {
        const eventTotalSupply = await poapContract.getEventTotalSupply(
          eventId
        );

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
        });
      }
    }

    eventData.sort((a, b) => a.isExpired - b.isExpired);

    // console.log("Events with non-zero max supply:", eventData);
    return eventData;
  } catch (error) {
    console.error("Failed to get Events:", error);
    return [];
  }
};

export const getPoaps = async (signer) => {
  const poapContract = new ethers.Contract(
    poapContractAddress,
    poapContractAbi,
    signer
  );
  console.log("In getPoaps");

  try {
    // Create a filter for the EventCreated event
    const poapFilter = poapContract.filters;
    console.log("🚀 ~ getPoaps ~ poapFilter:", poapFilter);
    const poapMinted = poapContract.filters.TokenMinted();
    console.log("🚀 ~ getPoaps ~ eventFilter:", poapMinted);

    // Get all past EventCreated events
    const poaps = await poapContract.queryFilter(
      "TokenMinted",
      12722760,
      "latest"
    );
    console.log("🚀 ~ getPoaps ~ poaps:", poaps);

    const poapData = [];

    for (const poap of poaps) {
      const { issuerId, eventId, tokenId } = poap.args;
      console.log("🚀 ~ getPoaps ~ poap.args:", poap.args);

      const issuerIdNumber = Number(issuerId);
      const eventIdNumber = Number(eventId);
      const tokenIdNumber = Number(tokenId);

      poapData.push({
        issuerId: issuerIdNumber,
        eventId: eventIdNumber,
        tokenId: tokenIdNumber,
      });
    }
    console.log("Events with non-zero max supply:", poapData);
    return poapData;
  } catch (error) {
    console.error("Failed to get Events:", error);
    return [];
  }
};

export const getMintedTokensByAddress = async (address, signer, events) => {
  // Replace with your contract address and ABI
  const poapContract = new ethers.Contract(
    poapContractAddress,
    poapContractAbi,
    signer
  );

  try {
    // Get the number of tokens owned by the address
    const balance = await poapContract.balanceOf(address);
    console.log(`Address ${address} owns ${balance.toString()} tokens.`);

    const tokens = [];

    // Create a Map with eventId as the key for faster lookups
    const eventMap = new Map(events.map((event) => [event.eventId, event]));

    // Iterate through each token index to get the token IDs and associated event IDs
    for (let i = 0; i < balance; i++) {
      const { tokenId, eventId } =
        await poapContract.tokenDetailsOfOwnerByIndex(address, i);
      const event = eventMap.get(Number(eventId));
      tokens.push({
        tokenId: Number(tokenId),
        eventId: Number(eventId),
        maxSupply: event.maxSupply,
        issuerId: event.issuerId,
      });
    }
    return tokens;
  } catch (error) {
    console.error("Failed to get minted tokens for the address:", error);
    return [];
  }
};

export const checkEventsMintedByAddress = (events, mintedTokens) => {
  // Step 1: Create a Set of minted eventIds for quick lookup
  const mintedEventIds = new Set(mintedTokens.map((token) => token.eventId));

  // Step 2: Map through events to check if each eventId is in mintedEventIds
  const eventsWithMintStatus = events.map((event) => {
    const isMinted = mintedEventIds.has(event.eventId); // Check if eventId is in the Set
    return {
      ...event,
      isMinted, // Add a property indicating whether the event was minted by this address
    };
  });

  // console.log("Events with mint status:", eventsWithMintStatus);
  return eventsWithMintStatus;
};
