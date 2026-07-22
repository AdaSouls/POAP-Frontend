import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Wallet from '../../jsx/pages/wallet';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

function connectedDrawerValue() {
  return {
    ...mockDrawerContext,
    midnight: {
      ...mockDrawerContext.midnight,
      provider: {
        address: 'aa'.repeat(32),
        wallet: 'lace',
        contractAddress: 'contract-address',
        service: {
          getState: jest.fn().mockResolvedValue({
            ledger: {},
            privateState: { tokens: {} },
          }),
        },
      },
    },
  };
}

describe('Wallet Page', () => {
  it('renders wallet page', () => {
    renderWithProviders(<Wallet />);
    expect(screen.getByText(/Required to interact with POAP/i)).toBeInTheDocument();
  });

  it('shows disconnected state when no wallet is connected', () => {
    renderWithProviders(<Wallet />);
    expect(screen.getByText(/Disconnected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Connect/i })).toBeInTheDocument();
  });

  it('shows connected state when wallet is connected', async () => {
    renderWithProviders(<Wallet />, { drawerValue: connectedDrawerValue() });
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change Wallet/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Poap Collection/i)).toBeInTheDocument());
  });

  it('dispatches SHOW_MIDNIGHT_WALLET when connect button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<Wallet />, { drawerDispatch: dispatch });

    const connectButton = screen.getByRole('button', { name: /Connect/i });
    await userEvent.click(connectButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MIDNIGHT_WALLET' });
  });

  it('dispatches SHOW_MIDNIGHT_WALLET when change wallet button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<Wallet />, { drawerValue: connectedDrawerValue(), drawerDispatch: dispatch });

    const changeButton = screen.getByRole('button', { name: /Change Wallet/i });
    await userEvent.click(changeButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MIDNIGHT_WALLET' });
  });

  it('displays the connected wallet address', () => {
    renderWithProviders(<Wallet />, { drawerValue: connectedDrawerValue() });
    expect(screen.getByText(/aaaaaaaaaa/i)).toBeInTheDocument();
  });
});
