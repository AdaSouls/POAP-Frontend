import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BackupRestore from '../../../jsx/drawer/views/backupRestore';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { backupNow, restoreIntoSession } from '../../../midnight/backup';
import { getBackupStatus, markBackedUp, setBackupContext } from '../../../midnight/backup-status';
import { isRecoveryCodeSaved, storeRecoveryCode } from '../../../midnight/storage-password';

// The crypto/transport side is covered in src/__tests__/midnight/backup.test.ts — here only the
// popup's own behavior. backup-status stays real (plain localStorage bookkeeping).
jest.mock('../../../midnight/backup', () => ({
  backupNow: jest.fn(),
  restoreIntoSession: jest.fn(),
}));

const COIN_PK = 'coin-pk';
const CONTRACT = 'cc'.repeat(32);
const CODE = 'ABCDE-FGHJK-MNPQR-STVWX-YZ012-34567';

const connectedDrawer = (overrides = {}) => ({
  ...mockDrawerContext,
  midnight: {
    ...mockDrawerContext.midnight,
    disconnect: jest.fn(),
    provider: {
      address: 'aa'.repeat(32),
      contractAddress: CONTRACT,
      wallet: 'Lace',
      service: { walletCoinPublicKey: COIN_PK },
    },
    ...overrides,
  },
});

describe('BackupRestore drawer view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    setBackupContext({ coinPublicKey: COIN_PK, contractAddress: CONTRACT });
    storeRecoveryCode(COIN_PK, CODE, false);
  });

  afterEach(() => setBackupContext(null));

  it('asks to connect first when no wallet is connected', () => {
    renderWithProviders(<BackupRestore />);
    expect(screen.getByText(/connect your wallet to back up/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /back up to cloud/i })).not.toBeInTheDocument();
  });

  it('shows the recovery code masked, reveals it, and records that the user saved it', async () => {
    renderWithProviders(<BackupRestore />, { drawerValue: connectedDrawer() });

    expect(screen.queryByText(CODE)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /show recovery code/i }));
    expect(screen.getByText(CODE)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /copy recovery code/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(CODE);

    await userEvent.click(screen.getByLabelText(/i saved my recovery code/i));
    expect(isRecoveryCodeSaved(COIN_PK)).toBe(true);
    expect(screen.getByLabelText(/i saved my recovery code/i)).toBeChecked();
  });

  it('has automatic cloud backup on by default, and can back up to the cloud or a file by hand', async () => {
    backupNow.mockResolvedValue(undefined);
    renderWithProviders(<BackupRestore />, { drawerValue: connectedDrawer() });

    expect(screen.getByLabelText(/automatically/i)).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: /back up to cloud/i }));
    expect(backupNow).toHaveBeenCalledWith({ cloud: true, file: false });
    expect(await screen.findByText(/backed up to the cloud/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /download encrypted file/i }));
    expect(backupNow).toHaveBeenCalledWith({ cloud: false, file: true });
    expect(await screen.findByText(/backup file downloaded/i)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/automatically/i));
    expect(getBackupStatus().autoBackup).toBe(false);
  });

  it('shows the error when a backup fails', async () => {
    backupNow.mockRejectedValue(new Error('Cloud backup failed (500).'));
    renderWithProviders(<BackupRestore />, { drawerValue: connectedDrawer() });

    await userEvent.click(screen.getByRole('button', { name: /back up to cloud/i }));
    expect(await screen.findByText('Cloud backup failed (500).')).toBeInTheDocument();
  });

  it('restores from the cloud, then disconnects so the restored identity is loaded on reconnect', async () => {
    restoreIntoSession.mockResolvedValue(undefined);
    window.localStorage.setItem(`adasouls:midnight:callerPkHex:${COIN_PK}:${CONTRACT}`, 'stale-pk');
    const dispatch = jest.fn();
    const drawerValue = connectedDrawer();
    renderWithProviders(<BackupRestore />, { drawerValue, drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /restore from a backup/i }));
    await userEvent.type(screen.getByLabelText(/^recovery code$/i), CODE);
    await userEvent.click(screen.getByRole('button', { name: /^restore$/i }));

    await waitFor(() =>
      expect(restoreIntoSession).toHaveBeenCalledWith(CODE, { kind: 'cloud' }),
    );
    expect(await screen.findByText(/backup restored/i)).toBeInTheDocument();
    expect(drawerValue.midnight.disconnect).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'UPDATE_MIDNIGHT_WALLET', payload: null });
    expect(window.localStorage.getItem(`adasouls:midnight:callerPkHex:${COIN_PK}:${CONTRACT}`)).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: /connect wallet/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MIDNIGHT_WALLET' });
  });

  it('reflects status changes made elsewhere (e.g. an automatic backup)', async () => {
    renderWithProviders(<BackupRestore />, { drawerValue: connectedDrawer() });
    expect(screen.getByText(/not backed up yet/i)).toBeInTheDocument();

    act(() => markBackedUp());
    expect(await screen.findByText(/^backed up /i)).toBeInTheDocument();
  });
});
