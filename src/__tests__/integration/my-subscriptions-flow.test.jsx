import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import MySubscriptions from '../../jsx/pages/mySubscriptions';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getTokensByOwner } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service');

// Subscribing now happens from an event card's own "Subscribe" action (exploreEvents.jsx dispatches
// CREATE_POAP with the event already selected) — this page no longer has its own claim entry
// point, so this flow only covers loading/displaying tokens. Tokens are sourced live from the
// indexer by this wallet's per-issuer holder pk (see src/midnight/my-tokens.ts), not from local
// private state — that's what makes an organizer's push-mint show up here with no separate
// approval step.
describe('My Subscriptions Flow Integration', () => {
  const ISSUER_PK = 'bb'.repeat(32);
  const HOLDER_PK = 'aa'.repeat(32);

  function connectedDrawerValue() {
    return {
      ...mockDrawerContext,
      poapEvents: [{ issuerPk: ISSUER_PK }],
      midnight: {
        ...mockDrawerContext.midnight,
        provider: {
          address: HOLDER_PK,
          service: {
            getState: jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } }),
            getHolderPkHex: jest.fn().mockResolvedValue(HOLDER_PK),
          },
        },
      },
    };
  }

  beforeEach(() => {
    getTokensByOwner.mockReset();
  });

  it('loads tokens from the indexer and displays them', async () => {
    getTokensByOwner.mockResolvedValue([
      {
        tokenId: 1,
        ownerPk: HOLDER_PK,
        issuerPk: ISSUER_PK,
        firstEventId: 'cc'.repeat(32),
        isBurned: false,
        mintedBlock: 1,
        mintedTx: 'tx-1',
        burnedBlock: null,
        burnedTx: null,
        tokenMetadataURI: null,
        tokenPrivateMetadataCommit: null,
        metadataURI: null,
      },
    ]);

    renderWithProviders(<MySubscriptions />, { drawerValue: connectedDrawerValue() });

    await waitFor(() => expect(getTokensByOwner).toHaveBeenCalledWith(HOLDER_PK));
    await waitFor(() => expect(screen.getByText(/POAP #1/i)).toBeInTheDocument());
  });

  it('handles an empty token list', async () => {
    getTokensByOwner.mockResolvedValue([]);

    renderWithProviders(<MySubscriptions />, { drawerValue: connectedDrawerValue() });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
  });
});
