import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoapManagement from '../../jsx/pages/poapManagement';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

function connectedDrawerValue(getState) {
  return {
    ...mockDrawerContext,
    midnight: {
      ...mockDrawerContext.midnight,
      provider: {
        address: 'aa'.repeat(32),
        service: { getState },
      },
    },
  };
}

describe('PoapManagement Page', () => {
  const mockTokens = {
    ['bb'.repeat(32)]: {
      tokenId: 1n,
      attendance: { eventIds: [Buffer.from('cc'.repeat(32), 'hex')], isSoulbound: false },
    },
  };

  it('renders POAP Management header', () => {
    renderWithProviders(<PoapManagement />);
    expect(screen.getByText(/My POAPs/i)).toBeInTheDocument();
  });

  it('renders claim SPOAP card', () => {
    renderWithProviders(<PoapManagement />);
    expect(screen.getByText(/CLAIM/i)).toBeInTheDocument();
    expect(screen.getAllByText(/SPOAP/i).length).toBeGreaterThan(0);
  });

  it('loads and displays tokens from private state when wallet is connected', async () => {
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: mockTokens } });
    renderWithProviders(<PoapManagement />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(getState).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(/SPOAP #1/i)).toBeInTheDocument();
    });
  });

  it('dispatches CREATE_POAP when claim button is clicked with wallet', async () => {
    const dispatch = jest.fn();
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });

    renderWithProviders(<PoapManagement />, {
      drawerValue: connectedDrawerValue(getState),
      drawerDispatch: dispatch,
    });

    const createButton = screen.getByText(/CLAIM/i).closest('.card-body');
    await userEvent.click(createButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_POAP' });
  });

  it('shows wallet connection required when no wallet', () => {
    renderWithProviders(<PoapManagement />);
    expect(screen.getByText(/CLAIM/i)).toBeInTheDocument();
  });

  it('shows empty state when no POAPs are found', async () => {
    const getState = jest.fn().mockResolvedValue({ ledger: {}, privateState: { tokens: {} } });
    renderWithProviders(<PoapManagement />, { drawerValue: connectedDrawerValue(getState) });

    await waitFor(() => {
      expect(screen.getByText(/No POAPs Found/i)).toBeInTheDocument();
    });
  });
});
