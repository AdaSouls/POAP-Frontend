import { renderHook, waitFor } from '@testing-library/react';
import { useBlockedIssuers, useIssuerRegistry } from '../../jsx/hooks/useBlockedIssuers';
import { useDrawer } from '../../jsx/contexts/drawer/drawer.provider';

jest.mock('../../jsx/contexts/drawer/drawer.provider', () => ({
  useDrawer: jest.fn(),
}));

const pk = (byte) => new Uint8Array(32).fill(byte);
const hex = (byte) => Buffer.from(pk(byte)).toString('hex');

function mockLedgerIssuers(entries) {
  const getState = jest.fn().mockResolvedValue({ ledger: { issuers: entries } });
  useDrawer.mockReturnValue({ midnight: { provider: { service: { getState } } } });
  return getState;
}

describe('useBlockedIssuers Hook', () => {
  it('returns an empty set without a connected wallet', () => {
    useDrawer.mockReturnValue({ midnight: { provider: null } });
    const { result } = renderHook(() => useBlockedIssuers());
    expect(result.current.size).toBe(0);
  });

  it('collects only the inactive issuer keys from the ledger, as hex', async () => {
    mockLedgerIssuers([
      [pk(1), { organizerPk: pk(1), isActive: true }],
      [pk(2), { organizerPk: pk(2), isActive: false }],
    ]);
    const { result } = renderHook(() => useBlockedIssuers());

    await waitFor(() => expect(result.current.size).toBe(1));
    expect(result.current.has(hex(2))).toBe(true);
    expect(result.current.has(hex(1))).toBe(false);
  });

  it('lists active issuers as verified and inactive ones as blocked', async () => {
    mockLedgerIssuers([
      [pk(1), { organizerPk: pk(1), isActive: true }],
      [pk(2), { organizerPk: pk(2), isActive: false }],
    ]);
    const { result } = renderHook(() => useIssuerRegistry());

    await waitFor(() => expect(result.current.verified.size).toBe(1));
    expect(result.current.verified.has(hex(1))).toBe(true);
    expect(result.current.blocked.has(hex(2))).toBe(true);
  });

  it('stays empty when reading the ledger fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const getState = jest.fn().mockRejectedValue(new Error('offline'));
    useDrawer.mockReturnValue({ midnight: { provider: { service: { getState } } } });
    const { result } = renderHook(() => useBlockedIssuers());

    await waitFor(() => expect(getState).toHaveBeenCalled());
    expect(result.current.size).toBe(0);
    console.error.mockRestore();
  });
});
