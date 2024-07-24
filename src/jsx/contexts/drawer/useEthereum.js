
import { useState, useMemo, useCallback, useEffect } from 'react';
import { ethers, formatEther } from 'ethers';

const useEthereum = () => {

  const [provider, setCurrentProvider] = useState(null);

  const setProvider = useCallback(async (provider, wallet) => {
    try {

      if (!provider) {
        setCurrentProvider(null);
        return Promise.resolve(null);
      }

      // ADD CHAIN
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: "0x30da5",
            rpcUrls: ["https://rpc-devnet-cardano-evm.c1.milkomeda.com"],
            chainName: "Milkomeda C1 Testnet",
            nativeCurrency: {
              name: "mTAda",
              symbol: "mTAda", // 2-6 characters long
              decimals: 18,
            },
            blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
          },
        ],
      }) 

      // SWITCH CHAIN
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x30da5' }],
      })

      const api = new ethers.BrowserProvider(provider);
      const networkId = await api.getNetwork();
      const signer = await api.getSigner();
      const address = await signer.getAddress();    
      const balance = await api.getBalance(address);
      const balanceFormated = formatEther(balance);

      // const url = "https://rpc-devnet-cardano-evm.c1.milkomeda.com";  
      // const api = new ethers.JsonRpcProvider(url);
      // const account0 = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
      // const signer = new ethers.Wallet(account0, api);   

      const newWalletState = { ...provider, api, signer, wallet, address, chainId : networkId.chainId, balanceFormated };
      setCurrentProvider(newWalletState);
      return newWalletState;
      

    } catch (e) {      
      if(e.code == 4902){
        console.log("Please Add Chain")
      } else {
        console.log(e);
      }

    }
  }, []);

  // const setProvider = useCallback(async (provider, wallet) => {

  //   try {
  //     if (!provider) {
  //       setCurrentProvider(null);
  //       return Promise.resolve(null);
  //     }

  //     const api = await provider.enable();
     
  //     const accounts = await provider.request({
  //       method: "eth_requestAccounts"
  //     });
  //     // const signer = provider.getSigner();
      
  //     const account = (accounts[0]);       
      
  //     // Get current chain ID for connected wallet
  //     const viewChainId = await provider.request({
  //       method: "eth_chainId"
  //     });
            
  //     const chainId = (Number(viewChainId));
  //     const newWalletState = { ...provider, chainId: chainId, account: account, api: api, wallet: wallet };
  //     setCurrentProvider(newWalletState);
  //     return newWalletState;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }, []);

  const value = useMemo(() => ({
    provider,
    setProvider,
}), [provider, setProvider]);

return value;
  
};

export default useEthereum;
