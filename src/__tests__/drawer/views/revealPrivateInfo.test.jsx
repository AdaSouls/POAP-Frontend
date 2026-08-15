import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RevealPrivateInfo from '../../../jsx/drawer/views/revealPrivateInfo';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { getPrivateContentSignedUrl } from '../../../services/ipfs.service';

jest.mock('../../../services/ipfs.service', () => ({
  getPrivateContentSignedUrl: jest.fn(),
}));

describe('RevealPrivateInfo drawer view', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('shows a connect-wallet message when there is no provider', () => {
    renderWithProviders(<RevealPrivateInfo />);
    expect(screen.getByText(/connect your wallet first/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/event id/i)).not.toBeInTheDocument();
  });

  it('rejects invalid hex input without calling the service', async () => {
    const revealPrivateMetadata = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { service: { revealPrivateMetadata } } },
    };
    renderWithProviders(<RevealPrivateInfo />, { drawerValue });

    await userEvent.type(screen.getByLabelText(/event id/i), 'not-hex');
    await userEvent.type(screen.getByLabelText(/^value/i), 'bb'.repeat(32));
    await userEvent.type(screen.getByLabelText(/^rand/i), 'cc'.repeat(32));
    await userEvent.click(screen.getByRole('button', { name: /^reveal$/i }));

    expect(revealPrivateMetadata).not.toHaveBeenCalled();
  });

  it('reveals on-chain then fetches and displays the content via the signed-URL path', async () => {
    const eventIdHex = 'aa'.repeat(32);
    const valueHex = 'bb'.repeat(32);
    const randHex = 'cc'.repeat(32);
    const revealPrivateMetadata = jest.fn().mockResolvedValue({ txHash: '0xdeadbeef' });
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { service: { revealPrivateMetadata } } },
    };
    getPrivateContentSignedUrl.mockResolvedValue('https://gateway.example/signed');
    global.fetch = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue({ notes: 'the secret' }) });

    renderWithProviders(<RevealPrivateInfo />, { drawerValue });

    await userEvent.type(screen.getByLabelText(/event id/i), eventIdHex);
    await userEvent.type(screen.getByLabelText(/^value/i), valueHex);
    await userEvent.type(screen.getByLabelText(/^rand/i), randHex);
    await userEvent.click(screen.getByRole('button', { name: /^reveal$/i }));

    await waitFor(() => {
      expect(revealPrivateMetadata).toHaveBeenCalledWith(
        Uint8Array.from(Buffer.from(eventIdHex, 'hex')),
        Uint8Array.from(Buffer.from(valueHex, 'hex')),
        Uint8Array.from(Buffer.from(randHex, 'hex')),
      );
    });
    expect(getPrivateContentSignedUrl).toHaveBeenCalledWith(valueHex);
    expect(await screen.findByText('the secret')).toBeInTheDocument();
  });

  it('dispatches CLOSE_DRAWER when the close button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<RevealPrivateInfo />, { drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
  });
});
