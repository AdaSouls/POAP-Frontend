import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Collection from '../../jsx/pages/collection-details';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../utils/testUtils';
import { get } from '../../services/collection.service';

// Mock services
jest.mock('../../services/collection.service');
jest.mock('../../utils/util', () => ({
  burnToken: jest.fn(),
}));

describe('Collection Details Page', () => {
  const mockCollection = {
    collectionId: 1,
    name: 'Test Collection',
    description: 'Test Description',
    policyId: 'policy-123',
    policyHash: 'hash-123',
    owner: 'stake-123',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-02',
    invited: [{ keyHash: 'key1' }],
    tokens: [
      {
        soulboundId: 1,
        name: 'Token 1',
        burnTx: null,
        claimUtxo: 'utxo-123',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    get.mockResolvedValue(mockCollection);
  });

  it('renders collection header', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };

    renderWithProviders(
      <MemoryRouter initialEntries={['/collection/1']}>
        <Collection />
      </MemoryRouter>,
      { drawerValue }
    );

    await waitFor(() => {
      expect(screen.getByText(/SOUL COLLECTION/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    get.mockImplementation(() => new Promise(() => {})); // Never resolves
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };

    renderWithProviders(
      <MemoryRouter initialEntries={['/collection/1']}>
        <Collection />
      </MemoryRouter>,
      { drawerValue }
    );

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('loads collection data when wallet is connected', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };

    renderWithProviders(
      <MemoryRouter initialEntries={['/collection/1']}>
        <Collection />
      </MemoryRouter>,
      { drawerValue }
    );

    await waitFor(() => {
      expect(get).toHaveBeenCalledWith('1', 'stake-123');
    });
  });

  it('displays collection details', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };

    renderWithProviders(
      <MemoryRouter initialEntries={['/collection/1']}>
        <Collection />
      </MemoryRouter>,
      { drawerValue }
    );

    await waitFor(() => {
      expect(screen.getByText(/Test Collection/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Description/i)).toBeInTheDocument();
    });
  });
});

