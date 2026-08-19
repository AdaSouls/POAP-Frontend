import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrganizationProfileFields from '../../jsx/components/OrganizationProfileFields';

describe('OrganizationProfileFields', () => {
  it('renders the name field plus all five optional address fields by default, empty', () => {
    render(<OrganizationProfileFields values={{}} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Organizer Name')).toHaveValue('');
    expect(screen.getByLabelText('Address')).toHaveValue('');
    expect(screen.getByLabelText('City')).toHaveValue('');
    expect(screen.getByLabelText('State / Province')).toHaveValue('');
    expect(screen.getByLabelText('Country')).toHaveValue('');
    expect(screen.getByLabelText('Postal code')).toHaveValue('');
  });

  it('hides the address fields (but keeps the name field) when showAddress is false', () => {
    render(<OrganizationProfileFields values={{}} onChange={jest.fn()} showAddress={false} />);

    expect(screen.getByLabelText('Organizer Name')).toBeInTheDocument();
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('City')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('State / Province')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Country')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Postal code')).not.toBeInTheDocument();
  });

  it('reflects existing values', () => {
    render(
      <OrganizationProfileFields
        values={{ name: 'AdaSouls Inc.', addressLine: '123 Main St', country: 'US' }}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Organizer Name')).toHaveValue('AdaSouls Inc.');
    expect(screen.getByLabelText('Address')).toHaveValue('123 Main St');
    expect(screen.getByLabelText('Country')).toHaveValue('US');
  });

  it('calls onChange with the merged values when the name field is typed', async () => {
    const onChange = jest.fn();
    render(<OrganizationProfileFields values={{ country: 'US' }} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Organizer Name'), 'X');

    expect(onChange).toHaveBeenCalledWith({ country: 'US', name: 'X' });
  });

  it('calls onChange with the merged values when an address field is typed', async () => {
    const onChange = jest.fn();
    render(<OrganizationProfileFields values={{ country: 'US' }} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('City'), 'X');

    expect(onChange).toHaveBeenCalledWith({ country: 'US', locality: 'X' });
  });
});
