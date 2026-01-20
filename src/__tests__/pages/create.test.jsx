import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Create from '../../jsx/pages/create';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../../testUtils';
import * as paimaService from '../../services/paima.service';
import dataSyncService from '../../services/dataSync.service';

// Mock services
jest.mock('../../services/paima.service');
jest.mock('../../services/dataSync.service', () => ({
  startEventsPolling: jest.fn(),
  startPoapsPolling: jest.fn(),
  stopAllPolling: jest.fn(),
}));

describe('Create Page', () => {
  const mockIssuer = {
    issuerId: 1,
    issuerUuid: 'issuer-uuid-1',
    address: '0x123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    paimaService.getIssuerByAddressService = jest.fn().mockResolvedValue(mockIssuer);
    paimaService.getAllEventsService = jest.fn().mockResolvedValue([]);
    paimaService.getAllPoapsService = jest.fn().mockResolvedValue([]);
    paimaService.getOwnerPoapsService = jest.fn().mockResolvedValue([]);
    paimaService.getOwnerByAddressService = jest.fn().mockResolvedValue(null);
  });

  it('renders POAP Event Creation header', () => {
    renderWithProviders(<Create />);
    expect(screen.getByText(/POAP EVENT CREATION/i)).toBeInTheDocument();
  });

  it('renders create event card', () => {
    renderWithProviders(<Create />);
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/POAP EVENT/i).length).toBeGreaterThan(0);
  });

  it('dispatches CREATE_EVENT when create button is clicked with wallet and issuer', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
      poapIssuer: mockIssuer,
    };

    renderWithProviders(<Create />, { drawerValue, drawerDispatch: dispatch });

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
    });
  });

  it('dispatches CREATE_ISSUER when wallet has no issuer', async () => {
    const dispatch = jest.fn();
    paimaService.getIssuerByAddressService.mockResolvedValue(null);
    
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
      poapIssuer: null,
    };

    renderWithProviders(<Create />, { drawerValue, drawerDispatch: dispatch });

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_ISSUER' });
    });
  });

  it('shows connect wallet button when no wallet is connected', () => {
    renderWithProviders(<Create />);
    expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
  });

  it('starts polling when wallet is connected', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    renderWithProviders(<Create />, { drawerValue });

    await waitFor(() => {
      expect(dataSyncService.startEventsPolling).toHaveBeenCalled();
      expect(dataSyncService.startPoapsPolling).toHaveBeenCalled();
    });
  });

  it('stops polling on unmount', () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    const { unmount } = renderWithProviders(<Create />, { drawerValue });
    unmount();

    expect(dataSyncService.stopAllPolling).toHaveBeenCalled();
  });

  it('fetches issuer data on mount when wallet is connected', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    renderWithProviders(<Create />, { drawerValue });

    await waitFor(() => {
      expect(paimaService.getIssuerByAddressService).toHaveBeenCalledWith('0x123');
    });
  });
});

