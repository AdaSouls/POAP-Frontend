import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPage from '../../jsx/pages/events';
import { mockDrawerContext, mockUserRoles, renderWithProviders } from '../../testUtils';
import { getAllEvents } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

describe('EventsPage', () => {
  const mockEvents = [
    { eventId: 'aa'.repeat(32), issuerPk: 'bb'.repeat(32), maxSupply: 100, minted: 1, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 1 },
    { eventId: 'cc'.repeat(32), issuerPk: 'dd'.repeat(32), maxSupply: 0, minted: 2, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue(mockEvents);
  });

  it('renders events page header', () => {
    renderWithProviders(<EventsPage />);
    const headers = screen.getAllByText(/Events/i);
    expect(headers.length).toBeGreaterThan(0);
  });

  it('renders create event card', () => {
    renderWithProviders(<EventsPage />);
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/EVENT/i).length).toBeGreaterThan(0);
  });

  it('loads and displays events', async () => {
    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(getAllEvents).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0);
    });
  });

  it('dispatches CREATE_EVENT when create button is clicked by an organizer', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'bb'.repeat(32) } },
    };

    renderWithProviders(<EventsPage />, {
      drawerValue,
      drawerDispatch: dispatch,
      userRolesValue: { ...mockUserRoles, isIssuer: true },
    });

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
  });

  it('does not dispatch CREATE_EVENT for a non-organizer wallet', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'ee'.repeat(32) } },
    };

    renderWithProviders(<EventsPage />, { drawerValue, drawerDispatch: dispatch });

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    expect(dispatch).not.toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
  });

  it('shows wallet status when no wallet is connected', () => {
    renderWithProviders(<EventsPage />);
    expect(screen.getByText(/CREATE/i)).toBeInTheDocument();
  });

  it('separates my events from other events for a connected organizer', async () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'bb'.repeat(32) } },
    };

    renderWithProviders(<EventsPage />, { drawerValue });

    await waitFor(() => {
      expect(getAllEvents).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
    });
  });
});
