import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Dashboard from '../../jsx/pages/index';
import { mockDrawerContext, mockDrawerDispatch, renderWithProviders } from '../../testUtils';

describe('Dashboard Page', () => {
  it('renders the hero headline', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/One token\. Endless ways to prove it\./i)).toBeInTheDocument();
  });

  it('renders all seven use-case cards', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Event Tickets & Access')).toBeInTheDocument();
    expect(screen.getByText('Podcast Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Live Streams & Social Content')).toBeInTheDocument();
    expect(screen.getByText('Private Meetings & Calls')).toBeInTheDocument();
    expect(screen.getByText('Diplomas & Certificates')).toBeInTheDocument();
    expect(screen.getByText('Celebrity & Athlete Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Document Delivery')).toBeInTheDocument();
  });

  it('links out to both role pages', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByRole('heading', { name: 'Organizer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Subscriber' })).toBeInTheDocument();
    const learnMoreLinks = screen.getAllByRole('link', { name: /learn more/i });
    expect(learnMoreLinks.map((link) => link.getAttribute('href')).sort()).toEqual([
      '/organizer',
      '/subscriber',
    ]);
  });

  it('shows "Connect Wallet" when no wallet is connected', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  it('shows "Wallet Connected" when a wallet is connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: {
        ...mockDrawerContext.midnight,
        provider: { address: 'aa'.repeat(32) },
      },
    };
    renderWithProviders(<Dashboard />, { drawerValue });
    expect(screen.getByRole('button', { name: /wallet connected/i })).toBeInTheDocument();
  });

  it('opens the wallet connect popup instead of navigating to a page', () => {
    mockDrawerDispatch.mockClear();
    renderWithProviders(<Dashboard />);
    const walletButton = screen.getByRole('button', { name: /connect wallet/i });
    fireEvent.click(walletButton);
    expect(mockDrawerDispatch).toHaveBeenCalledWith({ type: 'SHOW_MIDNIGHT_WALLET' });
  });
});
