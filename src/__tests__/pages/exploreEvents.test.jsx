import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExploreEvents from '../../jsx/pages/exploreEvents';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getAllEvents, getEvent, getTokensByEvent, getTokensByOwner } from '../../midnight/indexer.service';

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
    midnight: {
      ...mockDrawerContext.midnight,
      provider: { address: myPk, service: { getHolderPkHex: jest.fn().mockResolvedValue('ab'.repeat(32)) } },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getAllEvents.mockResolvedValue(mockEvents);
    getEvent.mockResolvedValue({ ...mockEvents[1], liveTokens: 0 });
    getTokensByEvent.mockResolvedValue([]);
    getTokensByOwner.mockResolvedValue([]);
    drawerValue.midnight.provider.service.getHolderPkHex.mockResolvedValue('ab'.repeat(32));
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

    // Subscribe only lives in the expanded card now — expand it first (same pattern as
    // the "hides sibling cards" test below).
    const card = screen.getAllByText(/Event cccccccc/i)[0].closest('.card');
    await userEvent.click(card);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collapse event details/i })).toBeInTheDocument();
    }, { timeout: 2000 });

    await userEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_POAP', payload: mockEvents[1] });
  });

  it('hides sibling cards while one is expanded, and brings them back after it collapses', async () => {
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

    // eventCard.jsx delays onExpand/onCollapse by TEXT_FADE_MS (text fades out before the resize
    // starts) — longer than waitFor's default 1000ms timeout, so it needs raising here.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collapse event details/i })).toBeInTheDocument();
    }, { timeout: 2000 });
    // The sibling is left out of the grid entirely while one card is expanded (exploreEvents.jsx's
    // visibleEvents) — its own AnimatePresence exit animation (0.2s) may still be finishing up
    // right after expandedId updates, so this needs its own wait rather than an immediate assert.
    await waitFor(() => {
      expect(screen.queryByText(/Event ffffffff/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
    expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /collapse event details/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Event ffffffff/i).length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });
});
