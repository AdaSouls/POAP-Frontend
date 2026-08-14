import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoapCard from '../../jsx/components/poapCard';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getEventVisibility } from '../../midnight/collection-share';
import { getEvent } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

describe('PoapCard Component', () => {
  const mockPoap = {
    issuerPkHex: 'aa'.repeat(32),
    tokenId: 1n,
    isSoulbound: false,
    attendedEventIds: ['bb'.repeat(32), 'cc'.repeat(32)],
  };

  beforeEach(() => {
    getEvent.mockReset().mockResolvedValue(null);
  });

  it('renders the token id', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
  });

  it('shows how many events were attended', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.getByText(/2 events attended/i)).toBeInTheDocument();
  });

  it('shows a soulbound badge when isSoulbound is true', () => {
    renderWithProviders(<PoapCard poap={{ ...mockPoap, isSoulbound: true }} />);
    expect(screen.getByText(/Soulbound/i)).toBeInTheDocument();
  });

  it('does not show a soulbound badge when isSoulbound is false', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.queryByText(/Soulbound/i)).not.toBeInTheDocument();
  });

  it('handles a token with no attended events', () => {
    renderWithProviders(<PoapCard poap={{ ...mockPoap, attendedEventIds: [] }} />);
    expect(screen.getByText(/0 events attended/i)).toBeInTheDocument();
  });

  it('calls onExpand when the card is clicked', async () => {
    const onExpand = jest.fn();
    renderWithProviders(<PoapCard poap={mockPoap} onExpand={onExpand} />);

    await userEvent.click(screen.getByText(/POAP #1/i));

    // onExpand is deliberately delayed until the text's own fade-out finishes, so the resize
    // never starts while text is still visible — see poapCard.jsx's TEXT_FADE_MS.
    await waitFor(() => expect(onExpand).toHaveBeenCalled());
  });

  it('calls onExpand when the view details button is clicked', async () => {
    const onExpand = jest.fn();
    renderWithProviders(<PoapCard poap={mockPoap} onExpand={onExpand} />);

    await userEvent.click(screen.getByRole('button', { name: /View Details/i }));

    await waitFor(() => expect(onExpand).toHaveBeenCalled());
  });

  describe('expanded state', () => {
    const issuerPkHex = 'bb'.repeat(32);
    const eventIdA = 'aa'.repeat(32);
    const eventIdC = 'cc'.repeat(32);
    const holderPkHex = 'ff'.repeat(32);

    const poap = {
      issuerPkHex,
      tokenId: 42n,
      isSoulbound: true,
      attendedEventIds: [eventIdA, eventIdC],
    };

    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: holderPkHex } },
    };

    beforeEach(() => {
      window.localStorage.clear();
      navigator.clipboard.writeText.mockClear();
    });

    it('calls onCollapse when the close button is clicked', async () => {
      const onCollapse = jest.fn();
      renderWithProviders(<PoapCard poap={poap} isExpanded onCollapse={onCollapse} />, { drawerValue });

      await userEvent.click(screen.getByRole('button', { name: /collapse poap details/i }));

      await waitFor(() => expect(onCollapse).toHaveBeenCalled());
    });

    it('shows a clarifying note that Soulbound is not enforced on-chain', () => {
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue });
      expect(screen.getByText(/not enforce this restriction on-chain/i)).toBeInTheDocument();
    });

    it('renders one checked-by-default checkbox per attended event', () => {
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue });
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      checkboxes.forEach((cb) => expect(cb).toBeChecked());
    });

    it('unchecking an event persists it as hidden via collection-share', async () => {
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue });
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);
      expect(checkboxes[0]).not.toBeChecked();
      expect(getEventVisibility(issuerPkHex, eventIdA)).toBe(false);
      expect(getEventVisibility(issuerPkHex, eventIdC)).toBe(true);
    });

    it('copies a share link built from the holder pk and visible events', async () => {
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue });
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]); // hide eventIdA

      await userEvent.click(screen.getByText(/copy share link/i));

      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      const copiedUrl = navigator.clipboard.writeText.mock.calls[0][0];
      expect(copiedUrl).toContain(`/share/${holderPkHex}`);
      expect(copiedUrl).toContain('?d=');
      expect(screen.getByText(/link copied/i)).toBeInTheDocument();
    });

    it('disables the share button when no wallet is connected', () => {
      const disconnectedValue = { ...drawerValue, midnight: { ...drawerValue.midnight, provider: null } };
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue: disconnectedValue });
      expect(screen.getByText(/copy share link/i)).toBeDisabled();
    });
  });

  describe('origin event metadata', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('does not call getEvent when there are no attended events', () => {
      renderWithProviders(<PoapCard poap={{ ...mockPoap, attendedEventIds: [] }} />);
      expect(getEvent).not.toHaveBeenCalled();
    });

    it('looks up the first attended event', () => {
      renderWithProviders(<PoapCard poap={mockPoap} />);
      expect(getEvent).toHaveBeenCalledWith(mockPoap.attendedEventIds[0]);
    });

    it('shows a "First event" line and thumbnail once the origin event metadata resolves', async () => {
      getEvent.mockResolvedValue({ metadataURI: 'https://example.com/meta.json' });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'Genesis Meetup', image: 'https://example.com/img.png' }),
      });

      renderWithProviders(<PoapCard poap={mockPoap} />);

      expect(await screen.findByText(/first event:/i)).toBeInTheDocument();
      expect(screen.getByText('Genesis Meetup')).toBeInTheDocument();
    });
  });
});
