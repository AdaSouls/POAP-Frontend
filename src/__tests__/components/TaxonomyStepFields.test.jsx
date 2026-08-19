import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaxonomyStepFields from '../../jsx/components/TaxonomyStepFields';

const taxonomy = {
  modality: {
    label: 'Format',
    options: [
      { value: 'in_person', label: 'In-person' },
      { value: 'virtual', label: 'Virtual' },
      { value: 'other', label: 'Other' },
    ],
  },
};

describe('TaxonomyStepFields', () => {
  it('renders one select per taxonomy field', () => {
    render(<TaxonomyStepFields taxonomy={taxonomy} values={{}} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Format')).toBeInTheDocument();
  });

  it('calls onChange with the picked value, merged with existing values', async () => {
    const onChange = jest.fn();
    render(
      <TaxonomyStepFields taxonomy={taxonomy} values={{ purpose: 'reward_attendance' }} onChange={onChange} />,
    );

    await userEvent.click(screen.getByLabelText('Format'));
    await userEvent.click(screen.getByRole('option', { name: 'Virtual' }));

    expect(onChange).toHaveBeenCalledWith({ purpose: 'reward_attendance', modality: 'virtual' });
  });

  it('reveals a free-text input when "Other" is selected, and omits it otherwise', async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <TaxonomyStepFields taxonomy={taxonomy} values={{}} onChange={onChange} />,
    );

    expect(screen.queryByLabelText(/Format \(other\)/i)).not.toBeInTheDocument();

    rerender(<TaxonomyStepFields taxonomy={taxonomy} values={{ modality: 'other' }} onChange={onChange} />);
    expect(screen.getByLabelText(/Format \(other\)/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Format \(other\)/i), 'X');
    expect(onChange).toHaveBeenLastCalledWith({ modality: 'other', modalityOther: 'X' });
  });
});
