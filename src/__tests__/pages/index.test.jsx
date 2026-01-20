import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../jsx/pages/index';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../../testUtils';

describe('Dashboard Page', () => {
  it('renders welcome message', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/Welcome to/i)).toBeInTheDocument();
    // AdaSouls appears multiple times (header and slideshow), so check that at least one exists
    const adaSoulsElements = screen.getAllByText(/AdaSouls/i);
    expect(adaSoulsElements.length).toBeGreaterThan(0);
  });

  it('renders wallet connection status', () => {
    renderWithProviders(<Dashboard />);
    // Find the list item containing "Ethereum Wallet" (not the paragraph text)
    const walletListItem = screen.getByRole('listitem');
    expect(walletListItem).toHaveTextContent(/Ethereum Wallet/i);
  });

  it('shows disconnected state when no wallet is connected', () => {
    renderWithProviders(<Dashboard />);
    // Find the list item and check for disconnected state (not-verified class)
    const walletListItem = screen.getByRole('listitem');
    expect(walletListItem).toHaveTextContent(/Ethereum Wallet/i);
    const notVerifiedIcon = walletListItem.querySelector('.not-verified');
    expect(notVerifiedIcon).toBeInTheDocument();
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
    // Find the list item and check for connected state (verified class)
    const walletListItem = screen.getByRole('listitem');
    expect(walletListItem).toHaveTextContent(/Ethereum Wallet/i);
    const verifiedIcon = walletListItem.querySelector('.verified');
    expect(verifiedIcon).toBeInTheDocument();
  });

  it('renders link to wallet page', () => {
    renderWithProviders(<Dashboard />);
    const walletLink = screen.getByRole('link', { name: /Wallets/i });
    expect(walletLink).toHaveAttribute('href', '/wallet');
  });
});

