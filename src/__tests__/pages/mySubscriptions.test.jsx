import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MySubscriptions from '../../jsx/pages/mySubscriptions';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getTokensByOwner } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

const ISSUER_PK = 'bb'.repeat(32);
const HOLDER_PK = 'ff'.repeat(32);

function connectedDrawerValue({ events = [{ issuerPk: ISSUER_PK }], getHolderPkHex } = {}) {
  return {
    ...mockDrawerContext,
    poapEvents: events,
    midnight: {
      ...mockDrawerContext.midnight,
      provider: {
        address: HOLDER_PK,
        service: {
          getState: jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } }),
          getHolderPkHex: getHolderPkHex ?? jest.fn().mockResolvedValue(HOLDER_PK),
        },
      },
    },
  };
}

function mockToken(overrides = {}) {
  return {
    tokenId: 1,
    ownerPk: HOLDER_PK,
    issuerPk: ISSUER_PK,
    firstEventId: 'cc'.repeat(32),
    isBurned: false,
    mintedBlock: 10,
    mintedTx: 'tx-1',
    burnedBlock: null,
    burnedTx: null,
    tokenMetadataURI: null,
    tokenPrivateMetadataCommit: null,
    metadataURI: null,
    ...overrides,
  };
}

describe('MySubscriptions page', () => {
  beforeEach(() => {
    getTokensByOwner.mockReset();
  });

  it('renders the inner nav (page title dropped — the main nav already shows the active page)', () => {
    getTokensByOwner.mockResolvedValue([]);
    renderWithProviders(<MySubscriptions />);
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('loads and displays tokens sourced from the indexer by holder pk when wallet is connected', async () => {
    getTokensByOwner.mockResolvedValue([mockToken()]);
    renderWithProviders(<MySubscriptions />, { drawerValue: connectedDrawerValue() });

    await waitFor(() => {
      expect(getTokensByOwner).toHaveBeenCalledWith(HOLDER_PK);
    });
    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
    });
  });

  it('shows tokens an organizer push-minted, with no separate claim/approval step', async () => {
    // A push-minted token never touches local private state — getTokensByOwner alone (via this
    // wallet's holder pk for that issuer) is what makes it show up here.
    getTokensByOwner.mockResolvedValue([mockToken({ tokenId: 7 })]);
    renderWithProviders(<MySubscriptions />, { drawerValue: connectedDrawerValue() });

    await waitFor(() => {
      expect(screen.getByText(/POAP #7/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no POAPs are found', async () => {
    getTokensByOwner.mockResolvedValue([]);
    renderWithProviders(<MySubscriptions />, { drawerValue: connectedDrawerValue() });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
  });

  it('does not show a share button when there are no POAPs', async () => {
    getTokensByOwner.mockResolvedValue([]);
    renderWithProviders(<MySubscriptions />, { drawerValue: connectedDrawerValue() });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/share my collection/i)).not.toBeInTheDocument();
  });

  it('copies a collection share link keyed by the holder pk once POAPs are loaded', async () => {
    navigator.clipboard.writeText.mockClear();
    getTokensByOwner.mockResolvedValue([mockToken()]);
    const drawerValue = connectedDrawerValue();
    renderWithProviders(<MySubscriptions />, { drawerValue });

    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/share my collection/i));

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copiedUrl = navigator.clipboard.writeText.mock.calls[0][0];
    expect(copiedUrl).toContain(`/share/${drawerValue.midnight.provider.address}`);
    expect(copiedUrl).toContain('?d=');
    expect(screen.getByText(/link copied/i)).toBeInTheDocument();
  });

  it('keeps sibling cards visible when one is expanded, and after it collapses again', async () => {
    getTokensByOwner.mockResolvedValue([mockToken({ tokenId: 1 }), mockToken({ tokenId: 2 })]);
    renderWithProviders(<MySubscriptions />, { drawerValue: connectedDrawerValue() });

    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
      expect(screen.getByText(/POAP #2/i)).toBeInTheDocument();
    });

    // PoapFilters defaults to sorting by Token ID descending, so POAP #2 renders first — same
    // convention EventFilters/myEvents.jsx already uses. No separate "View Details" button
    // anymore — the card itself is the click target (see poapCard.jsx).
    await userEvent.click(screen.getByText(/POAP #2/i).closest('.card'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collapse poap details/i })).toBeInTheDocument();
    });
    // The sibling never left the DOM — only the clicked card resized into its expanded layout.
    expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
    expect(screen.getByText(/POAP #2/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /collapse poap details/i }));

    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
      expect(screen.getByText(/POAP #2/i)).toBeInTheDocument();
    });
  });
});
