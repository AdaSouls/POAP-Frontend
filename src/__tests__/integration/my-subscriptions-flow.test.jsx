import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import MySubscriptions from '../../jsx/pages/mySubscriptions';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

// Subscribing now happens from an event card's own "Subscribe" action (exploreEvents.jsx /
// myPendingApprovals.jsx dispatch CREATE_POAP with the event already selected) — this page no
// longer has its own claim entry point, so this flow only covers loading/displaying tokens.
describe('My Subscriptions Flow Integration', () => {
  function connectedDrawerValue(getState) {
    return {
      ...mockDrawerContext,
      midnight: {
        ...mockDrawerContext.midnight,
        provider: { address: 'aa'.repeat(32), service: { getState } },
      },
    };
  }

  it('loads private-state tokens and displays them', async () => {
    const getState = jest.fn().mockResolvedValue({
      ledger: {},
      privateState: {
        tokens: {
          ['bb'.repeat(32)]: {
            tokenId: 1n,
            attendance: { eventIds: [Buffer.from('cc'.repeat(32), 'hex')], isSoulbound: false },
          },
        },
      },
    });

    renderWithProviders(<MySubscriptions />, {
      drawerValue: connectedDrawerValue(getState),
    });

    await waitFor(() => expect(getState).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/POAP #1/i)).toBeInTheDocument());
  });

  it('handles an empty token list', async () => {
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });

    renderWithProviders(<MySubscriptions />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
  });
});
