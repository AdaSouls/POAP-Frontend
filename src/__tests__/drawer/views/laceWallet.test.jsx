import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LaceWallet from '../../../jsx/drawer/views/laceWallet';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { discoverCompatibleWallets } from '../../../midnight/providers';
import { clearStoragePassword, requestPassword, storeRecoveryCode } from '../../../midnight/storage-password';

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

  afterEach(() => {
    clearStoragePassword();
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

  it('waits for a locked wallet to be unlocked and retries the connection on its own', async () => {
    discoverCompatibleWallets.mockResolvedValue([oneAmApi]);
    const lockedError = Object.assign(new Error('locked'), { name: 'LaceLockedError' });
    const connect = jest
      .fn()
      .mockRejectedValueOnce(lockedError)
      .mockResolvedValueOnce({ address: 'aa'.repeat(32) });
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, connect },
    };
    renderWithProviders(<LaceWallet />, { drawerValue });

    await userEvent.click(await screen.findByRole('button', { name: /connect 1am/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/1am wallet is locked/i);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Retry fires after UNLOCK_RETRY_INTERVAL_MS with no further click from the user.
    await waitFor(() => expect(connect).toHaveBeenCalledTimes(2), { timeout: 3000 });
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
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

  // connect() only waits on this step when the browser has no key for the wallet
  // (private-state-unlock.ts) — rendered through the real storage-password module.
  describe('identity step', () => {
    const renderWithPrompt = async (mode) => {
      discoverCompatibleWallets.mockResolvedValue([laceApi]);
      let submission;
      const connect = jest.fn(async () => {
        submission = await requestPassword(mode);
        return { address: 'aa'.repeat(32) };
      });
      const drawerValue = { ...mockDrawerContext, midnight: { ...mockDrawerContext.midnight, connect } };
      renderWithProviders(<LaceWallet />, { drawerValue });
      await userEvent.click(await screen.findByRole('button', { name: /connect lace/i }));
      return { getSubmission: () => submission };
    };

    it('welcomes a wallet new to this browser with a single Continue', async () => {
      const { getSubmission } = await renderWithPrompt('welcome');

      expect(await screen.findByText(/welcome to velum/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/recovery code/i)).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /^continue$/i }));

      await waitFor(() => expect(getSubmission()).toEqual({ kind: 'new' }));
    });

    it('offers restoring with a recovery code instead', async () => {
      const { getSubmission } = await renderWithPrompt('welcome');

      await userEvent.click(await screen.findByRole('button', { name: /restore with my recovery code/i }));
      await userEvent.type(screen.getByLabelText(/recovery code/i), 'ABCDE-FGHJK-MNPQR-STVWX-YZ012-34567');
      await userEvent.click(screen.getByRole('button', { name: /^restore$/i }));

      await waitFor(() =>
        expect(getSubmission()).toEqual({
          kind: 'restore',
          password: 'ABCDE-FGHJK-MNPQR-STVWX-YZ012-34567',
          source: { kind: 'cloud' },
        }),
      );
    });

    it('goes straight to restore for a locked identity, with starting over only behind a warning', async () => {
      const { getSubmission } = await renderWithPrompt('locked');

      expect(await screen.findByText(/restore your identity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recovery code/i)).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /have my recovery code/i }));
      expect(screen.getByText(/show up for this wallet anymore/i)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /start over with a new identity/i }));

      await waitFor(() => expect(getSubmission()).toEqual({ kind: 'new' }));
    });

    it('goes back to the wallet picker without an error when the step is cancelled', async () => {
      await renderWithPrompt('welcome');
      await screen.findByText(/welcome to velum/i);

      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(await screen.findByRole('button', { name: /connect lace/i })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('connected card', () => {
    const connectedDrawer = {
      ...mockDrawerContext,
      midnight: {
        ...mockDrawerContext.midnight,
        provider: { address: 'aa'.repeat(32), wallet: 'Lace', service: { walletCoinPublicKey: 'coin-pk' } },
      },
    };

    afterEach(() => window.localStorage.clear());

    it('asks to save the recovery code until it is confirmed, then offers Backup & Restore', () => {
      storeRecoveryCode('coin-pk', 'SOME-CODE', false);
      const dispatch = jest.fn();
      const { unmount } = renderWithProviders(<LaceWallet />, { drawerValue: connectedDrawer, drawerDispatch: dispatch });

      userEvent.click(screen.getByRole('button', { name: /save your recovery code/i }));
      expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_BACKUP' });
      unmount();

      storeRecoveryCode('coin-pk', 'SOME-CODE', true);
      renderWithProviders(<LaceWallet />, { drawerValue: connectedDrawer, drawerDispatch: dispatch });
      expect(screen.getByRole('button', { name: /backup & restore/i })).toBeInTheDocument();
    });
  });
});
