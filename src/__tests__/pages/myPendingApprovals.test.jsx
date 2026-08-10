import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import MyPendingApprovals from '../../jsx/pages/myPendingApprovals';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getTokensByOwner, getAllEvents } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

function connectedDrawerValue(getState) {
  return {
    ...mockDrawerContext,
    midnight: {
      ...mockDrawerContext.midnight,
      provider: { address: 'aa'.repeat(32), service: { getState } },
    },
  };
}

describe('MyPendingApprovals page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue([
      { eventId: 'ee'.repeat(32), issuerPk: 'bb'.repeat(32), maxSupply: 100, minted: 1, expiration: 0, isActive: true, isPublicMint: false, createdBlock: 1 },
    ]);
  });

  it('shows the wallet-not-connected state when no wallet is connected', () => {
    renderWithProviders(<MyPendingApprovals />);
    expect(screen.getByText(/my pending approvals/i)).toBeInTheDocument();
    expect(getTokensByOwner).not.toHaveBeenCalled();
  });

  it('shows tokens owned on-chain that are not yet reconciled into private state', async () => {
    getTokensByOwner.mockResolvedValue([
      { tokenId: 1, ownerPk: 'aa'.repeat(32), issuerPk: 'bb'.repeat(32), firstEventId: 'ee'.repeat(32), isBurned: false },
    ]);
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });

    renderWithProviders(<MyPendingApprovals />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/token #1/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /claim/i })).toBeInTheDocument();
  });

  it('excludes tokens whose issuer is already reconciled into private state', async () => {
    getTokensByOwner.mockResolvedValue([
      { tokenId: 1, ownerPk: 'aa'.repeat(32), issuerPk: 'bb'.repeat(32), firstEventId: 'ee'.repeat(32), isBurned: false },
    ]);
    const getState = jest.fn().mockResolvedValue({
      ledger: {},
      privateState: { tokens: { ['bb'.repeat(32)]: { tokenId: 1n, attendance: { eventIds: [], isSoulbound: false } } } },
    });

    renderWithProviders(<MyPendingApprovals />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/no pending approvals/i)).toBeInTheDocument();
    });
  });

  it('excludes burned tokens', async () => {
    getTokensByOwner.mockResolvedValue([
      { tokenId: 1, ownerPk: 'aa'.repeat(32), issuerPk: 'bb'.repeat(32), firstEventId: 'ee'.repeat(32), isBurned: true },
    ]);
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });

    renderWithProviders(<MyPendingApprovals />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/no pending approvals/i)).toBeInTheDocument();
    });
  });

  it('opens the Claim POAP drawer when a pending token is claimed', async () => {
    getTokensByOwner.mockResolvedValue([
      { tokenId: 1, ownerPk: 'aa'.repeat(32), issuerPk: 'bb'.repeat(32), firstEventId: 'ee'.repeat(32), isBurned: false },
    ]);
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });
    const dispatch = jest.fn();

    renderWithProviders(<MyPendingApprovals />, {
      drawerValue: connectedDrawerValue(getState),
      drawerDispatch: dispatch,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /claim/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /claim/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_POAP' });
  });
});
