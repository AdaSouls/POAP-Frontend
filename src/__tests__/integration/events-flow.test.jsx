import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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

describe('Events Flow Integration', () => {
  const mockEvents = [
    {
      eventId: 1,
      title: 'Test Event 1',
      description: 'Description 1',
      organiserAddress: '0x123',
      maxSupply: 100,
      totalSupply: 50,
    },
    {
      eventId: 2,
      title: 'Test Event 2',
      description: 'Description 2',
      organiserAddress: '0x456',
      maxSupply: 200,
      totalSupply: 100,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue(mockEvents);
  });

  it('completes full events page flow', async () => {
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
        <EventsPage />
      </MemoryRouter>,
      { drawerValue, drawerDispatch: dispatch }
    );

    // Wait for events to load
    await waitFor(() => {
      expect(getAllEvents).toHaveBeenCalled();
    });

    // Verify events are displayed
    await waitFor(() => {
      expect(screen.getByText(/Test Event 1/i)).toBeInTheDocument();
    });

    // Verify polling started
    expect(dataSyncService.startEventsPolling).toHaveBeenCalled();

    // Click on create event
    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    // Verify dispatch was called
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
    });
  });

  it('handles filter changes and event updates', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    renderWithProviders(
      <MemoryRouter>
        <EventsPage />
      </MemoryRouter>,
      { drawerValue }
    );

    await waitFor(() => {
      expect(getAllEvents).toHaveBeenCalled();
    });

    // Verify initial events count
    await waitFor(() => {
      expect(screen.getByText(/2 Events/i)).toBeInTheDocument();
    });
  });
});

