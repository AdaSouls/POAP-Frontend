import react, { createContext, useCallback, useContext, useReducer } from 'react';
import useCardano from './useCardano';
import useEthereum from './useEthereum';
import {
  Blockfrost
} from "https://unpkg.com/lucid-cardano@0.10.7/web/mod.js";

const DrawerContext = createContext(null);
const DrawerDispatchContext = createContext(null);

export function DrawerProvider({ children }) {
  const cardanoState = useCardano(
    {
      network: process.env.REACT_APP_BLOCKFROST_NETWORK, 
      provider: new Blockfrost(
          process.env.REACT_APP_BLOCKFROST_URL,
          process.env.REACT_APP_BLOCKFROST_PROJECT_ID
      )
    }
  );
  
  const ethereumState = useEthereum();

  const initialState = {  
    cardano: cardanoState,
    ethereum: ethereumState,
    showCardanoWallet: false,
    showEthereumWallet: false,
    createSoul: false,
    createSoulToken: false,
    createPoap: false,
    createEvent: false,
    createIssuer: false,
    checkCollection: false,
    viewToken: false,
    open: false,
    poapEvents: [],
    poapCollection: [],
    poapIssuer: null,
  };

  const [state, dispatch] = useReducer(
    drawerReducer,
    initialState
  );

  return (
    <DrawerContext.Provider value={state}>
      <DrawerDispatchContext.Provider value={dispatch}>
        {children}
      </DrawerDispatchContext.Provider>
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  return useContext(DrawerContext);
}

export function useDrawerDispatch() {
  return useContext(DrawerDispatchContext);
}


function drawerReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_ETHEREUM_WALLET':
      return { 
        ...state, 
        ethereum: {
          ...state.ethereum,
          provider: action.payload
        }
      };
    case 'UPDATE_CARDANO_WALLET':
      return { 
        ...state, 
        cardano: {
          ...state.cardano,
          wallet: action.payload
        }
      };
    case 'SHOW_CARDANO_WALLET':
      return {
        ...state,
        showCardanoWallet: true,
        showEthereumWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true,
      };
    case 'SHOW_ETHEREUM_WALLET':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: true,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true
      };
    case 'CREATE_SOUL':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: true,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true
      };
    case 'CREATE_SOUL_TOKEN':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createSoulToken: true,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true,
        collection: action.payload
      };
    case 'CHECK_COLLECTION':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: true,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true, 
        items: action.payload
      };
    case 'VIEW_TOKEN':
        return {
          ...state,
          showCardanoWallet: false,
          showEthereumWallet: false,
          createSoul: false,
          createSoulToken: false,
          createPoap: false,
          createEvent: false,
          createIssuer: false,
          createOwner: false,
          checkCollection: false,
          viewEvent: false,
          viewPoapToken: false,
          viewToken: true,
          open: true, 
          token: action.payload
        };
    case 'VIEW_EVENT':
        return {
          ...state,
          showCardanoWallet: false,
          showEthereumWallet: false,
          createSoul: false,
          createSoulToken: false,
          createPoap: false,
          createEvent: false,
          createIssuer: false,
          createOwner: false,
          checkCollection: false,
          viewEvent: true,
          viewPoapToken: true,
          viewToken: false,
          open: true, 
          event: action.payload
        };
    case 'VIEW_POAP_TOKEN':
        return {
          ...state,
          showCardanoWallet: false,
          showEthereumWallet: false,
          createSoul: false,
          createSoulToken: false,
          createPoap: false,
          createEvent: false,
          createIssuer: false,
          createOwner: false,
          checkCollection: false,
          viewEvent: false,
          viewPoapToken: true,
          viewToken: false,
          open: true, 
          poap: action.payload
        };
    case 'CLOSE_DRAWER':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: false
      };
    case 'CREATE_POAP':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: true,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true
      };
    case 'CREATE_EVENT':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: true,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true
      };
    case 'CREATE_ISSUER':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: true,
        createOwner: false,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true
      };
    case 'CREATE_OWNER':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: true,
        checkCollection: false,
        viewEvent: false,
        viewPoapToken: false,
        viewToken: false,
        open: true
      };
    case 'UPDATE_EVENTS':
      return {
        ...state,
        poapEvents: action.payload
      };
    case 'UPDATE_ISSUER':
      return {
        ...state,
        poapIssuer: action.payload
      };
    case 'UPDATE_OWNER':
      return {
        ...state,
        poapOwner: action.payload
      };
    case 'UPDATE_POAPS':
      return {
        ...state,
        poapCollection: action.payload
      };
    default:
      return state;
  }
}
