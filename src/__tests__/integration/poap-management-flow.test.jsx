import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PoapManagement from '../../jsx/pages/poapManagement';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../utils/testUtils';
import { getUserPoaps } from '../../services/poap.service';
import dataSyncService from '../../services/dataSync.service';

// Mock services
jest.mock('../../services/poap.service');
jest.mock('../../services/dataSync.service', () => ({
  startPoapsPolling: jest.fn(),
  stopPoapsPolling: jest.fn(),
}));

describe('POAP Management Flow Integration', () => {
  const mockPoaps = [
    {
      tokenId: 1,
      eventId: 1,
      ownerAddress: '0x123',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      tokenId: 2,
      eventId: 1,
      ownerAddress: '0x123',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getUserPoaps.mockResolvedValue(mockPoaps);
  });

  it('completes full POAP management flow', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    renderWithProviders(
      <MemoryRouter>
        <PoapManagement />
      </MemoryRouter>,
      { drawerValue, drawerDispatch: dispatch }
    );

    // Wait for POAPs to load
    await waitFor(() => {
      expect(getUserPoaps).toHaveBeenCalledWith('0x123');
    });

    // Verify polling started
    expect(dataSyncService.startPoapsPolling).toHaveBeenCalled();

    // Click on create POAP
    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    // Verify dispatch was called
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_POAP' });
    });
  });

  it('handles empty POAP list', async () => {
    getUserPoaps.mockResolvedValue([]);
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
      poapCollection: [],
    };

    renderWithProviders(
      <MemoryRouter>
        <PoapManagement />
      </MemoryRouter>,
      { drawerValue }
    );

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
  });
});

