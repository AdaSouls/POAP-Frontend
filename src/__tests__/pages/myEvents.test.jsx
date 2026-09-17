import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventsPage from '../../jsx/pages/myEvents';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getAllEvents, getEvent, getTokensByEvent, getAllDisclosureRequests } from '../../midnight/indexer.service';
import { savePrivateAttributeDraft } from '../../midnight/private-attribute-drafts';

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
    getAllDisclosureRequests.mockResolvedValue([]);
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

  it('dispatches CREATE_EVENT when create button is clicked by a connected wallet', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'bb'.repeat(32) } },
    };

    renderWithProviders(<EventsPage />, { drawerValue, drawerDispatch: dispatch });

    const createButton = screen.getByRole('button', { name: /create event/i });
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
  });

  it('gives any connected wallet a usable Create Event button — createEvent has no on-chain access gate', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'ee'.repeat(32) } },
    };

    renderWithProviders(<EventsPage />, { drawerValue, drawerDispatch: dispatch });

    const createButton = screen.getByRole('button', { name: /create event/i });
    expect(createButton).not.toHaveClass('is-outline');
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_EVENT' });
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

  it('shows a pending disclosure request only for an own event where a local draft exists for the field', async () => {
    const fieldIdHex = 'ff'.repeat(32);
    savePrivateAttributeDraft(mockEvents[0].eventId, fieldIdHex, {
      fieldName: 'Region',
      valueHex: '01'.repeat(32),
      randHex: '02'.repeat(32),
    });
    getAllDisclosureRequests.mockResolvedValue([
      // Matches an own event + has a local draft — should show.
      { requestId: 'r1', verifierPk: 'aa'.repeat(32), eventId: mockEvents[0].eventId, fieldId: fieldIdHex, setRoot: '00'.repeat(32) },
      // Matches an own event but no local draft for this fieldId — should NOT show.
      { requestId: 'r2', verifierPk: 'aa'.repeat(32), eventId: mockEvents[0].eventId, fieldId: 'no-draft', setRoot: '00'.repeat(32) },
      // Not an own event (issuerPk 'dd'.repeat(32), not this wallet's 'bb'.repeat(32)) — should NOT show.
      { requestId: 'r3', verifierPk: 'aa'.repeat(32), eventId: mockEvents[1].eventId, fieldId: fieldIdHex, setRoot: '00'.repeat(32) },
    ]);
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'bb'.repeat(32) } },
    };

    renderWithProviders(<EventsPage />, { drawerValue });

    expect(await screen.findByText(/Pending Disclosure Requests \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Region/i)).toBeInTheDocument();
  });

  it('hides sibling cards while one is expanded, and brings them back after it collapses', async () => {
    renderWithProviders(<EventsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
    });

    const firstCard = screen.getAllByText(/Event aaaaaaaa/i)[0].closest('.card');
    await userEvent.click(firstCard);

    // The click-to-expand is deliberately delayed (text fades out before the resize starts — see
    // eventCard.jsx's TEXT_FADE_MS), longer than waitFor's default 1000ms timeout.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collapse event details/i })).toBeInTheDocument();
    }, { timeout: 2000 });
    // The sibling is left out of the grid entirely while one card is expanded — only the expanded
    // card itself remains, full width (see myEvents.jsx's visibleEvents).
    expect(screen.queryByText(/Event cccccccc/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: /collapse event details/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/Event aaaaaaaa/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Event cccccccc/i).length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });
});
