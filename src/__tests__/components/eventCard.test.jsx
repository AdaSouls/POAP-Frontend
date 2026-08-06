import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCard from '../../jsx/components/eventCard';
import { mockDrawerContext, mockUserRoles, renderWithProviders } from '../../testUtils';
import { getEvent } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

describe('EventCard Component', () => {
  const mockEvent = {
    eventId: 'aa'.repeat(32),
    issuerPk: 'bb'.repeat(32),
    maxSupply: 100,
    minted: 50,
    expiration: Math.floor(Date.now() / 1000) + 86400, // tomorrow
    isActive: true,
    isPublicMint: true,
    createdBlock: 42,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getEvent.mockResolvedValue({ ...mockEvent, liveTokens: 7 });
  });

  it('renders a truncated event id', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Event aaaaaaaa/i)).toBeInTheDocument();
  });

  it('shows the active status badge', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.getByText(/^active$/i)).toBeInTheDocument();
  });

  it('calls onExpand when card is clicked', async () => {
    const onExpand = jest.fn();
    renderWithProviders(<EventCard event={mockEvent} onExpand={onExpand} />);

    const card = screen.getByText(/Event aaaaaaaa/i).closest('.card');
    await userEvent.click(card);

    // onExpand is deliberately delayed until the text's own fade-out finishes, so the resize
    // never starts while text is still visible — see eventCard.jsx's TEXT_FADE_MS.
    await waitFor(() => expect(onExpand).toHaveBeenCalled());
  });

  it('displays mint progress', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Minted:/i)).toBeInTheDocument();
    expect(screen.getByText(/50\/100/i)).toBeInTheDocument();
  });

  it('shows expired status for expired events', () => {
    const expiredEvent = { ...mockEvent, expiration: Math.floor(Date.now() / 1000) - 86400 };
    renderWithProviders(<EventCard event={expiredEvent} />);
    expect(screen.getAllByText(/expired/i).length).toBeGreaterThan(0);
  });

  it('shows full status when max supply is reached', () => {
    const fullEvent = { ...mockEvent, minted: 100 };
    renderWithProviders(<EventCard event={fullEvent} />);
    expect(screen.getAllByText(/full/i).length).toBeGreaterThan(0);
  });

  it('shows inactive status when the event is deactivated', () => {
    const inactiveEvent = { ...mockEvent, isActive: false };
    renderWithProviders(<EventCard event={inactiveEvent} />);
    expect(screen.getAllByText(/inactive/i).length).toBeGreaterThan(0);
  });

  describe('expanded state', () => {
    it('shows the full (untruncated) event id and issuer', () => {
      renderWithProviders(<EventCard event={mockEvent} isExpanded />);
      expect(screen.getByText(mockEvent.eventId)).toBeInTheDocument();
      expect(screen.getByText(mockEvent.issuerPk)).toBeInTheDocument();
    });

    it('fetches and shows the live token count for this event', async () => {
      renderWithProviders(<EventCard event={mockEvent} isExpanded />);

      expect(getEvent).toHaveBeenCalledWith(mockEvent.eventId);
      await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
      expect(screen.getByText(/live tokens/i)).toBeInTheDocument();
    });

    it('notes that individual holders cannot be listed', () => {
      renderWithProviders(<EventCard event={mockEvent} isExpanded />);
      expect(screen.getByText(/by-event lookup the backend doesn't expose/i)).toBeInTheDocument();
    });

    it('calls onCollapse when the close button is clicked', async () => {
      const onCollapse = jest.fn();
      renderWithProviders(<EventCard event={mockEvent} isExpanded onCollapse={onCollapse} />);

      await userEvent.click(screen.getByRole('button', { name: /collapse event details/i }));

      await waitFor(() => expect(onCollapse).toHaveBeenCalled());
    });

    it('does not show a Mint POAP button for a regular attendee', () => {
      renderWithProviders(<EventCard event={mockEvent} isExpanded />, {
        userRolesValue: { ...mockUserRoles, isAdmin: false, isIssuer: false },
      });
      expect(screen.queryByRole('button', { name: /mint poap/i })).not.toBeInTheDocument();
    });

    it('shows a Mint POAP button for the admin', () => {
      renderWithProviders(<EventCard event={mockEvent} isExpanded />, {
        userRolesValue: { ...mockUserRoles, isAdmin: true },
      });
      expect(screen.getByRole('button', { name: /mint poap/i })).toBeInTheDocument();
    });

    it('shows a Mint POAP button for the issuer of this event', () => {
      const drawerValue = {
        ...mockDrawerContext,
        midnight: { ...mockDrawerContext.midnight, provider: { address: mockEvent.issuerPk } },
      };
      renderWithProviders(<EventCard event={mockEvent} isExpanded />, {
        drawerValue,
        userRolesValue: { ...mockUserRoles, isIssuer: true },
      });
      expect(screen.getByRole('button', { name: /mint poap/i })).toBeInTheDocument();
    });

    it('does not show a Mint POAP button for the issuer of a different event', () => {
      const otherEvent = { ...mockEvent, issuerPk: 'cc'.repeat(32) };
      const drawerValue = {
        ...mockDrawerContext,
        midnight: { ...mockDrawerContext.midnight, provider: { address: mockEvent.issuerPk } },
      };
      renderWithProviders(<EventCard event={otherEvent} isExpanded />, {
        drawerValue,
        userRolesValue: { ...mockUserRoles, isIssuer: true },
      });
      expect(screen.queryByRole('button', { name: /mint poap/i })).not.toBeInTheDocument();
    });

    it('dispatches CREATE_MINT with the event when Mint POAP is clicked', async () => {
      const dispatch = jest.fn();
      renderWithProviders(<EventCard event={mockEvent} isExpanded />, {
        drawerDispatch: dispatch,
        userRolesValue: { ...mockUserRoles, isAdmin: true },
      });

      await userEvent.click(screen.getByRole('button', { name: /mint poap/i }));

      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_MINT', payload: mockEvent });
    });
  });
});
