import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SoulboundClaim from '../../jsx/pages/soulbound-claim';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../utils/testUtils';
import { getClaimableTokens } from '../../services/collection.service';

// Mock services
jest.mock('../../services/collection.service');
jest.mock('../../utils/util', () => ({
  claimToken: jest.fn(),
}));

describe('SoulboundClaim Page', () => {
  const mockTokens = [
    {
      soulboundId: 1,
      name: 'Test Token',
      collection: {
        collectionId: 1,
        name: 'Test Collection',
        policyId: 'policy-123',
        policyHash: 'hash-123',
        smartContract: 'contract-123',
        redeem: 'redeem-123',
        invited: [{ keyHash: 'key1' }],
      },
      beneficiary: 'addr1',
      mintUtxo: 'utxo-123',
      claimUtxo: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getClaimableTokens.mockResolvedValue(mockTokens);
  });

  it('renders claim soulbound token card', () => {
    renderWithProviders(<SoulboundClaim />);
    expect(screen.getByText(/CLAIM/i)).toBeInTheDocument();
    expect(screen.getByText(/SOULBOUND TOKEN/i)).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    getClaimableTokens.mockImplementation(() => new Promise(() => {})); // Never resolves
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };
    
    renderWithProviders(<SoulboundClaim />, { drawerValue });
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('loads claimable tokens when wallet is connected', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };

    renderWithProviders(<SoulboundClaim />, { drawerValue });

    await waitFor(() => {
      expect(getClaimableTokens).toHaveBeenCalledWith('stake-123');
    });
  });

  it('shows wallet connection required when no wallet', () => {
    renderWithProviders(<SoulboundClaim />);
    expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
  });

  it('dispatches SHOW_CARDANO_WALLET when connect button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<SoulboundClaim />, { drawerDispatch: dispatch });

    const connectButton = screen.getByRole('button', { name: /Connect/i });
    await userEvent.click(connectButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_CARDANO_WALLET' });
  });

  it('displays claimable tokens in table', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };

    renderWithProviders(<SoulboundClaim />, { drawerValue });

    await waitFor(() => {
      expect(screen.getByText(/Test Collection/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Token/i)).toBeInTheDocument();
    });
  });
});

