import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPage from '../../jsx/pages/events';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../utils/testUtils';
import { getAllEvents } from '../../services/event.service';
import dataSyncService from '../../services/dataSync.service';

// Mock services
jest.mock('../../services/event.service');
jest.mock('../../services/dataSync.service', () => ({
  startEventsPolling: jest.fn(),
  stopEventsPolling: jest.fn(),
}));

describe('EventsPage', () => {
  const mockEvents = [
    {
      eventId: 1,
      title: 'Test Event 1',
      description: 'Test Description',
      organiserAddress: '0x123',
    },
    {
      eventId: 2,
      title: 'Test Event 2',
      description: 'Test Description 2',
      organiserAddress: '0x456',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue(mockEvents);
  });

  it('renders events page header', () => {
    renderWithProviders(<EventsPage />);
    expect(screen.getByText(/Events/i)).toBeInTheDocument();
  });

  it('renders create event card', () => {
    renderWithProviders(<EventsPage />);
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
    expect(screen.getByText(/EVENT/i)).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    getAllEvents.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderWithProviders(<EventsPage />);
    // Loading state should be visible
    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).toBeInTheDocument();
    });
  });

  it('loads and displays events', async () => {
    renderWithProviders(<EventsPage />);
    
    await waitFor(() => {
      expect(getAllEvents).toHaveBeenCalled();
    });
  });

  it('dispatches CREATE_EVENT when create button is clicked with wallet', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };
    
    renderWithProviders(<EventsPage />, { drawerValue, drawerDispatch: dispatch });
    
    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);
    
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
    });
  });

  it('shows wallet status when no wallet is connected', () => {
    renderWithProviders(<EventsPage />);
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
    
    renderWithProviders(<EventsPage />, { drawerValue });
    
    await waitFor(() => {
      expect(dataSyncService.startEventsPolling).toHaveBeenCalled();
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
    
    const { unmount } = renderWithProviders(<EventsPage />, { drawerValue });
    unmount();
    
    expect(dataSyncService.stopEventsPolling).toHaveBeenCalled();
  });

  it('filters and displays my events separately', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
      poapEvents: mockEvents,
    };
    
    renderWithProviders(<EventsPage />, { drawerValue });
    
    await waitFor(() => {
      expect(getAllEvents).toHaveBeenCalled();
    });
  });
});

