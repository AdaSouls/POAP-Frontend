import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoapManagement from '../../jsx/pages/poapManagement';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

function connectedDrawerValue(getState) {
  return {
    ...mockDrawerContext,
    midnight: {
      ...mockDrawerContext.midnight,
      provider: {
        address: 'aa'.repeat(32),
        service: { getState },
      },
    },
  };
}

describe('PoapManagement Page', () => {
  const mockTokens = {
    ['bb'.repeat(32)]: {
      tokenId: 1n,
      attendance: { eventIds: [Buffer.from('cc'.repeat(32), 'hex')], isSoulbound: false },
    },
  };

  const twoMockTokens = {
    ...mockTokens,
    ['dd'.repeat(32)]: {
      tokenId: 2n,
      attendance: { eventIds: [Buffer.from('ee'.repeat(32), 'hex')], isSoulbound: false },
    },
  };

  it('renders POAP Management header', () => {
    renderWithProviders(<PoapManagement />);
    expect(screen.getByText(/My POAPs/i)).toBeInTheDocument();
  });

  it('shows the claim-poap button in an outline state when no wallet is connected', () => {
    renderWithProviders(<PoapManagement />);
    expect(screen.getByRole('button', { name: /claim poap/i })).toHaveClass('is-outline');
  });

  it('dispatches SHOW_MIDNIGHT_WALLET when the outline claim-poap button is clicked without a wallet', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<PoapManagement />, { drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /claim poap/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MIDNIGHT_WALLET' });
  });

  it('loads and displays tokens from private state when wallet is connected', async () => {
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: mockTokens } });
    renderWithProviders(<PoapManagement />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(getState).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
    });
  });

  it('dispatches CREATE_POAP when claim button is clicked with wallet', async () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });

    renderWithProviders(<PoapManagement />, {
      drawerValue: connectedDrawerValue(getState),
      drawerDispatch: dispatch,
    });

    const createButton = screen.getByRole('button', { name: /claim poap/i });
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_POAP' });
  });

  it('shows empty state when no POAPs are found', async () => {
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });
    renderWithProviders(<PoapManagement />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
  });

  it('does not show a share button when there are no POAPs', async () => {
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });
    renderWithProviders(<PoapManagement />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/share my collection/i)).not.toBeInTheDocument();
  });

  it('copies a collection share link keyed by the holder pk once POAPs are loaded', async () => {
    navigator.clipboard.writeText.mockClear();
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: mockTokens } });
    const drawerValue = connectedDrawerValue(getState);
    renderWithProviders(<PoapManagement />, { drawerValue });

    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/share my collection/i));

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copiedUrl = navigator.clipboard.writeText.mock.calls[0][0];
    expect(copiedUrl).toContain(`/share/${drawerValue.midnight.provider.address}`);
    expect(copiedUrl).toContain('?d=');
    expect(screen.getByText(/link copied/i)).toBeInTheDocument();
  });

  it('hides sibling cards when one is expanded, and restores them on collapse', async () => {
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: twoMockTokens } });
    renderWithProviders(<PoapManagement />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
      expect(screen.getByText(/POAP #2/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole('button', { name: /View Details/i })[0]);

    // AnimatePresence's exit is animated, so the sibling leaves the DOM asynchronously.
    await waitFor(() => {
      expect(screen.queryByText(/POAP #2/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /collapse poap details/i }));

    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
      expect(screen.getByText(/POAP #2/i)).toBeInTheDocument();
    });
  });
});
