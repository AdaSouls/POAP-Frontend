import React from 'react';
import { screen } from '@testing-library/react';
import Overview from '../../jsx/pages/overview';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

describe('Overview Page', () => {
  it('renders overview page title', () => {
    renderWithProviders(<Overview />);
    expect(screen.getByText(/AdaSouls on Midnight/i)).toBeInTheDocument();
  });

  it('shows a prompt to connect when no wallet is connected', () => {
    renderWithProviders(<Overview />);
    expect(screen.getAllByText(/Connect your Lace wallet/i).length).toBeGreaterThan(0);
  });

  it('shows wallet connected message when wallet is connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: {
        ...mockDrawerContext.midnight,
        provider: { address: 'aa'.repeat(32) },
      },
    };

    renderWithProviders(<Overview />, { drawerValue });
    expect(screen.getByText(/Wallet Connected:/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp('aa'.repeat(32), 'i'))).toBeInTheDocument();
  });

  it('renders links to the main pages', () => {
    renderWithProviders(<Overview />);
    expect(screen.getByRole('link', { name: /Go to Events/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to My POAPs/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Wallet/i })).toBeInTheDocument();
  });
});
