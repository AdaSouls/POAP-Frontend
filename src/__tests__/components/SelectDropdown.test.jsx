import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SelectDropdown from '../../jsx/components/SelectDropdown';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('SelectDropdown', () => {
  it('shows the selected option\'s label on the trigger, menu closed by default', () => {
    render(<SelectDropdown id="my-select" value="b" onChange={jest.fn()} options={options} />);

    expect(screen.getByRole('button', { name: /option b/i })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the menu on click and lists every option', async () => {
    render(<SelectDropdown id="my-select" value="a" onChange={jest.fn()} options={options} />);

    await userEvent.click(screen.getByRole('button', { name: /option a/i }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option C' })).toBeInTheDocument();
  });

  it('calls onChange with the picked value and closes the menu', async () => {
    const onChange = jest.fn();
    render(<SelectDropdown id="my-select" value="a" onChange={onChange} options={options} />);

    await userEvent.click(screen.getByRole('button', { name: /option a/i }));
    await userEvent.click(screen.getByRole('option', { name: 'Option C' }));

    expect(onChange).toHaveBeenCalledWith('c');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('marks the currently selected option', async () => {
    render(<SelectDropdown id="my-select" value="b" onChange={jest.fn()} options={options} />);

    await userEvent.click(screen.getByRole('button', { name: /option b/i }));

    expect(screen.getByRole('option', { name: 'Option B' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Option A' })).toHaveAttribute('aria-selected', 'false');
  });

  it('closes when clicking outside', async () => {
    render(
      <div>
        <SelectDropdown id="my-select" value="a" onChange={jest.fn()} options={options} />
        <button type="button">outside</button>
      </div>,
    );

    await userEvent.click(screen.getByRole('button', { name: /option a/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    render(<SelectDropdown id="my-select" value="a" onChange={jest.fn()} options={options} />);

    await userEvent.click(screen.getByRole('button', { name: /option a/i }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('associates an external <label htmlFor> with the trigger via id', () => {
    render(
      <>
        <label htmlFor="my-select">My Field</label>
        <SelectDropdown id="my-select" value="a" onChange={jest.fn()} options={options} />
      </>,
    );

    expect(screen.getByLabelText('My Field')).toBeInTheDocument();
  });

  it('supports ariaLabel for the no-external-label case', () => {
    render(<SelectDropdown value="a" onChange={jest.fn()} options={options} ariaLabel="Channel type" />);

    expect(screen.getByLabelText('Channel type')).toBeInTheDocument();
  });
});
