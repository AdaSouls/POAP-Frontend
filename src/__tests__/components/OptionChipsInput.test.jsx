import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionChipsInput from '../../jsx/components/OptionChipsInput';

// Stateful wrapper: the component is controlled.
function Harness({ initial = [], onState = () => {} }) {
  const [options, setOptions] = useState(initial);
  const [draft, setDraft] = useState('');
  return (
    <OptionChipsInput
      options={options}
      draft={draft}
      onChange={(nextOptions, nextDraft) => {
        setOptions(nextOptions);
        setDraft(nextDraft);
        onState(nextOptions, nextDraft);
      }}
      ariaLabel="List options"
      placeholder="Type an option"
    />
  );
}

const chipLabels = () => screen.queryAllByRole('button', { name: /remove option/i }).map((b) => b.getAttribute('aria-label').replace('Remove option ', ''));

describe('OptionChipsInput', () => {
  it('turns what was typed into a chip on comma', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByLabelText('List options'), 'Campo, Platea,');
    expect(chipLabels()).toEqual(['Campo', 'Platea']);
    expect(screen.getByLabelText('List options')).toHaveValue('');
  });

  it('also on Enter, and when leaving the field', async () => {
    render(<Harness />);
    await userEvent.type(screen.getByLabelText('List options'), 'Campo{enter}VIP');
    expect(chipLabels()).toEqual(['Campo']);
    fireEvent.blur(screen.getByLabelText('List options'));
    expect(chipLabels()).toEqual(['Campo', 'VIP']);
  });

  it('removes a chip with its X, and the last one with Backspace on an empty field', async () => {
    render(<Harness initial={['Campo', 'Platea', 'VIP']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove option Platea' }));
    expect(chipLabels()).toEqual(['Campo', 'VIP']);
    await userEvent.type(screen.getByLabelText('List options'), '{backspace}');
    expect(chipLabels()).toEqual(['Campo']);
  });

  it('splits a pasted list into chips', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('List options'), { target: { value: 'Campo, Platea, VIP' } });
    expect(chipLabels()).toEqual(['Campo', 'Platea']);
    expect(screen.getByLabelText('List options')).toHaveValue('VIP');
  });

  it("doesn't add the same option twice: it stays typed so the row can flag it", async () => {
    const onState = jest.fn();
    render(<Harness initial={['Campo']} onState={onState} />);
    await userEvent.type(screen.getByLabelText('List options'), 'Campo,');
    expect(chipLabels()).toEqual(['Campo']);
    expect(screen.getByLabelText('List options')).toHaveValue('Campo');
  });
});
