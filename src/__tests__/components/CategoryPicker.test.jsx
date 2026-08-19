import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryPicker from '../../jsx/components/CategoryPicker';

const categories = [
  { key: 'event', label: 'Event', shortDescription: 'An in-person or virtual event.' },
  { key: 'subscription', label: 'Subscription', shortDescription: 'Follow a person or entity.' },
  { key: 'credential', label: 'Credential', shortDescription: 'Documents you send yourself.' },
];

describe('CategoryPicker', () => {
  it('renders one card per category', () => {
    render(<CategoryPicker value={null} onChange={jest.fn()} categories={categories} />);

    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Credential')).toBeInTheDocument();
  });

  it('calls onChange with the clicked category key', async () => {
    const onChange = jest.fn();
    render(<CategoryPicker value={null} onChange={onChange} categories={categories} />);

    await userEvent.click(screen.getByText('Subscription'));

    expect(onChange).toHaveBeenCalledWith('subscription');
  });

  it('marks the selected category as pressed', () => {
    render(<CategoryPicker value="credential" onChange={jest.fn()} categories={categories} />);

    expect(screen.getByRole('radio', { name: 'Credential' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Event' })).not.toBeChecked();
  });
});
