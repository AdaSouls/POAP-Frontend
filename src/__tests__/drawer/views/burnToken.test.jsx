import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BurnToken from '../../../jsx/drawer/views/burnToken';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { TOKEN_BURNED_EVENT } from '../../../midnight/token-events';

const EVENT = 'aa'.repeat(32);

function buildDrawerValue(service, mode = 'revoke') {
  return {
    ...mockDrawerContext,
    midnight: { ...mockDrawerContext.midnight, provider: { address: 'bb'.repeat(32), wallet: 'Lace', service } },
    burnTokenContext: { mode, tokenId: 7, eventId: EVENT, eventName: 'Tributo' },
  };
}

describe('BurnToken drawer view', () => {
  it('asks to connect a wallet first', () => {
    renderWithProviders(<BurnToken />, {
      drawerValue: { ...mockDrawerContext, burnTokenContext: { mode: 'burn', tokenId: 7, eventId: EVENT } },
    });
    expect(screen.getByText(/connect your wallet first/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^burn$/i })).toBeDisabled();
  });

  it('revoke: explains it is permanent, burns the token, announces it and closes', async () => {
    const service = { burn: jest.fn().mockResolvedValue({ public: { txHash: 'ab'.repeat(32) } }) };
    const dispatch = jest.fn();
    const onBurned = jest.fn();
    window.addEventListener(TOKEN_BURNED_EVENT, onBurned);
    renderWithProviders(<BurnToken />, { drawerValue: buildDrawerValue(service), drawerDispatch: dispatch });

    expect(screen.getByRole('heading', { name: /revoke poap/i })).toBeInTheDocument();
    expect(screen.getByText(/POAP #7/)).toBeInTheDocument();
    expect(screen.getByText(/can't be undone/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^revoke$/i }));

    await waitFor(() => expect(service.burn).toHaveBeenCalledWith(7n));
    expect(onBurned).toHaveBeenCalledWith(expect.objectContaining({ detail: { eventId: EVENT, tokenId: '7' } }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
    window.removeEventListener(TOKEN_BURNED_EVENT, onBurned);
  });

  it('burn (holder): uses the holder wording', () => {
    renderWithProviders(<BurnToken />, { drawerValue: buildDrawerValue({ burn: jest.fn() }, 'burn') });
    expect(screen.getByRole('heading', { name: /burn poap/i })).toBeInTheDocument();
    expect(screen.getByText(/burns your POAP #7/i)).toBeInTheDocument();
  });

  it('keeps the popup open when the burn fails', async () => {
    const service = { burn: jest.fn().mockRejectedValue(new Error('Not authorized to burn this token')) };
    const dispatch = jest.fn();
    renderWithProviders(<BurnToken />, { drawerValue: buildDrawerValue(service), drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /^revoke$/i }));

    expect(await screen.findByRole('button', { name: /^revoke$/i })).toBeEnabled();
    expect(service.burn).toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
  });

  it('Cancel closes without burning', async () => {
    const service = { burn: jest.fn() };
    const dispatch = jest.fn();
    renderWithProviders(<BurnToken />, { drawerValue: buildDrawerValue(service), drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
    expect(service.burn).not.toHaveBeenCalled();
  });
});
