import { useState, useMemo, useCallback } from "react";
import { ethers } from "ethers";

// BNB TESTNET
//
// const DESIRED_CHAIN_ID = "0x61";
// const DESIRED_CHAIN_PARAMS = {
//   chainId: DESIRED_CHAIN_ID,
//   chainName: "BNB Chain Testnet",
//   nativeCurrency: {
//     name: "tBNB",
//     symbol: "tBNB",
//     decimals: 18,
//   },
//   rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545/"],
//   blockExplorerUrls: ["https://testnet.bscscan.com/"],
// };

// MILKOMEDA C1 TESTNET
//
// const DESIRED_CHAIN_ID = "0x30da5";
// const DESIRED_CHAIN_PARAMS = {
//   chainId: DESIRED_CHAIN_ID,
//   chainName: "Milkomeda C1 Testnet",
//   nativeCurrency: {
//     name: "mTAda",
//     symbol: "mTAda",
//     decimals: 18,
//   },
//   rpcUrls: ["https://rpc-devnet-cardano-evm.c1.milkomeda.com"],
//   blockExplorerUrls: ["https://explorer-devnet-cardano-evm.c1.milkomeda.com"],
// };

// POLYGON AMOY TESTNET
const DESIRED_CHAIN_ID = "80002";
const DESIRED_CHAIN_PARAMS = {
  chainId: DESIRED_CHAIN_ID,
  chainName: "Amoy",
  nativeCurrency: {
    name: "Test POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};

/**
// HARDHAT LOCALHOST
 */
// chain id: 31337
// const DESIRED_CHAIN_ID = "0x7a69";
// const DESIRED_CHAIN_PARAMS = {
//   chainId: DESIRED_CHAIN_ID,
//   chainName: "Localhost 8545",
//   nativeCurrency: {
//     name: "ETH",
//     symbol: "ETH",
//     decimals: 18,
//   },
//   rpcUrls: ["http://localhost:8545"],
//   // blockExplorerUrls: ["https://amoy.polygonscan.com/"],
// };

const useEthereum = () => {
  const [provider, setCurrentProvider] = useState(null);

  const setProvider = useCallback(async (provider, wallet) => {
    if (!provider) {
      setCurrentProvider(null);
      return Promise.resolve(null);
    }

    try {
      // 1. Request account access
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // 2. Get the current chainId
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      const DESIRED_CHAIN_ID_CHECK = "0x13882";
      // 3. Check if the current chainId matches the desired one
      if (currentChainId !== DESIRED_CHAIN_ID_CHECK) {
        // 4. Attempt to switch to the desired network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: DESIRED_CHAIN_ID_CHECK }],
        });
      } else {
      }
    } catch (error) {
      if (error.code === 4902) {
        try {
          // 5. If the network is not added, add it
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [DESIRED_CHAIN_PARAMS],
          });
        } catch (addError) {
          console.error("Failed to add the desired network:", addError);
        }
      } else {
        console.error("Failed to connect or switch network:", error);
      }
    }

    const api = new ethers.BrowserProvider(window.ethereum);
    // const api = new ethers.BrowserProvider(window.ethereum, "any", { chainId: DESIRED_CHAIN_ID });
    const networkId = await api.getNetwork();
    const signer = await api.getSigner();
    const address = await signer.getAddress();
    // const balance = api.getBalance(address);
    // const balanceFormated = formatEther(balance);
    const newWalletState = {
      ...provider,
      api,
      signer,
      wallet,
      address,
      chainId: networkId.chainId,
      // balanceFormated: balanceFormated ? balanceFormated : 0,
    };
    setCurrentProvider(newWalletState);
    return newWalletState;
  }, []);

  const value = useMemo(
    () => ({
      provider,
      setProvider,
    }),
    [provider, setProvider]
  );
  return value;
};

export default useEthereum;
