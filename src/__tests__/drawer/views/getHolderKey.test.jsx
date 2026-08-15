import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GetHolderKey from '../../../jsx/drawer/views/getHolderKey';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';

describe('GetHolderKey drawer view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a connect-wallet message when there is no provider', () => {
    renderWithProviders(<GetHolderKey />);
    expect(screen.getByText(/connect your wallet first/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/organizer public key/i)).not.toBeInTheDocument();
  });

  it('rejects an invalid issuer public key without calling the service', async () => {
    const getHolderPkHex = jest.fn();
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { service: { getHolderPkHex } } },
    };
    renderWithProviders(<GetHolderKey />, { drawerValue });

    await userEvent.type(screen.getByLabelText(/organizer public key/i), 'not-a-valid-key');
    await userEvent.click(screen.getByRole('button', { name: /generate my key/i }));

    expect(getHolderPkHex).not.toHaveBeenCalled();
  });

  it('derives and displays the holder key for a valid issuer public key, and lets it be copied', async () => {
    const issuerPkHex = 'bb'.repeat(32);
    const holderPkHex = 'cc'.repeat(32);
    const getHolderPkHex = jest.fn().mockResolvedValue(holderPkHex);
    const drawerValue = {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { service: { getHolderPkHex } } },
    };
    renderWithProviders(<GetHolderKey />, { drawerValue });

    await userEvent.type(screen.getByLabelText(/organizer public key/i), issuerPkHex);
    await userEvent.click(screen.getByRole('button', { name: /generate my key/i }));

    await waitFor(() => {
      expect(getHolderPkHex).toHaveBeenCalledWith(Uint8Array.from(Buffer.from(issuerPkHex, 'hex')));
    });
    expect(await screen.findByText(holderPkHex)).toBeInTheDocument();

    navigator.clipboard.writeText.mockClear();
    await userEvent.click(screen.getByRole('button', { name: /^copy$/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(holderPkHex);
  });

  it('dispatches CLOSE_DRAWER when the close button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<GetHolderKey />, { drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
  });
});
