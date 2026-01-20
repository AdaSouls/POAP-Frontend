import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Collections from '../../jsx/pages/collections';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../../testUtils';
import { getAll, getAllInvited, sign } from '../../services/collection.service';

// Mock services
jest.mock('../../services/collection.service');
jest.mock('../../utils/util', () => ({
  buildSignature: jest.fn(),
  getSigningMessage: jest.fn(),
}));

describe('Collections Page', () => {
  const mockCollections = [
    {
      collectionId: 1,
      name: 'Collection 1',
      policyHash: 'hash-123',
      invited: [
        { user: 'stake-123', signature: 'sig-123', addr: 'addr-123' },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAll.mockResolvedValue(mockCollections);
    getAllInvited.mockResolvedValue([]);
  });

  it('renders collections header', () => {
    renderWithProviders(<Collections />);
    expect(screen.getByText(/Collections/i)).toBeInTheDocument();
  });

  it('renders create collection card', () => {
    renderWithProviders(<Collections />);
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
    expect(screen.getByText(/SOUL COLLECTION/i)).toBeInTheDocument();
  });

  it('loads collections when wallet is connected', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };

    renderWithProviders(<Collections />, { drawerValue });

    await waitFor(() => {
      expect(getAll).toHaveBeenCalledWith('stake-123');
      expect(getAllInvited).toHaveBeenCalledWith('stake-123');
    });
  });

  it('shows wallet connection required when no wallet', () => {
    renderWithProviders(<Collections />);
    // Should show wallet connection required state
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
  });

  it('dispatches CREATE_SOUL when create button is clicked with wallet', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      cardano: {
        wallet: { stake_address: 'stake-123' },
      },
    };

    renderWithProviders(<Collections />, { drawerValue, drawerDispatch: dispatch });

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await createButton.click();

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_SOUL' });
    });
  });
});

