import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Wallet from '../../jsx/pages/wallet';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../utils/testUtils';

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

  it('shows connected state when wallet is connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: {
          address: '0x123',
          wallet: {
            name: 'metamask',
            img: 'metamask.jpg',
          },
          chainId: 200101,
        },
        address: '0x123',
      },
    };

    renderWithProviders(<Wallet />, { drawerValue });
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change Wallet/i })).toBeInTheDocument();
  });

  it('dispatches SHOW_ETHEREUM_WALLET when connect button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<Wallet />, { drawerDispatch: dispatch });

    const connectButton = screen.getByRole('button', { name: /Connect/i });
    await userEvent.click(connectButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_ETHEREUM_WALLET' });
  });

  it('dispatches SHOW_ETHEREUM_WALLET when change wallet button is clicked', async () => {
    const dispatch = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: {
          address: '0x123',
          wallet: { name: 'metamask', img: 'metamask.jpg' },
          chainId: 200101,
        },
        address: '0x123',
      },
    };

    renderWithProviders(<Wallet />, { drawerValue, drawerDispatch: dispatch });

    const changeButton = screen.getByRole('button', { name: /Change Wallet/i });
    await userEvent.click(changeButton);

    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_ETHEREUM_WALLET' });
  });

  it('displays wallet name when connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: {
          address: '0x123',
          wallet: {
            name: 'metamask',
            img: 'metamask.jpg',
          },
          chainId: 200101,
        },
        address: '0x123',
      },
    };

    renderWithProviders(<Wallet />, { drawerValue });
    expect(screen.getByText(/metamask/i)).toBeInTheDocument();
  });
});

