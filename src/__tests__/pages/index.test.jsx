import React from 'react';
import { screen } from '@testing-library/react';
import Dashboard from '../../jsx/pages/index';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

describe('Dashboard Page', () => {
  it('renders welcome message', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    const adaSoulsElements = screen.getAllByText(/AdaSouls/i);
    expect(adaSoulsElements.length).toBeGreaterThan(0);
  });

  it('renders wallet connection status', () => {
    renderWithProviders(<Dashboard />);
    const walletListItem = screen.getByRole('listitem');
    expect(walletListItem).toHaveTextContent(/Lace Wallet/i);
  });

  it('shows disconnected state when no wallet is connected', () => {
    renderWithProviders(<Dashboard />);
    const walletListItem = screen.getByRole('listitem');
    expect(walletListItem).toHaveTextContent(/Lace Wallet/i);
    const notVerifiedIcon = walletListItem.querySelector('.not-verified');
    expect(notVerifiedIcon).toBeInTheDocument();
  });

  it('shows connected state when wallet is connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: {
        ...mockDrawerContext.midnight,
        provider: { address: 'aa'.repeat(32) },
      },
    };
    renderWithProviders(<Dashboard />, { drawerValue });
    const walletListItem = screen.getByRole('listitem');
    expect(walletListItem).toHaveTextContent(/Lace Wallet/i);
    const verifiedIcon = walletListItem.querySelector('.verified');
    expect(verifiedIcon).toBeInTheDocument();
  });

  it('renders link to wallet page', () => {
    renderWithProviders(<Dashboard />);
    const walletLink = screen.getByRole('link', { name: /Wallets/i });
    expect(walletLink).toHaveAttribute('href', '/wallet');
  });
});
