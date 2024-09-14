import { useState, useMemo, useCallback, useEffect } from "react";
import { ethers, formatEther } from "ethers";

const useEthereum = () => {
  const [provider, setCurrentProvider] = useState(null);

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
  //
  const DESIRED_CHAIN_ID = "0x13882";
  const DESIRED_CHAIN_PARAMS = {
    chainId: DESIRED_CHAIN_ID,
    chainName: "Polygon Amoy Testnet",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://rpc-amoy.polygon.technology/"],
    blockExplorerUrls: ["https://amoy.polygonscan.com/"],
  };

  const setProvider = useCallback(async (provider, wallet) => {
    if (!provider) {
      setCurrentProvider(null);
      return Promise.resolve(null);
    }

    try {
      // 1. Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected accounts:", accounts);

      // 2. Get the current chainId
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      console.log("Current chainId:", currentChainId);

      // 3. Check if the current chainId matches the desired one
      if (currentChainId !== DESIRED_CHAIN_ID) {
        // 4. Attempt to switch to the desired network
        console.log("Switching to the desired network...");
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: DESIRED_CHAIN_ID }],
        });
        console.log(
          "Current chainId after request switching network:",
          currentChainId
        );
        console.log("Switched to desired network!");
      } else {
        console.log("Already connected to the desired network");
      }
    } catch (error) {
      if (error.code === 4902) {
        try {
          // 5. If the network is not added, add it
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [DESIRED_CHAIN_PARAMS],
          });
          console.log("Added and switched to the desired network!");
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
    console.log("🚀 ~ setProvider ~ newWalletState:", newWalletState);
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
