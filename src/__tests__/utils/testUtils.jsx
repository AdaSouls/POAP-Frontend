import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock drawer context
export const mockDrawerContext = {
  cardano: {
    wallet: null,
  },
  ethereum: {
    provider: null,
    address: null,
  },
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

export const mockDrawerDispatch = jest.fn();

// Create mock contexts
const DrawerContext = React.createContext(null);
const DrawerDispatchContext = React.createContext(null);

// Mock drawer provider component
export const MockDrawerProvider = ({ children, value = mockDrawerContext, dispatch = mockDrawerDispatch }) => {
  return (
    <DrawerContext.Provider value={value}>
      <DrawerDispatchContext.Provider value={dispatch}>
        {children}
      </DrawerDispatchContext.Provider>
    </DrawerContext.Provider>
  );
};

// Custom render function with router and context
export const renderWithProviders = (
  ui,
  {
    drawerValue = mockDrawerContext,
    drawerDispatch = mockDrawerDispatch,
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <MockDrawerProvider value={drawerValue} dispatch={drawerDispatch}>
        {children}
      </MockDrawerProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock user roles context
export const mockUserRoles = {
  userRoles: [],
  isAdmin: false,
  isIssuer: false,
  issuerId: null,
  isInitialized: false,
  isLoading: false,
};

// Export everything
export * from '@testing-library/react';
export { renderWithProviders as render };

