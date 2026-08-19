import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChannelsField from '../../jsx/components/ChannelsField';

describe('ChannelsField', () => {
  it('renders no rows when the channels array is empty', () => {
    render(<ChannelsField values={[]} onChange={jest.fn()} />);
    expect(screen.queryByLabelText('Channel value')).not.toBeInTheDocument();
  });

  it('appends a new empty row when "Add channel" is clicked', async () => {
    const onChange = jest.fn();
    render(<ChannelsField values={[]} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /add channel/i }));

    expect(onChange).toHaveBeenCalledWith([{ type: 'email', value: '' }]);
  });

  it('renders one row per existing channel, with type and value populated', () => {
    render(
      <ChannelsField
        values={[{ type: 'website', value: 'https://example.com' }]}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Channel type')).toHaveTextContent('Website');
    expect(screen.getByLabelText('Channel value')).toHaveValue('https://example.com');
  });

  it('updates a row\'s value via onChange without touching other rows', async () => {
    const onChange = jest.fn();
    render(
      <ChannelsField
        values={[{ type: 'email', value: '' }, { type: 'telegram', value: '@handle' }]}
        onChange={onChange}
      />,
    );

    await userEvent.type(screen.getAllByLabelText('Channel value')[0], 'x');

    expect(onChange).toHaveBeenCalledWith([
      { type: 'email', value: 'x' },
      { type: 'telegram', value: '@handle' },
    ]);
  });

  it('removes a row when its remove button is clicked', async () => {
    const onChange = jest.fn();
    render(
      <ChannelsField
        values={[{ type: 'email', value: 'a@b.com' }]}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /remove channel/i }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
