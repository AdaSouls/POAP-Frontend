import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DrawerContext, DrawerDispatchContext } from './jsx/contexts/drawer/drawer.provider';
import { UserRolesContext } from './jsx/contexts/user-roles/user-roles.provider';

// Mock drawer context
export const mockDrawerContext = {
  cardano: {
    wallet: null,
  },
  midnight: {
    provider: null,
    connecting: false,
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
  poapEvents: [],
  poapCollection: [],
  poapIssuer: null,
  showCardanoWallet: false,
  showMidnightWallet: false,
  createSoul: false,
  createPoap: false,
  createEvent: false,
  open: false,
};

export const mockDrawerDispatch = jest.fn();

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

// Mock user roles context
export const mockUserRoles = {
  userRoles: [],
  isAdmin: false,
  isIssuer: false,
  isAttendee: false,
  issuerId: null,
  isInitialized: true,
  isLoading: false,
  initializeUserRole: jest.fn(),
  resetRoles: jest.fn(),
};

// Custom render function with router and context
export const renderWithProviders = (
  ui,
  {
    drawerValue = mockDrawerContext,
    drawerDispatch = mockDrawerDispatch,
    userRolesValue = mockUserRoles,
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <MockDrawerProvider value={drawerValue} dispatch={drawerDispatch}>
        <UserRolesContext.Provider value={userRolesValue}>
          {children}
        </UserRolesContext.Provider>
      </MockDrawerProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export testing library helpers for convenience
export * from '@testing-library/react';
export { renderWithProviders as render };


