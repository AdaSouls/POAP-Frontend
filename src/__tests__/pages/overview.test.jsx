import React from 'react';
import { render, screen } from '@testing-library/react';
import Overview from '../../jsx/pages/overview';
import { mockDrawerContext, renderWithProviders } from '../utils/testUtils';

describe('Overview Page', () => {
  it('renders overview page title', () => {
    renderWithProviders(<Overview />);
    expect(screen.getByText(/POAP System Overview/i)).toBeInTheDocument();
  });

  it('displays integrated pages section', () => {
    renderWithProviders(<Overview />);
    expect(screen.getByText(/Integrated Pages/i)).toBeInTheDocument();
    expect(screen.getByText(/Events \(Integrated\)/i)).toBeInTheDocument();
  });

  it('displays smart contract only pages section', () => {
    renderWithProviders(<Overview />);
    expect(screen.getByText(/Smart Contract Only Pages/i)).toBeInTheDocument();
  });

  it('displays other pages section', () => {
    renderWithProviders(<Overview />);
    expect(screen.getByText(/Other Pages/i)).toBeInTheDocument();
  });

  it('shows wallet connected message when wallet is connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      ethereum: {
        provider: { address: '0x123' },
        address: '0x123',
      },
    };

    renderWithProviders(<Overview />, { drawerValue });
    expect(screen.getByText(/Wallet Connected:/i)).toBeInTheDocument();
    expect(screen.getByText(/0x123/i)).toBeInTheDocument();
  });

  it('renders links to all pages', () => {
    renderWithProviders(<Overview />);
    expect(screen.getByRole('link', { name: /Go to Events \(Integrated\)/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Wallet/i })).toBeInTheDocument();
  });

  it('displays architecture summary', () => {
    renderWithProviders(<Overview />);
    expect(screen.getByText(/Architecture Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Integrated Approach/i)).toBeInTheDocument();
    expect(screen.getByText(/Smart Contract Only/i)).toBeInTheDocument();
  });
});

