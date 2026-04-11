import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCard from '../../jsx/components/eventCard';
import { mockDrawerDispatch, renderWithProviders } from '../../testUtils';

describe('EventCard Component', () => {
  const mockEvent = {
    eventId: 1,
    title: 'Test Event',
    description: 'Test Description',
    organiserAddress: '0x1234567890123456789012345678901234567890',
    maxSupply: 100,
    totalSupply: 50,
    eventStartDate: Math.floor(Date.now() / 1000) - 86400, // Yesterday
    expiration: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
    imageUrl: 'https://example.com/image.jpg',
  };

  it('renders event card with title', () => {
    renderWithProviders(<EventCard event={mockEvent} index={0} />);
    expect(screen.getByText(/Test Event/i)).toBeInTheDocument();
  });

  it('renders event description', () => {
    renderWithProviders(<EventCard event={mockEvent} index={0} />);
    expect(screen.getByText(/Test Description/i)).toBeInTheDocument();
  });

  it('dispatches VIEW_EVENT when card is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<EventCard event={mockEvent} index={0} />, { drawerDispatch: dispatch });

    const card = screen.getByText(/Test Event/i).closest('.card');
    await userEvent.click(card);

    expect(dispatch).toHaveBeenCalledWith({
      type: 'VIEW_EVENT',
      payload: { event: mockEvent, mintable: expect.any(Boolean) },
    });
  });

  it('displays progress bar when maxSupply is set', () => {
    renderWithProviders(<EventCard event={mockEvent} index={0} />);
    expect(screen.getByText(/Minted:/i)).toBeInTheDocument();
    expect(screen.getByText(/50\/100/i)).toBeInTheDocument();
  });

  it('truncates long addresses', () => {
    renderWithProviders(<EventCard event={mockEvent} index={0} />);
    const address = screen.getByText(/0x1234\.\.\.7890/i);
    expect(address).toBeInTheDocument();
  });

  it('shows expired status for expired events', () => {
    const expiredEvent = {
      ...mockEvent,
      expiration: Math.floor(Date.now() / 1000) - 86400, // Yesterday
    };

    renderWithProviders(<EventCard event={expiredEvent} index={0} />);
    const expiredBadges = screen.getAllByText(/expired/i);
    expect(expiredBadges.length).toBeGreaterThan(0);
  });

  it('displays event image when imageUrl is provided', () => {
    renderWithProviders(<EventCard event={mockEvent} index={0} />);
    const image = screen.getByAltText(/Test Event/i);
    expect(image).toHaveAttribute('src', mockEvent.imageUrl);
  });

  it('falls back to default image when imageUrl is not provided', () => {
    const eventWithoutImage = { ...mockEvent, imageUrl: null };
    renderWithProviders(<EventCard event={eventWithoutImage} index={0} />);
    const images = screen.getAllByAltText(/Event/i);
    expect(images.length).toBeGreaterThan(0);
  });
});

