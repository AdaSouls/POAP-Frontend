import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPage from '../../jsx/pages/myEvents';
import { mockDrawerContext, mockUserRoles, renderWithProviders } from '../../testUtils';
import { getAllEvents, getEvent, getTokensByEvent } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

describe('MyEvents page', () => {
  const mockEvents = [
    { eventId: 'aa'.repeat(32), issuerPk: 'bb'.repeat(32), maxSupply: 100, minted: 1, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 1 },
    { eventId: 'cc'.repeat(32), issuerPk: 'dd'.repeat(32), maxSupply: 0, minted: 2, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue(mockEvents);
    getEvent.mockResolvedValue({ ...mockEvents[0], liveTokens: 3 });
    getTokensByEvent.mockResolvedValue([]);
  });

  it('renders events page header', () => {
    renderWithProviders(<EventsPage />);
    const headers = screen.getAllByText(/Events/i);
    expect(headers.length).toBeGreaterThan(0);
  });

  it('shows the create-event button in an outline state when no wallet is connected', () => {
    renderWithProviders(<EventsPage />);
    expect(screen.getByRole('button', { name: /create event/i })).toHaveClass('is-outline');
  });

  it('does nothing when the outline create-event button is clicked without a wallet (tooltip-only, no action)', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<EventsPage />, { drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /create event/i }));

    expect(dispatch).not.toHaveBeenCalled();
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

    const createButton = screen.getByRole('button', { name: /create event/i });
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
  });

  it('replaces Create Event with a request-access button for a connected non-organizer wallet, and dispatches CREATE_ISSUER on click', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'ee'.repeat(32) } },
    };

    renderWithProviders(<EventsPage />, { drawerValue, drawerDispatch: dispatch });

    expect(screen.queryByRole('button', { name: /create event/i })).not.toBeInTheDocument();
    const requestButton = screen.getByRole('button', { name: /request organizer access/i });
    await userEvent.click(requestButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_ISSUER' });
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
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

  it('hides sibling cards when one is expanded, and restores them on collapse', async () => {
    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
    });

    const firstCard = screen.getAllByText(/Event aaaaaaaa/i)[0].closest('.card');
    await userEvent.click(firstCard);

    // The click-to-expand is deliberately delayed (text fades out before the resize starts), so
    // the sibling leaves the DOM asynchronously too.
    await waitFor(() => {
      expect(screen.queryByText(/Event cccccccc/i)).not.toBeInTheDocument();
    });
    expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /collapse event details/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
    });
  });
});
