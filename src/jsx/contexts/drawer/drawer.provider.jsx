import react, { createContext, useContext, useReducer } from 'react';

const DrawerContext = createContext(null);
const DrawerDispatchContext = createContext(null);

export function DrawerProvider({ children }) {
  const [state, dispatch] = useReducer(
    drawerReducer,
    initialState
  );

  console.log(state);
  
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
    case 'SHOW_CARDANO_WALLET':
      return {
        ...state,
        showCardanoWallet: true,
        showEthereumWallet: false,
        createSoul: false,
        createPoap: false,
        open: true,
      };
    case 'SHOW_ETHEREUM_WALLET':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: true,
        createSoul: false,
        createPoap: false,
        open: true
      };
    case 'CREATE_SOUL':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: true,
        createPoap: false,
        open: true
      };
    case 'CREATE_POAP':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createPoap: true,
        open: true
      };
    case 'CLOSE_DRAWER':
      return {
        ...state,
        showCardanoWallet: false,
        showEthereumWallet: false,
        createSoul: false,
        createPoap: false,
        open: false
      };
    default:
      return state;
  }
}

const initialState = {  
  showCardanoWallet: false,
  showEthereumWallet: false,
  createSoul: false,
  createPoap: false,
  open: false,
  items: []
};
