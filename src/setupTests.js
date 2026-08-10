// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// ----------------------------
// Global test setup & mocks
// ----------------------------

// jsdom doesn't implement the Clipboard API — needed by anything using navigator.clipboard.writeText
// (e.g. the "copy share link" / "copy tx hash" buttons in viewPoap.jsx, mySubscriptions.jsx).
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: jest.fn() },
    writable: true,
  });
}

// jsdom doesn't implement IntersectionObserver — needed by framer-motion's `whileInView` prop
// (scroll-reveal animations, e.g. index.jsx's use-case rows). A no-op stub is enough: tests query
// rendered DOM content, not the animated visual state, so it never needs to actually fire.
if (!window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock Cardano-related Lucid imports to avoid loading browser modules in tests
jest.mock('./jsx/contexts/drawer/useCardano', () => {
  return function useCardanoMock() {
    return {
      wallet: null,
      setWallet: jest.fn(),
    };
  };
});

jest.mock('./utils/util.ts', () => {
  // Return a minimal mock module without importing the real file,
  // to avoid resolving the browser Lucid module in tests.
  return {
    Lucid: {
      new: jest.fn(() => ({
        selectWallet: () => ({}),
        wallet: { address: jest.fn(async () => 'addr_test1...' ) },
        utils: {},
      })),
    },
    applyParamsToScript: jest.fn(),
    applyDoubleCborEncoding: jest.fn(),
    Data: {},
    SpendingValidator: jest.fn(),
    MintingPolicy: jest.fn(),
    toHex: jest.fn(),
    fromText: jest.fn(),
  };
});

jest.mock('./utils/util', () => {
  return {
    Lucid: {
      new: jest.fn(() => ({
        selectWallet: () => ({}),
        wallet: { address: jest.fn(async () => 'addr_test1...' ) },
        utils: {},
      })),
    },
  };
});

// Mock react-apexcharts globally — it renders to canvas/SVG via browser APIs jsdom doesn't
// implement (ResizeObserver etc.), which crashes the real component in tests. Tests that care
// about chart data can assert on these props instead.
jest.mock('react-apexcharts', () => {
  return function MockChart({ type, series, options }) {
    return (
      <div
        data-testid="apex-chart"
        data-chart-type={type}
        data-series={JSON.stringify(series)}
        data-labels={JSON.stringify(options?.labels || options?.xaxis?.categories || [])}
      />
    );
  };
});

// Mock Layout component globally
jest.mock('./jsx/layout/layout', () => {
  return function MockLayout({ children, activeMenu }) {
    return <div data-testid="layout" data-active-menu={activeMenu}>{children}</div>;
  };
});

// Mock drawer provider globally, but keep it context-driven so tests can inject values
jest.mock('./jsx/contexts/drawer/drawer.provider', () => {
  const React = require('react');
  const { createContext, useContext } = React;

  const DrawerContext = createContext(null);
  const DrawerDispatchContext = createContext(null);

  const defaultDrawerContext = {
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

  const DrawerProvider = ({ children, value, dispatch = () => {} }) => (
    <DrawerContext.Provider value={value || defaultDrawerContext}>
      <DrawerDispatchContext.Provider value={dispatch}>
        {children}
      </DrawerDispatchContext.Provider>
    </DrawerContext.Provider>
  );

  const useDrawer = () => useContext(DrawerContext);
  const useDrawerDispatch = () => useContext(DrawerDispatchContext);

  return {
    DrawerContext,
    DrawerDispatchContext,
    DrawerProvider,
    useDrawer,
    useDrawerDispatch,
  };
});
