import React from 'react';
import { render, screen } from '@testing-library/react';
import PoapEvents from '../../jsx/components/poapEvents';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

// Mock EventItem component
jest.mock('../../jsx/components/eventItem', () => {
  return function MockEventItem({ event }) {
    return <tr><td>{event.title || 'Event'}</td></tr>;
  };
});

describe('PoapEvents Component', () => {
  const mockAddressEvents = [
    { eventId: 1, title: 'Event 1' },
    { eventId: 2, title: 'Event 2' },
  ];

  it('renders events table when wallet is connected', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: {
        provider: { address: 'aa'.repeat(32) },
      },
    };

    renderWithProviders(<PoapEvents addressEvents={mockAddressEvents} />, { drawerValue });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays events when addressEvents are provided', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: {
        provider: { address: 'aa'.repeat(32) },
      },
    };

    renderWithProviders(<PoapEvents addressEvents={mockAddressEvents} />, { drawerValue });
    expect(screen.getByText(/Event 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Event 2/i)).toBeInTheDocument();
  });

  it('shows loading state when no events are provided', () => {
    const drawerValue = {
      ...mockDrawerContext,
      midnight: {
        provider: { address: 'aa'.repeat(32) },
      },
    };

    renderWithProviders(<PoapEvents addressEvents={[]} />, { drawerValue });
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('shows wallet connection required when no wallet', () => {
    renderWithProviders(<PoapEvents addressEvents={mockAddressEvents} />);
    // Should show wallet connection required state
    const walletStatus = screen.getByAltText('');
    expect(walletStatus).toBeInTheDocument();
  });
});

