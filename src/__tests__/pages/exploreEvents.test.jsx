import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExploreEvents from '../../jsx/pages/exploreEvents';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getAllEvents, getEvent, getTokensByEvent } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

describe('ExploreEvents page', () => {
  const myPk = 'bb'.repeat(32);
  const otherPk = 'dd'.repeat(32);

  const mockEvents = [
    { eventId: 'aa'.repeat(32), issuerPk: myPk, maxSupply: 100, minted: 1, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 1 },
    { eventId: 'cc'.repeat(32), issuerPk: otherPk, maxSupply: 0, minted: 2, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 2 },
    { eventId: 'ee'.repeat(32), issuerPk: otherPk, maxSupply: 0, minted: 0, expiration: 0, isActive: true, isPublicMint: false, createdBlock: 3 },
  ];

  const drawerValue = {
    ...mockDrawerContext,
    midnight: { ...mockDrawerContext.midnight, provider: { address: myPk } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue(mockEvents);
    getEvent.mockResolvedValue({ ...mockEvents[1], liveTokens: 0 });
    getTokensByEvent.mockResolvedValue([]);
  });

  it('shows the wallet-not-connected state when no wallet is connected', async () => {
    renderWithProviders(<ExploreEvents />);
    await waitFor(() => expect(getAllEvents).toHaveBeenCalled());
    expect(screen.getByText(/0 Events/i)).toBeInTheDocument();
  });

  it('excludes the viewer\'s own events and non-public events, keeping only other public ones', async () => {
    renderWithProviders(<ExploreEvents />, { drawerValue });

    await waitFor(() => expect(getAllEvents).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Event aaaaaaaa/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Event eeeeeeee/i)).not.toBeInTheDocument();
  });

  it('dispatches CREATE_POAP with the event when Subscribe is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<ExploreEvents />, { drawerValue, drawerDispatch: dispatch });

    await waitFor(() => {
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
    });

    await userEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_POAP', payload: mockEvents[1] });
  });

  it('hides sibling cards when one is expanded, and restores them on collapse', async () => {
    const twoOtherEvents = [
      ...mockEvents,
      { eventId: 'ff'.repeat(32), issuerPk: otherPk, maxSupply: 0, minted: 0, expiration: 0, isActive: true, isPublicMint: true, createdBlock: 4 },
    ];
    getAllEvents.mockResolvedValue(twoOtherEvents);

    renderWithProviders(<ExploreEvents />, { drawerValue });

    await waitFor(() => {
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Event ffffffff/i).length).toBeGreaterThan(0);
    });

    const firstCard = screen.getAllByText(/Event cccccccc/i)[0].closest('.card');
    await userEvent.click(firstCard);

    await waitFor(() => {
      expect(screen.queryByText(/Event ffffffff/i)).not.toBeInTheDocument();
    });
    expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /collapse event details/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Event ffffffff/i).length).toBeGreaterThan(0);
    });
  });
});
