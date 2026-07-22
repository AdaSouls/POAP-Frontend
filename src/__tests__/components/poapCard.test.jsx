import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoapCard from '../../jsx/components/poapCard';
import { renderWithProviders } from '../../testUtils';

describe('PoapCard Component', () => {
  const mockPoap = {
    issuerPkHex: 'aa'.repeat(32),
    tokenId: 1n,
    isSoulbound: false,
    attendedEventIds: ['bb'.repeat(32), 'cc'.repeat(32)],
  };

  it('renders the token id', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.getByText(/SPOAP #1/i)).toBeInTheDocument();
  });

  it('shows how many events were attended', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.getByText(/2 events attended/i)).toBeInTheDocument();
  });

  it('shows a soulbound badge when isSoulbound is true', () => {
    renderWithProviders(<PoapCard poap={{ ...mockPoap, isSoulbound: true }} />);
    expect(screen.getByText(/Soulbound/i)).toBeInTheDocument();
  });

  it('does not show a soulbound badge when isSoulbound is false', () => {
    renderWithProviders(<PoapCard poap={mockPoap} />);
    expect(screen.queryByText(/Soulbound/i)).not.toBeInTheDocument();
  });

  it('dispatches VIEW_POAP_TOKEN when view details button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<PoapCard poap={mockPoap} />, { drawerDispatch: dispatch });

    const viewButton = screen.getByRole('button', { name: /View Details/i });
    await userEvent.click(viewButton);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'VIEW_POAP_TOKEN',
      payload: mockPoap,
    });
  });

  it('handles a token with no attended events', () => {
    renderWithProviders(<PoapCard poap={{ ...mockPoap, attendedEventIds: [] }} />);
    expect(screen.getByText(/0 events attended/i)).toBeInTheDocument();
  });
});
