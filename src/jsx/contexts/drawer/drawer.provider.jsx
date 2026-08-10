import { createContext, useContext, useReducer, useEffect } from 'react';
import useCardano from './useCardano';
import useMidnight from './useMidnight';
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

  const midnightState = useMidnight();

  const initialState = {
    cardano: cardanoState,
    midnight: midnightState,
    showCardanoWallet: false,
    showMidnightWallet: false,
    createSoul: false,
    createSoulToken: false,
    createPoap: false,
    createEvent: false,
    createIssuer: false,
    checkCollection: false,
    viewToken: false,
    createMint: false,
    open: false,
    poapEvents: [],
    poapCollection: [],
    poapIssuer: null,
  };

  const [state, dispatch] = useReducer(
    drawerReducer,
    initialState
  );

  // useReducer only reads `initialState` once, on mount — after that, `state.midnight` only
  // changes when something dispatches UPDATE_MIDNIGHT_WALLET. laceWallet.jsx's manual "Connect
  // Lace" flow already does this itself, but useMidnight's own mock-mode auto-connect effect
  // (see useMidnight.js) only updates its own local state, with no dispatch access — without this
  // mirror, that update would never reach useDrawer() consumers (header.jsx, mySubscriptions.jsx,
  // etc.), which would keep reading the stale `provider: null` from the initial render forever.
  useEffect(() => {
    dispatch({ type: 'UPDATE_MIDNIGHT_WALLET', payload: midnightState.provider });
  }, [midnightState.provider]);

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
    case 'UPDATE_MIDNIGHT_WALLET':
      return {
        ...state,
        midnight: {
          ...state.midnight,
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
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: false,
        open: true,
      };
    case 'SHOW_MIDNIGHT_WALLET':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: true,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: false,
        open: true
      };
    case 'CREATE_SOUL':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: true,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: false,
        open: true
      };
    case 'CREATE_SOUL_TOKEN':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: true,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: false,
        open: true,
        collection: action.payload
      };
    case 'CHECK_COLLECTION':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: true,
        viewToken: false,
        createMint: false,
        open: true, 
        items: action.payload
      };
    case 'VIEW_TOKEN':
        return {
          ...state,
          showCardanoWallet: false,
          showMidnightWallet: false,
          createSoul: false,
          createSoulToken: false,
          createPoap: false,
          createEvent: false,
          createIssuer: false,
          createOwner: false,
          checkCollection: false,
          viewToken: true,
          createMint: false,
          open: true,
          token: action.payload
        };
    case 'CREATE_MINT':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: true,
        open: true,
        mintEvent: action.payload
      };
    case 'CLOSE_DRAWER':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: false,
        open: false
      };
    case 'CREATE_POAP':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: true,
        createEvent: false,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: false,
        open: true
      };
    case 'CREATE_EVENT':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: true,
        createIssuer: false,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: false,
        open: true
      };
    case 'CREATE_ISSUER':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: true,
        createOwner: false,
        checkCollection: false,
        viewToken: false,
        createMint: false,
        open: true
      };
    case 'CREATE_OWNER':
      return {
        ...state,
        showCardanoWallet: false,
        showMidnightWallet: false,
        createSoul: false,
        createSoulToken: false,
        createPoap: false,
        createEvent: false,
        createIssuer: false,
        createOwner: true,
        checkCollection: false,
        viewToken: false,
        createMint: false,
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
