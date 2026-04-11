import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoapManagement from '../../jsx/pages/poapManagement';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../../testUtils';
import { getUserPoaps } from '../../services/poap.service';
import dataSyncService from '../../services/dataSync.service';

// Mock services
jest.mock('../../services/poap.service');
jest.mock('../../services/dataSync.service', () => ({
  startPoapsPolling: jest.fn(),
  stopPoapsPolling: jest.fn(),
}));

describe('PoapManagement Page', () => {
  const mockPoaps = [
    {
      tokenId: 1,
      eventId: 1,
      ownerAddress: '0x123',
      poapUuid: 'uuid-1',
    },
    {
      tokenId: 2,
      eventId: 1,
      ownerAddress: '0x123',
      poapUuid: 'uuid-2',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getUserPoaps.mockResolvedValue(mockPoaps);
  });

  it('renders POAP Management header', () => {
    renderWithProviders(<PoapManagement />);
    expect(screen.getByText(/POAP Management/i)).toBeInTheDocument();
  });

  it('renders create POAP card', () => {
    renderWithProviders(<PoapManagement />);
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/POAP/i).length).toBeGreaterThan(0);
  });

  it('shows loading state initially', async () => {
    getUserPoaps.mockImplementation(() => new Promise(() => {})); // Never resolves
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };
    
    renderWithProviders(<PoapManagement />, { drawerValue });
    // Loading state should be visible
    await waitFor(() => {
      expect(screen.getByAltText(/Loading POAPs/i)).toBeInTheDocument();
    });
  });

  it('loads and displays POAPs when wallet is connected', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    renderWithProviders(<PoapManagement />, { drawerValue });

    await waitFor(() => {
      expect(getUserPoaps).toHaveBeenCalledWith('0x123');
    });
  });

  it('dispatches CREATE_POAP when create button is clicked with wallet', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    renderWithProviders(<PoapManagement />, { drawerValue, drawerDispatch: dispatch });

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_POAP' });
    });
  });

  it('shows wallet connection required when no wallet', () => {
    renderWithProviders(<PoapManagement />);
    // Should show wallet connection required state
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
  });

  it('starts polling when wallet is connected', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    renderWithProviders(<PoapManagement />, { drawerValue });

    await waitFor(() => {
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

    const { unmount } = renderWithProviders(<PoapManagement />, { drawerValue });
    unmount();

    expect(dataSyncService.stopPoapsPolling).toHaveBeenCalled();
  });

  it('shows empty state when no POAPs are found', async () => {
    getUserPoaps.mockResolvedValue([]);
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
      poapCollection: [],
    };

    renderWithProviders(<PoapManagement />, { drawerValue });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
  });
});

