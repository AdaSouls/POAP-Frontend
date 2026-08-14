import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventDetailsFields from '../../jsx/components/EventDetailsFields';

const emptyValues = { name: '', description: '' };

describe('EventDetailsFields', () => {
  it('calls onChange with the typed name', async () => {
    const onChange = jest.fn();
    render(<EventDetailsFields values={emptyValues} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText(/Event Name/i), 'X');

    expect(onChange).toHaveBeenCalledWith({ ...emptyValues, name: 'X' });
  });

  it('calls onChange with the typed description', async () => {
    const onChange = jest.fn();
    render(<EventDetailsFields values={emptyValues} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText(/Description/i), 'X');

    expect(onChange).toHaveBeenCalledWith({ ...emptyValues, description: 'X' });
  });

  it('reflects existing values in the inputs', () => {
    render(
      <EventDetailsFields values={{ name: 'DevCon', description: 'A great event' }} onChange={jest.fn()} />,
    );

    expect(screen.getByLabelText(/Event Name/i)).toHaveValue('DevCon');
    expect(screen.getByLabelText(/Description/i)).toHaveValue('A great event');
  });
});
