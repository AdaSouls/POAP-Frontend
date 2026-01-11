import React from 'react';
import { render, screen } from '@testing-library/react';
import ClaimMint from '../../jsx/pages/claim-mint';
import { mockDrawerContext, renderWithProviders } from '../utils/testUtils';
import { checkEventsMintedByAddress } from '../../utils/poapContractInteractions';

// Mock utilities
jest.mock('../../utils/poapContractInteractions', () => ({
  checkEventsMintedByAddress: jest.fn((events, collection) => events),
}));

// Mock PoapEvent component
jest.mock('../../jsx/components/poapEvent', () => {
  return function MockPoapEvent({ event }) {
    return <tr><td>{event.title || 'Event'}</td></tr>;
  };
});

describe('ClaimMint Page', () => {
  const mockEvents = [
    { eventId: 1, title: 'Event 1', isMinted: false },
    { eventId: 2, title: 'Event 2', isMinted: true },
  ];

  it('renders claim mint page', () => {
    renderWithProviders(<ClaimMint />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays no events message when no events exist', () => {
    const drawerValue = {
      ...mockDrawerContext,
      poapEvents: [],
      poapCollection: [],
    };

    renderWithProviders(<ClaimMint />, { drawerValue });
    expect(screen.getByText(/No events found/i)).toBeInTheDocument();
  });

  it('displays events when they exist', () => {
    const drawerValue = {
      ...mockDrawerContext,
      poapEvents: mockEvents,
      poapCollection: [],
    };

    renderWithProviders(<ClaimMint />, { drawerValue });
    expect(checkEventsMintedByAddress).toHaveBeenCalledWith(mockEvents, []);
  });
});

