import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCard from '../../jsx/components/eventCard';
import { renderWithProviders } from '../../testUtils';

describe('EventCard Component', () => {
  const mockEvent = {
    eventId: 'aa'.repeat(32),
    issuerPk: 'bb'.repeat(32),
    maxSupply: 100,
    minted: 50,
    expiration: Math.floor(Date.now() / 1000) + 86400, // tomorrow
    isActive: true,
    isPublicMint: true,
    createdBlock: 42,
  };

  it('renders a truncated event id', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Event aaaaaaaa/i)).toBeInTheDocument();
  });

  it('shows the active status badge', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.getByText(/^active$/i)).toBeInTheDocument();
  });

  it('dispatches VIEW_EVENT when card is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<EventCard event={mockEvent} />, { drawerDispatch: dispatch });

    const card = screen.getByText(/Event aaaaaaaa/i).closest('.card');
    await userEvent.click(card);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'VIEW_EVENT',
      payload: { event: mockEvent, mintable: true },
    });
  });

  it('displays mint progress', () => {
    renderWithProviders(<EventCard event={mockEvent} />);
    expect(screen.getByText(/Minted:/i)).toBeInTheDocument();
    expect(screen.getByText(/50\/100/i)).toBeInTheDocument();
  });

  it('shows expired status for expired events', () => {
    const expiredEvent = { ...mockEvent, expiration: Math.floor(Date.now() / 1000) - 86400 };
    renderWithProviders(<EventCard event={expiredEvent} />);
    expect(screen.getAllByText(/expired/i).length).toBeGreaterThan(0);
  });

  it('shows full status when max supply is reached', () => {
    const fullEvent = { ...mockEvent, minted: 100 };
    renderWithProviders(<EventCard event={fullEvent} />);
    expect(screen.getAllByText(/full/i).length).toBeGreaterThan(0);
  });

  it('shows inactive status when the event is deactivated', () => {
    const inactiveEvent = { ...mockEvent, isActive: false };
    renderWithProviders(<EventCard event={inactiveEvent} />);
    expect(screen.getAllByText(/inactive/i).length).toBeGreaterThan(0);
  });
});
