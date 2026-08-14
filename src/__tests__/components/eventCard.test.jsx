import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCard from '../../jsx/components/eventCard';
import { mockDrawerContext, mockUserRoles, renderWithProviders } from '../../testUtils';
import { getEvent, getTokensByEvent } from '../../midnight/indexer.service';

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

  // Push-minting (mintTo) is only offered for the organizer's own private (organizer-minted)
  // events — public events are meant to be self-claimed via claimOrUpdate/"Subscribe" instead, see
  // eventCard.jsx's canMintForEvent comment. Used by every test that expects the Mint POAP button
  // to actually show.
  const privateMockEvent = { ...mockEvent, isPublicMint: false };

  beforeEach(() => {
    jest.clearAllMocks();
    getEvent.mockResolvedValue({ ...mockEvent, liveTokens: 7 });
    getTokensByEvent.mockResolvedValue([]);
  });

  it('renders a truncated event id', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Event aaaaaaaa/i)).toBeInTheDocument();
  });

  it('shows the active status badge', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.getByText(/^active$/i)).toBeInTheDocument();
  });

  it('does not show block info in the collapsed tile (only in expanded details)', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.queryByText(/Block:/i)).not.toBeInTheDocument();
  });

  it('shows the fetched description in the collapsed tile', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ name: 'DevCon 2026', description: 'A great event' }),
    });
    // Distinct URI from other tests in this file — useEventMetadata caches by URI at module scope,
    // reusing one would leak this test's (imageless) response into another test's assertions.
    const eventWithMetadata = { ...mockEvent, metadataURI: 'https://example.com/meta-description-only.json' };

    renderWithProviders(<EventCard event={eventWithMetadata} />);

    expect(await screen.findByText('A great event')).toBeInTheDocument();
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

  it('shows a Mint POAP button (not View POAPs) in the collapsed tile for the event owner\'s own private event', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: privateMockEvent.issuerPk } },
    };
    renderWithProviders(<EventCard event={privateMockEvent} />, {
      drawerValue,
      drawerDispatch: dispatch,
      userRolesValue: { ...mockUserRoles, isIssuer: false },
    });

    expect(screen.queryByRole('link', { name: /view poaps/i })).not.toBeInTheDocument();
    const mintButton = screen.getByRole('button', { name: /mint poap/i });
    await userEvent.click(mintButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_MINT', payload: privateMockEvent });
  });

  it('shows no action button in the collapsed tile for an event that is neither mine nor variant="explore"', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.queryByRole('link', { name: /view poaps/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mint poap/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subscribe/i })).not.toBeInTheDocument();
  });

  it('shows no Mint POAP button in the collapsed tile for the owner\'s own PUBLIC event', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: mockEvent.issuerPk } },
    };
    renderWithProviders(<EventCard event={mockEvent} />, { drawerValue });
    expect(screen.queryByRole('button', { name: /mint poap/i })).not.toBeInTheDocument();
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
      expect(await screen.findByText(/7 live tokens/i)).toBeInTheDocument();
    });

    it('shows an empty state when no tokens have been minted for this event', async () => {
      renderWithProviders(<EventCard event={mockEvent} isExpanded />);
      await waitFor(() => expect(getTokensByEvent).toHaveBeenCalledWith(mockEvent.eventId));
      expect(await screen.findByText(/no poaps minted for this event yet/i)).toBeInTheDocument();
    });

    it('renders one icon per token, with a Burned badge on burned ones', async () => {
      getTokensByEvent.mockResolvedValue([
        { tokenId: 1, ownerPk: 'cc'.repeat(32), isBurned: false },
        { tokenId: 2, ownerPk: 'dd'.repeat(32), isBurned: true },
      ]);
      const { container } = renderWithProviders(<EventCard event={mockEvent} isExpanded />);

      await waitFor(() => {
        expect(container.querySelectorAll('.card-media-thumb-small-wrap')).toHaveLength(2);
      });
      expect(screen.getByText(/burned/i)).toBeInTheDocument();
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

    it('shows a Mint POAP button for the admin on a private event', () => {
      renderWithProviders(<EventCard event={privateMockEvent} isExpanded />, {
        userRolesValue: { ...mockUserRoles, isAdmin: true },
      });
      expect(screen.getByRole('button', { name: /mint poap/i })).toBeInTheDocument();
    });

    it('shows a Mint POAP button for the owner of this private event, even without the verified-issuer badge', () => {
      // Event creation is permissionless — a caller can own an event (issuerPk match) without
      // being separately admin-registered via registerIssuer(), so isIssuer must NOT be required
      // here. Regression test for the bug where an event owner without the badge couldn't mint.
      const drawerValue = {
        ...mockDrawerContext,
        midnight: { ...mockDrawerContext.midnight, provider: { address: privateMockEvent.issuerPk } },
      };
      renderWithProviders(<EventCard event={privateMockEvent} isExpanded />, {
        drawerValue,
        userRolesValue: { ...mockUserRoles, isIssuer: false },
      });
      expect(screen.getByRole('button', { name: /mint poap/i })).toBeInTheDocument();
    });

    it('does not show a Mint POAP button for a non-owner, even with the verified-issuer badge', () => {
      const otherEvent = { ...privateMockEvent, issuerPk: 'cc'.repeat(32) };
      const drawerValue = {
        ...mockDrawerContext,
        midnight: { ...mockDrawerContext.midnight, provider: { address: privateMockEvent.issuerPk } },
      };
      renderWithProviders(<EventCard event={otherEvent} isExpanded />, {
        drawerValue,
        userRolesValue: { ...mockUserRoles, isIssuer: true },
      });
      expect(screen.queryByRole('button', { name: /mint poap/i })).not.toBeInTheDocument();
    });

    it('does not show a Mint POAP button for the owner\'s own PUBLIC event, even as admin', () => {
      // Public events are meant to be self-claimed via "Subscribe" — the contract's mintTo doesn't
      // itself forbid push-minting into one, but the UI shouldn't offer a way to bypass that flow.
      const drawerValue = {
        ...mockDrawerContext,
        midnight: { ...mockDrawerContext.midnight, provider: { address: mockEvent.issuerPk } },
      };
      renderWithProviders(<EventCard event={mockEvent} isExpanded />, {
        drawerValue,
        userRolesValue: { ...mockUserRoles, isAdmin: true },
      });
      expect(screen.queryByRole('button', { name: /mint poap/i })).not.toBeInTheDocument();
    });

    it('dispatches CREATE_MINT with the event when Mint POAP is clicked', async () => {
      const dispatch = jest.fn();
      renderWithProviders(<EventCard event={privateMockEvent} isExpanded />, {
        drawerDispatch: dispatch,
        userRolesValue: { ...mockUserRoles, isAdmin: true },
      });

      await userEvent.click(screen.getByRole('button', { name: /mint poap/i }));

      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_MINT', payload: privateMockEvent });
    });
  });

  describe('metadataURI display', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('does not fetch and shows the hex fallback when the event has no metadataURI', () => {
      global.fetch = jest.fn();
      renderWithProviders(<EventCard event={mockEvent} />);
      expect(screen.getByText(/Event aaaaaaaa/i)).toBeInTheDocument();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows the fetched name and image once metadataURI resolves', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'DevCon 2026', image: 'https://example.com/img.png' }),
      });
      const eventWithMetadata = { ...mockEvent, metadataURI: 'https://example.com/meta-with-image.json' };

      const { container } = renderWithProviders(<EventCard event={eventWithMetadata} />);

      expect(await screen.findByText('DevCon 2026')).toBeInTheDocument();
      expect(screen.queryByText(/Event aaaaaaaa/i)).not.toBeInTheDocument();
      const img = container.querySelector('.card-media-thumb-photo');
      expect(img).toHaveAttribute('src', 'https://example.com/img.png');
      expect(container.querySelector('.card-media-thumb-broken-icon')).not.toBeInTheDocument();
    });

    it('shows the broken-image icon (never a stale/placeholder image) while metadata is still loading', () => {
      global.fetch = jest.fn(() => new Promise(() => {})); // never resolves
      const eventWithMetadata = { ...mockEvent, metadataURI: 'https://example.com/meta-still-loading.json' };

      const { container } = renderWithProviders(<EventCard event={eventWithMetadata} />);

      expect(container.querySelector('.card-media-thumb-broken-icon')).toBeInTheDocument();
      expect(container.querySelector('.card-media-thumb-photo')).not.toBeInTheDocument();
    });

    it('shows the broken-image icon when the event has no metadataURI at all', () => {
      const { container } = renderWithProviders(<EventCard event={mockEvent} />);
      expect(container.querySelector('.card-media-thumb-broken-icon')).toBeInTheDocument();
    });

    it('falls back to the broken-image icon if the resolved image URL fails to load', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'DevCon 2026', image: 'https://example.com/broken.png' }),
      });
      // Distinct URI — useEventMetadata caches by URI at module scope, reusing another test's URI
      // in the same file risks a stale cache hit instead of this test's own fetch mock resolving.
      const eventWithMetadata = { ...mockEvent, metadataURI: 'https://example.com/meta-broken-image.json' };

      const { container } = renderWithProviders(<EventCard event={eventWithMetadata} />);

      await screen.findByText('DevCon 2026');
      const img = container.querySelector('.card-media-thumb-photo');
      fireEvent.error(img);

      // Scoped to this render's own container (not global `document`) and a generous timeout —
      // this test was flaking under CPU contention when the full suite runs in parallel workers.
      await waitFor(
        () => {
          expect(container.querySelector('.card-media-thumb-broken-icon')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  describe('variant="explore"', () => {
    it('shows a Subscribe button instead of View POAPs in the collapsed tile', () => {
      renderWithProviders(<EventCard event={mockEvent} variant="explore" />);
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /view poaps/i })).not.toBeInTheDocument();
    });

    it('calls onClaim with the event when the collapsed Subscribe button is clicked', async () => {
      const onClaim = jest.fn();
      renderWithProviders(<EventCard event={mockEvent} variant="explore" onClaim={onClaim} />);

      await userEvent.click(screen.getByRole('button', { name: /subscribe/i }));

      expect(onClaim).toHaveBeenCalledWith(mockEvent);
    });

    it('never shows Mint to Recipient, even for the event\'s own issuer', () => {
      const drawerValue = {
        ...mockDrawerContext,
        midnight: { ...mockDrawerContext.midnight, provider: { address: mockEvent.issuerPk } },
      };
      renderWithProviders(<EventCard event={mockEvent} isExpanded variant="explore" />, {
        drawerValue,
        userRolesValue: { ...mockUserRoles, isAdmin: true, isIssuer: true },
      });
      expect(screen.queryByRole('button', { name: /mint poap/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
    });
  });
});
