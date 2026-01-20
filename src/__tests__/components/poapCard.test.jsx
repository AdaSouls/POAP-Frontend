import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoapCard from '../../jsx/components/poapCard';
import { mockDrawerDispatch, renderWithProviders } from '../../testUtils';

describe('PoapCard Component', () => {
  const mockPoap = {
    tokenId: 1,
    eventId: 1,
    issuerId: 1,
    ownerAddress: '0x123',
    createdAt: '2024-01-01T00:00:00Z',
    events: [
      {
        eventId: 1,
        title: 'Test Event',
        image: 'https://example.com/image.jpg',
        issuerId: 1,
        isExpired: false,
      },
    ],
  };

  it('renders POAP card with event title', () => {
    renderWithProviders(<PoapCard poap={mockPoap} index={0} />);
    expect(screen.getByText(/Test Event/i)).toBeInTheDocument();
  });

  it('displays token ID', () => {
    renderWithProviders(<PoapCard poap={mockPoap} index={0} />);
    expect(screen.getByText(/Token:\s*1/i)).toBeInTheDocument();
  });

  it('dispatches VIEW_POAP_TOKEN when view details button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<PoapCard poap={mockPoap} index={0} />, { drawerDispatch: dispatch });

    const viewButton = screen.getByRole('button', { name: /View Details/i });
    await userEvent.click(viewButton);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'VIEW_POAP_TOKEN',
      payload: mockPoap,
    });
  });

  it('displays issuer ID', () => {
    renderWithProviders(<PoapCard poap={mockPoap} index={0} />);
    expect(screen.getByText(/Issuer: 1/i)).toBeInTheDocument();
  });

  it('displays created date', () => {
    renderWithProviders(<PoapCard poap={mockPoap} index={0} />);
    // Date should be formatted and displayed
    expect(screen.getByText(/Minted/i)).toBeInTheDocument();
  });

  it('handles POAP without events array', () => {
    const poapWithoutEvents = {
      ...mockPoap,
      events: undefined,
    };

    renderWithProviders(<PoapCard poap={poapWithoutEvents} index={0} />);
    expect(screen.getByText(/Event 1/i)).toBeInTheDocument();
  });
});

