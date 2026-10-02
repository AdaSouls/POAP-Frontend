import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import BottomNav from '../../jsx/layout/BottomNav';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';

const ROLE_KEY = 'velum:siteRole';
const PATHS_KEY = 'velum:lastRolePath';

describe('BottomNav (phones)', () => {
  beforeEach(() => window.localStorage.clear());

  it("shows the subscriber's pages around the switch", () => {
    window.history.pushState({}, '', '/app/explore-events');
    window.localStorage.setItem(ROLE_KEY, 'subscriber');
    renderWithProviders(<BottomNav />);
    expect(screen.getByRole('link', { name: /explore/i })).toHaveAttribute('href', '/app/explore-events');
    expect(screen.getByRole('link', { name: /my subs/i })).toHaveAttribute('href', '/app/my-subscriptions');
    expect(screen.getByRole('button', { name: 'Switch to Organizer' })).toBeInTheDocument();
  });

  it('switches role and lands on that role’s last page', () => {
    window.history.pushState({}, '', '/app/my-subscriptions');
    window.localStorage.setItem(ROLE_KEY, 'subscriber');
    renderWithProviders(<BottomNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to Organizer' }));
    expect(window.location.pathname).toBe('/app/my-events');
    expect(screen.getByRole('link', { name: /my events/i })).toBeInTheDocument();
  });

  it('goes back to the remembered subscriber page when switching back', () => {
    window.history.pushState({}, '', '/app/my-events');
    window.localStorage.setItem(ROLE_KEY, 'organizer');
    window.localStorage.setItem(PATHS_KEY, JSON.stringify({ subscriber: '/app/my-subscriptions' }));
    renderWithProviders(<BottomNav />);
    fireEvent.click(screen.getByRole('button', { name: 'Switch to Subscriber' }));
    expect(window.location.pathname).toBe('/app/my-subscriptions');
  });

  it('opens Create Event for organizers, or the wallet popup when not connected', () => {
    window.history.pushState({}, '', '/app/my-events');
    window.localStorage.setItem(ROLE_KEY, 'organizer');
    const dispatch = jest.fn();
    renderWithProviders(<BottomNav />, {
      drawerValue: { ...mockDrawerContext, midnight: { ...mockDrawerContext.midnight, provider: null } },
      drawerDispatch: dispatch,
    });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MIDNIGHT_WALLET' });
  });

  it('on the /app hub, offers both roles around a disabled switch', () => {
    window.history.pushState({}, '', '/app');
    window.localStorage.setItem(ROLE_KEY, 'subscriber');
    const { container } = renderWithProviders(<BottomNav />);
    expect(container.querySelector('.bottom-nav-switch')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: /switch to/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /organizer/i }));
    expect(window.location.pathname).toBe('/app/my-events');
    expect(window.localStorage.getItem(ROLE_KEY)).toBe('organizer');
  });
});
