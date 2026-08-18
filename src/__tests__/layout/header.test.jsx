import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Header from '../../jsx/layout/header';
import { renderWithProviders } from '../../testUtils';

const STORAGE_KEY = 'adasouls:siteRole';

describe('Header nav', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('defaults to the Subscriber role and shows all its nav links when nothing is stored', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('button', { name: /subscriber/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore events/i })).toHaveAttribute('href', '/explore-events');
    expect(screen.getByRole('link', { name: /my subscriptions/i })).toHaveAttribute('href', '/my-subscriptions');
  });

  it('restores the last-selected role from localStorage on mount', () => {
    window.localStorage.setItem(STORAGE_KEY, 'organizer');
    renderWithProviders(<Header />);
    expect(screen.getByRole('button', { name: /organizer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my events/i })).toHaveAttribute('href', '/my-events');
  });

  it('switches the second nav link and persists the choice when a new role is picked', () => {
    renderWithProviders(<Header />);

    fireEvent.click(screen.getByRole('button', { name: /subscriber/i }));
    const organizerItemTitle = screen.getByText('Organizer', { selector: '.header-nav-dropdown-item-title' });
    fireEvent.click(organizerItemTitle.closest('button'));

    expect(screen.getByRole('link', { name: /my events/i })).toHaveAttribute('href', '/my-events');
    expect(screen.queryByRole('link', { name: /my subscriptions/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('organizer');
  });

  it('shows an icon and short description for each role option in the dropdown', () => {
    renderWithProviders(<Header />);

    fireEvent.click(screen.getByRole('button', { name: /subscriber/i }));

    expect(screen.getByText(/view and claim subscriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/create events and claim subscriptions/i)).toBeInTheDocument();
  });
});
