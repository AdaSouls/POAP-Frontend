import React from 'react';
import { screen, within } from '@testing-library/react';
import Docs from '../../jsx/pages/docs';
import { renderWithProviders } from '../../testUtils';

beforeAll(() => {
  global.IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
});

describe('Docs page', () => {
  it('renders the user guide with organizer sections first', () => {
    renderWithProviders(<Docs />);
    expect(screen.getByRole('heading', { name: 'How Velum works' })).toBeInTheDocument();
    const toc = screen.getByRole('navigation', { name: 'Documentation sections' });
    const groups = Array.from(toc.querySelectorAll('.docs-toc-group-title')).map((el) => el.textContent);
    expect(groups).toEqual(['Basics', 'Organizers', 'People who receive credentials', 'Verifiers', 'Reference']);
  });

  it('links every table-of-contents entry to a section on the page', () => {
    const { container } = renderWithProviders(<Docs />);
    const links = within(screen.getByRole('navigation', { name: 'Documentation sections' })).getAllByRole('link');
    expect(links.length).toBeGreaterThan(10);
    links.forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      expect(container.querySelector(`section#${id}`)).not.toBeNull();
    });
  });

  it('points verifiers to the verify page', () => {
    renderWithProviders(<Docs />);
    expect(screen.getByRole('link', { name: '/app/verify' })).toHaveAttribute('href', '/app/verify');
  });
});
