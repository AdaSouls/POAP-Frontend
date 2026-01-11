import React from 'react';
import { render, screen } from '@testing-library/react';
import Search from '../../jsx/pages/search';
import { mockDrawerContext, renderWithProviders } from '../utils/testUtils';

describe('Search Page', () => {
  it('renders search page title', () => {
    renderWithProviders(<Search />);
    expect(screen.getByText(/Search/i)).toBeInTheDocument();
  });

  it('displays no events message when no events exist', () => {
    renderWithProviders(<Search />);
    expect(screen.getByText(/No events found/i)).toBeInTheDocument();
  });

  it('filters and displays only approved events', () => {
    const mockEvents = [
      { eventId: 1, approved: 'Approved', title: 'Approved Event' },
      { eventId: 2, approved: 'Pending', title: 'Pending Event' },
      { eventId: 3, approved: 'Approved', title: 'Another Approved Event' },
    ];

    const drawerValue = {
      ...mockDrawerContext,
      poapEvents: mockEvents,
    };

    renderWithProviders(<Search />, { drawerValue });
    
    // Should only show approved events
    expect(screen.queryByText(/Pending Event/i)).not.toBeInTheDocument();
  });

  it('renders event components for approved events', () => {
    const mockEvents = [
      { eventId: 1, approved: 'Approved', title: 'Approved Event' },
    ];

    const drawerValue = {
      ...mockDrawerContext,
      poapEvents: mockEvents,
    };

    renderWithProviders(<Search />, { drawerValue });
    
    // Table should be rendered
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});

