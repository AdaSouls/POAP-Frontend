import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoapCard from '../../jsx/components/poapCard';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getTokenVisibility } from '../../midnight/collection-share';

describe('PoapCard Component', () => {
  const mockPoap = {
    issuerPkHex: 'aa'.repeat(32),
    tokenId: 1,
    firstEventId: 'bb'.repeat(32),
    isSoulbound: false,
    isBurned: false,
    tokenMetadataURI: null,
    metadataURI: null,
    mintedTx: null,
    mintedBlock: null,
  };

  it('renders the token id', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
  });

  it('shows the issuer and event for this token', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.getByText(/Issuer:/i)).toBeInTheDocument();
    expect(screen.getByText(/Event:/i)).toBeInTheDocument();
  });

  it('shows a soulbound badge when isSoulbound is true', () => {
    renderWithProviders(<PoapCard poap={{ ...mockPoap, isSoulbound: true }} />);
    expect(screen.getByText(/Soulbound/i)).toBeInTheDocument();
  });

  it('does not show a soulbound badge when isSoulbound is false or unknown', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.queryByText(/Soulbound/i)).not.toBeInTheDocument();
  });

  it('shows a burned badge when isBurned is true', () => {
    renderWithProviders(<PoapCard poap={{ ...mockPoap, isBurned: true }} />);
    expect(screen.getByText(/Burned/i)).toBeInTheDocument();
  });

  it('shows a category-aware "done" status badge (top-right, like eventCard.jsx) when not burned', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    // No category/modality/relationship on mockPoap's metadata, so getClaimActionLabel falls back
    // to the generic "Subscribed" — see eventCategories.js.
    expect(screen.getByText(/^Subscribed$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Burned$/i)).not.toBeInTheDocument();
  });

  it('shows a Burned status badge instead of the done-state one once burned — no separate "pending"/claim state exists', () => {
    renderWithProviders(<PoapCard poap={{ ...mockPoap, isBurned: true }} />);
    expect(screen.getByText(/^Burned$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Subscribed$/i)).not.toBeInTheDocument();
  });

  it('calls onExpand when the card is clicked', async () => {
    const onExpand = jest.fn();
    renderWithProviders(<PoapCard poap={mockPoap} onExpand={onExpand} />);

    await userEvent.click(screen.getByText(/POAP #1/i));

    // onExpand is deliberately delayed until the text's own fade-out finishes, so the resize
    // never starts while text is still visible — see poapCard.jsx's TEXT_FADE_MS.
    await waitFor(() => expect(onExpand).toHaveBeenCalled());
  });

  it('renders no action button in the collapsed tile — the card itself is the click target', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.queryByRole('button', { name: /view details/i })).not.toBeInTheDocument();
  });

  describe('expanded state', () => {
    const issuerPkHex = 'bb'.repeat(32);
    const holderPkHex = 'ff'.repeat(32);

    const poap = {
      issuerPkHex,
      tokenId: 42,
      firstEventId: 'aa'.repeat(32),
      isSoulbound: true,
      isBurned: false,
      tokenMetadataURI: null,
      metadataURI: null,
      mintedTx: 'tx-hash-42',
      mintedBlock: 100,
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

    it('shows the on-chain mint transaction as verified proof', () => {
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue });
      expect(screen.getByText('Verified ✓')).toBeInTheDocument();
      expect(screen.getByText('tx-hash-42')).toBeInTheDocument();
    });

    it('shows no proof message when the token has no mint tx yet', () => {
      renderWithProviders(<PoapCard poap={{ ...poap, mintedTx: null }} isExpanded />, { drawerValue });
      expect(screen.getByText(/no mint transaction found/i)).toBeInTheDocument();
    });

    it('defaults the share-visibility toggle to checked', () => {
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue });
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('unchecking the toggle persists it as hidden via collection-share', async () => {
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue });
      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();
      expect(getTokenVisibility(issuerPkHex, poap.tokenId)).toBe(false);
    });

    it('copies a share link built from the holder pk and this token', async () => {
      renderWithProviders(<PoapCard poap={poap} isExpanded />, { drawerValue });

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

  describe('token metadata', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('shows the fallback POAP # title when no metadata resolves', () => {
      renderWithProviders(<PoapCard poap={mockPoap} />);
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
    });

    it('shows the resolved name and thumbnail once tokenMetadataURI resolves', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'Genesis Meetup', image: 'https://example.com/img.png' }),
      });

      renderWithProviders(
        <PoapCard poap={{ ...mockPoap, tokenId: 2, tokenMetadataURI: 'https://example.com/meta.json' }} />
      );

      expect(await screen.findByText('Genesis Meetup')).toBeInTheDocument();
    });

    it('shows the full-size document image in the expanded view for a push-minted credential', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          name: 'Diploma',
          documentImage: 'https://example.com/diploma.png',
        }),
      });

      const { container } = renderWithProviders(
        <PoapCard
          poap={{ ...mockPoap, tokenId: 3, tokenMetadataURI: 'https://example.com/meta-diploma.json' }}
          isExpanded
        />
      );

      await waitFor(() => {
        expect(container.querySelector('img[src="https://example.com/diploma.png"]')).toBeInTheDocument();
      });
    });

    it('shows no document-image block for a token with no documentImage (self-claimed)', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'Genesis Meetup', image: 'https://example.com/img.png' }),
      });

      const { container } = renderWithProviders(
        <PoapCard
          poap={{ ...mockPoap, tokenId: 4, tokenMetadataURI: 'https://example.com/meta-no-doc.json' }}
          isExpanded
        />
      );

      await waitFor(() => {
        expect(container.querySelector('img[src="https://example.com/img.png"]')).toBeInTheDocument();
      });
      // Only the small circular icon should render — no second, full-size document-image block.
      expect(container.querySelectorAll('img')).toHaveLength(1);
    });

    it("shows the organizer's display name instead of the raw issuer key when set", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'Diploma', organization: { name: 'AdaSouls Inc.' } }),
      });

      renderWithProviders(
        <PoapCard poap={{ ...mockPoap, tokenId: 5, tokenMetadataURI: 'https://example.com/meta-issuer-name.json' }} />
      );

      expect(await screen.findByText('AdaSouls Inc.')).toBeInTheDocument();
      expect(screen.queryByText(/aaaaaaaa…aaaaaa/)).not.toBeInTheDocument();
    });
  });
});
