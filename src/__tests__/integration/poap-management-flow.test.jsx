import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoapManagement from '../../jsx/pages/poapManagement';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

describe('POAP Management Flow Integration', () => {
  function connectedDrawerValue(getState) {
    return {
      ...mockDrawerContext,
      midnight: {
        ...mockDrawerContext.midnight,
        provider: { address: 'aa'.repeat(32), service: { getState } },
      },
    };
  }

  it('loads private-state tokens, displays them, and lets the wallet claim a new one', async () => {
    const dispatch = jest.fn();
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

    renderWithProviders(<PoapManagement />, {
      drawerValue: connectedDrawerValue(getState),
      drawerDispatch: dispatch,
    });

    await waitFor(() => expect(getState).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/POAP #1/i)).toBeInTheDocument());

    const createButton = screen.getByRole('button', { name: /claim poap/i });
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_POAP' });
  });

  it('handles an empty token list', async () => {
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });

    renderWithProviders(<PoapManagement />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
  });
});
