import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppHome from '../../jsx/pages/appHome';
import { renderWithProviders } from '../../testUtils';

describe('App hub (/app)', () => {
  beforeEach(() => window.localStorage.clear());

  it('asks to select a role and links each role to its pages', () => {
    renderWithProviders(<AppHome />);
    expect(screen.getByRole('heading', { name: 'Select a role' })).toBeInTheDocument();
    expect(screen.getByText('Organizer')).toHaveClass('role-organizer');
    expect(screen.getByText('Subscriber')).toHaveClass('role-subscriber');
    expect(screen.getByRole('link', { name: /my events/i })).toHaveAttribute('href', '/app/my-events');
    expect(screen.getByRole('link', { name: /explore events/i })).toHaveAttribute('href', '/app/explore-events');
    expect(screen.getByRole('link', { name: /my subscriptions/i })).toHaveAttribute('href', '/app/my-subscriptions');
  });

  it('remembers the role of the page picked', async () => {
    renderWithProviders(<AppHome />);
    await userEvent.click(screen.getByRole('link', { name: /my events/i }));
    expect(JSON.stringify(window.localStorage)).toMatch(/organizer/);
  });
});
