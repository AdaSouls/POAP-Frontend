import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import Dashboard from '../../jsx/pages/index';
import { renderWithProviders } from '../../testUtils';

describe('Dashboard Page (landing)', () => {
  it('renders the hero headline', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/One token\. Endless ways to prove it\./i)).toBeInTheDocument();
  });

  it('renders all seven use-case cards', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Event Tickets & Access')).toBeInTheDocument();
    expect(screen.getByText('Podcast Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Live Streams & Social Content')).toBeInTheDocument();
    expect(screen.getByText('Private Meetings & Calls')).toBeInTheDocument();
    expect(screen.getByText('Diplomas & Certificates')).toBeInTheDocument();
    expect(screen.getByText('Celebrity & Athlete Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Document Delivery')).toBeInTheDocument();
  });

  it('links out to both role pages', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByRole('heading', { name: 'Organizer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Subscriber' })).toBeInTheDocument();
    const learnMoreLinks = screen.getAllByRole('link', { name: /learn more/i });
    expect(learnMoreLinks.map((link) => link.getAttribute('href')).sort()).toEqual([
      '/organizer',
      '/subscriber',
    ]);
  });

  it('has no wallet-connect UI — the hero CTA routes into the app instead', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.queryByRole('button', { name: /connect wallet/i })).not.toBeInTheDocument();
    const getStartedLinks = screen.getAllByRole('link', { name: /get started/i });
    expect(getStartedLinks.length).toBeGreaterThan(0);
    getStartedLinks.forEach((link) => expect(link).toHaveAttribute('href', '/app'));
  });

  it('nav "Roles" dropdown links to both role pages', () => {
    renderWithProviders(<Dashboard />);
    fireEvent.click(screen.getByRole('button', { name: /^roles/i }));
    expect(screen.getByRole('link', { name: /organizer/i })).toHaveAttribute('href', '/organizer');
    expect(screen.getByRole('link', { name: /subscriber/i })).toHaveAttribute('href', '/subscriber');
  });

  it('says in the footer that it is powered by AdaSouls', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText(/powered by/i)).toBeInTheDocument();
    expect(screen.getByAltText('AdaSouls').closest('a')).toHaveAttribute('href', 'https://adasouls.io');
    expect(screen.getByText(/© 2026 Velum/)).toBeInTheDocument();
  });

  it('keeps the footer hidden on the hero (it shows from the second screen on)', () => {
    const { container } = renderWithProviders(<Dashboard />);
    const footer = container.querySelector('.landing-fixed-footer');
    expect(footer).not.toHaveClass('is-visible');
    expect(footer).toHaveAttribute('aria-hidden', 'true');
  });
});
