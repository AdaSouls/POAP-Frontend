import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryBadge from '../../jsx/components/CategoryBadge';

describe('CategoryBadge', () => {
  it('renders the label and an icon for a known category', () => {
    const { container } = render(<CategoryBadge category="event" />);

    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the button-matching pill classes, not a plain Bootstrap badge', () => {
    const { container } = render(<CategoryBadge category="credential" />);

    const el = container.firstChild;
    expect(el).toHaveClass('btn', 'btn-white', 'btn-small', 'category-badge');
    expect(el).not.toHaveClass('badge');
  });

  it('renders nothing for a category-less (legacy) event/token', () => {
    const { container } = render(<CategoryBadge category={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for an unknown category key', () => {
    const { container } = render(<CategoryBadge category="not-a-real-category" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the right label for each known category', () => {
    const { rerender } = render(<CategoryBadge category="event" />);
    expect(screen.getByText('Event')).toBeInTheDocument();

    rerender(<CategoryBadge category="subscription" />);
    expect(screen.getByText('Subscription')).toBeInTheDocument();

    rerender(<CategoryBadge category="credential" />);
    expect(screen.getByText('Credential')).toBeInTheDocument();
  });
});
