import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LaceWallet from '../../../jsx/drawer/views/laceWallet';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { discoverCompatibleWallets } from '../../../midnight/providers';

// Fully mocked, not requireActual — the real module pulls in the Midnight SDK's `effect` package,
// which needs a TextEncoder global jsdom's test environment doesn't provide, and this component
// only needs these three named exports anyway (see CLAUDE.md: services/wallet integrations are
// mocked in tests, never exercised for real).
jest.mock('../../../midnight/providers', () => ({
  discoverCompatibleWallets: jest.fn(),
  getWalletDisplayName: (api) => api.name,
  LaceNotFoundError: class LaceNotFoundError extends Error {
    constructor() {
      super('LaceNotFoundError');
      this.name = 'LaceNotFoundError';
    }
  },
}));

const laceApi = { rdns: 'io.lace.wallet', name: 'Lace', apiVersion: '1.0.0', connect: jest.fn() };
const oneAmApi = { rdns: 'com.midnight.1am', name: '1am', apiVersion: '1.0.0', connect: jest.fn() };

describe('LaceWallet drawer view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects every compatible wallet and lets the wallet-agnostic Connect button connect to the one selected', async () => {
    discoverCompatibleWallets.mockResolvedValue([laceApi, oneAmApi]);
    const connect = jest.fn().mockResolvedValue({ address: 'aa'.repeat(32) });
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, connect },
    };
    renderWithProviders(<LaceWallet />, { drawerValue });

    // Both wallets show up, Lace pre-selected (first result) by default. Each wallet card's
    // accessible name is "<name> Midnight Network wallet" (the button wraps both lines), so these
    // match on the leading wallet name rather than anchoring the whole string.
    await screen.findByRole('button', { name: /^Lace/i });
    expect(screen.getByRole('button', { name: /^1am/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /connect lace/i })).toBeInTheDocument();

    // Picking the second wallet updates which one Connect targets.
    await userEvent.click(screen.getByRole('button', { name: /^1am/i }));
    expect(screen.getByRole('button', { name: /connect 1am/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /connect 1am/i }));
    expect(connect).toHaveBeenCalledWith(oneAmApi);
  });

  it('shows a not-found message when no compatible wallet is detected', async () => {
    discoverCompatibleWallets.mockResolvedValue([]);
    renderWithProviders(<LaceWallet />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/no compatible midnight wallet found/i);
    });
    expect(screen.queryByRole('button', { name: /^Lace/i })).not.toBeInTheDocument();
  });

  it('skips wallet discovery entirely when the drawer opens already connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: {
        ...mockDrawerContext.midnight,
        provider: { address: 'aa'.repeat(32), wallet: 'Lace' },
      },
    };
    renderWithProviders(<LaceWallet />, { drawerValue });

    expect(discoverCompatibleWallets).not.toHaveBeenCalled();
    expect(screen.getByText(/^Lace$/i)).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });
});
