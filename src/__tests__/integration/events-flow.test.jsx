import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPage from '../../jsx/pages/events';
import { mockDrawerContext, mockUserRoles, renderWithProviders } from '../../testUtils';
import { getAllEvents } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

describe('Events Flow Integration', () => {
  const mockEvents = [
    { eventId: 'aa'.repeat(32), issuerPk: 'bb'.repeat(32), maxSupply: 100, minted: 50, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 1 },
    { eventId: 'cc'.repeat(32), issuerPk: 'dd'.repeat(32), maxSupply: 200, minted: 100, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 2 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue(mockEvents);
  });

  it('loads events from the indexer, displays them, and lets an organizer create a new one', async () => {
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

    await waitFor(() => expect(getAllEvents).toHaveBeenCalled());
    await waitFor(() => expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0));

    const createButton = screen.getByText(/CREATE/i).closest('.card-body');
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
  });

  it('shows the correct event count badge once events load', async () => {
    renderWithProviders(<EventsPage />);

    await waitFor(() => expect(getAllEvents).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/2 Events/i)).toBeInTheDocument());
  });
});
