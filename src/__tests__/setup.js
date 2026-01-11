// Global test setup file
// This file is automatically loaded by Jest before tests run

// Mock Layout component globally
jest.mock('../jsx/layout/layout', () => {
  return function MockLayout({ children, activeMenu }) {
    return <div data-testid="layout" data-active-menu={activeMenu}>{children}</div>;
  };
});

// Mock drawer provider globally
jest.mock('../jsx/contexts/drawer/drawer.provider', () => {
  const React = require('react');
  const DrawerContext = React.createContext(null);
  const DrawerDispatchContext = React.createContext(null);
  
  const mockDrawerContext = {
    cardano: { wallet: null },
    ethereum: { provider: null, address: null },
    poapEvents: [],
    poapCollection: [],
    poapIssuer: null,
    showCardanoWallet: false,
    showEthereumWallet: false,
    createSoul: false,
    createPoap: false,
    createEvent: false,
    open: false,
  };
  
  const mockDrawerDispatch = jest.fn();
  
  return {
    DrawerContext,
    DrawerDispatchContext,
    DrawerProvider: ({ children }) => children,
    useDrawer: () => mockDrawerContext,
    useDrawerDispatch: () => mockDrawerDispatch,
  };
});

