import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Header from '../../jsx/layout/header';
import { renderWithProviders } from '../../testUtils';

const STORAGE_KEY = 'adasouls:siteRole';

describe('Header nav', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('defaults to the Subscriber role and shows all its nav links when nothing is stored', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('button', { name: /subscriber/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore events/i })).toHaveAttribute('href', '/app/explore-events');
    expect(screen.getByRole('link', { name: /my subscriptions/i })).toHaveAttribute('href', '/app/my-subscriptions');
  });

  it('restores the last-selected role from localStorage on mount', () => {
    window.localStorage.setItem(STORAGE_KEY, 'organizer');
    renderWithProviders(<Header />);
    expect(screen.getByRole('button', { name: /organizer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /my events/i })).toHaveAttribute('href', '/app/my-events');
  });

  it('switches the second nav link, persists the choice, and navigates to that role\'s default page when nothing is remembered for it yet', () => {
    renderWithProviders(<Header />);

    fireEvent.click(screen.getByRole('button', { name: /subscriber/i }));
    const organizerItemTitle = screen.getByText('Organizer', { selector: '.header-nav-dropdown-item-title' });
    fireEvent.click(organizerItemTitle.closest('button'));

    expect(screen.getByRole('link', { name: /my events/i })).toHaveAttribute('href', '/app/my-events');
    expect(screen.queryByRole('link', { name: /my subscriptions/i })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('organizer');
    expect(window.location.pathname).toBe('/app/my-events');
  });

  it('remembers the last page visited under each role and returns there when switching back to it', () => {
    window.history.pushState({}, '', '/app/organizer-dashboard');
    window.localStorage.setItem(STORAGE_KEY, 'organizer');
    renderWithProviders(<Header />);

    // Switch to subscriber — nothing recorded for it yet, so it lands on its default page.
    fireEvent.click(screen.getByRole('button', { name: /organizer/i }));
    fireEvent.click(
      screen.getByText('Subscriber', { selector: '.header-nav-dropdown-item-title' }).closest('button')
    );
    expect(window.location.pathname).toBe('/app/explore-events');

    // Switch back to organizer — should return to the page it was on before, not the default.
    fireEvent.click(screen.getByRole('button', { name: /subscriber/i }));
    fireEvent.click(
      screen.getByText('Organizer', { selector: '.header-nav-dropdown-item-title' }).closest('button')
    );
    expect(window.location.pathname).toBe('/app/organizer-dashboard');
  });

  it('shows an icon and short description for each role option in the dropdown', () => {
    renderWithProviders(<Header />);

    fireEvent.click(screen.getByRole('button', { name: /subscriber/i }));

    expect(screen.getByText(/view and claim subscriptions/i)).toBeInTheDocument();
    expect(screen.getByText(/create events and claim subscriptions/i)).toBeInTheDocument();
  });

  it('shows a neutral "Select Role" placeholder and no role nav links on the /app hub, even with a role already persisted', () => {
    window.history.pushState({}, '', '/app');
    window.localStorage.setItem(STORAGE_KEY, 'organizer');
    renderWithProviders(<Header />);

    expect(screen.getByRole('button', { name: /select role/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^organizer$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /my events/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /explore events/i })).not.toBeInTheDocument();
  });

  it('still lets you pick a role from the dropdown while on the /app hub', () => {
    window.history.pushState({}, '', '/app');
    renderWithProviders(<Header />);

    fireEvent.click(screen.getByRole('button', { name: /select role/i }));
    fireEvent.click(
      screen.getByText('Organizer', { selector: '.header-nav-dropdown-item-title' }).closest('button')
    );

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('organizer');
    expect(window.location.pathname).toBe('/app/my-events');
  });
});
