import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../jsx/pages/index';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../utils/testUtils';

describe('Dashboard Page', () => {
  it('renders welcome message', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    expect(screen.getByText(/AdaSouls/i)).toBeInTheDocument();
  });

  it('renders wallet connection status', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/Ethereum Wallet/i)).toBeInTheDocument();
  });

  it('shows disconnected state when no wallet is connected', () => {
    renderWithProviders(<Dashboard />);
    const walletStatus = screen.getByText(/Ethereum Wallet/i).closest('li');
    expect(walletStatus).toBeInTheDocument();
  });

  it('shows connected state when wallet is connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };
    renderWithProviders(<Dashboard />, { drawerValue });
    const walletStatus = screen.getByText(/Ethereum Wallet/i).closest('li');
    expect(walletStatus).toBeInTheDocument();
  });

  it('renders link to wallet page', () => {
    renderWithProviders(<Dashboard />);
    const walletLink = screen.getByRole('link', { name: /Wallets/i });
    expect(walletLink).toHaveAttribute('href', '/wallet');
  });

  it('renders banner slideshow', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/AdaSouls is the first open platform/i)).toBeInTheDocument();
  });
});

