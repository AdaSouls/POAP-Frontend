// import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';
// import { ethers } from 'ethers';
import coinbaseIcon from "../images/wallets/coinbase.jpg";
import metamaskIcon from "../images/wallets/metamask.jpg";
import trustIcon from "../images/wallets/trust.jpg";

// const APP_NAME = "My Demo App";
// const APP_LOGO_URL = "https://example.com/logo.png";
// const INFURA_KEY = process.env.INFURA_KEY;
// const INFURA_RPC_URL = `https://mainnet.infura.io/v3/${INFURA_KEY}`;
// const DEFAULT_CHAIN_ID = 200101;
// const RPC='https://rpc-devnet-cardano-evm.c1.milkomeda.com';

// Coinbase Provider
// export const getCoinbaseWalletProvider = () => {
//   const coinbaseWallet = new CoinbaseWalletSDK({
//     appName: APP_NAME,
//     appLogoUrl: APP_LOGO_URL,
//     darkMode: false,
//     overrideIsMetaMask: false
//   });
//   return coinbaseWallet.makeWeb3Provider(RPC, DEFAULT_CHAIN_ID);
// };

export const getEthereumWallet = (wallet) => {
  console.log(window.ethereum.providers);
  
  console.log("🚀 ~ getEthereumWal ~ window.ethereum:", window.ethereum.selectedAddress)

  switch(wallet.name) {
    case "Coinbase":
        return window.ethereum;
      case "MetaMask":
        return window.ethereum;
        //return window.ethereum?.providers?.find((p) => !!p.isMetaMask) ?? console.log("install")
      case "Trust":
        return window.ethereum;
    default:
        return console.log("install a web3 wallet");
      // code block
  }
};

export const ethWallets = [
  {
      "name": "Coinbase",
      "homepage": "",
      "code": "isCoinbaseWallet",
      "img": coinbaseIcon
  },
  {
      "name": "MetaMask",
      "homepage": "",
      "code": "isMetaMask",
      "img": metamaskIcon
  },
  {
      "name": "Trust",
      "homepage": "",
      "code": "IsTrustWallet",
      "img": trustIcon
  }
]




