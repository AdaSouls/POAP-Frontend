import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProveOwnership from '../../../jsx/drawer/views/proveOwnership';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { getAllDisclosureRequests } from '../../../midnight/indexer.service';

jest.mock('../../../midnight/indexer.service', () => ({
  getAllDisclosureRequests: jest.fn(),
}));

const ZERO = '0'.repeat(64);
const EVENT = 'aa'.repeat(32);
const ORGANIZER = 'bb'.repeat(32);
const ME = 'cc'.repeat(32);
const TOKEN = { tokenId: 5, eventId: EVENT, issuerPkHex: ORGANIZER, isBurned: false, eventName: 'DevCon' };

function buildDrawerValue(service) {
  return {
    ...mockDrawerContext,
    midnight: { ...mockDrawerContext.midnight, provider: { address: ME, wallet: 'Lace', service } },
    ownershipProof: TOKEN,
  };
}

describe('ProveOwnership drawer view', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks to connect a wallet first', () => {
    renderWithProviders(<ProveOwnership />, { drawerValue: { ...mockDrawerContext, ownershipProof: TOKEN } });
    expect(screen.getByText(/connect your wallet first/i)).toBeInTheDocument();
  });

  it("uses the organizer's request with one signature and shows the proof", async () => {
    getAllDisclosureRequests.mockResolvedValue([
      { requestId: '11'.repeat(32), verifierPk: ORGANIZER, eventId: EVENT, fieldId: ZERO, setRoot: ZERO },
    ]);
    const service = {
      publishDisclosureRequest: jest.fn(),
      proveTokenOwnership: jest.fn().mockResolvedValue({ public: { txHash: 'ab'.repeat(32) } }),
    };
    renderWithProviders(<ProveOwnership />, { drawerValue: buildDrawerValue(service) });

    const button = await screen.findByRole('button', { name: /generate proof \(1 signature\)/i });
    expect(screen.getByText(/the organizer published/i)).toBeInTheDocument();
    await userEvent.click(button);

    await waitFor(() => expect(screen.getByText(/^proof of ownership$/i)).toBeInTheDocument());
    expect(screen.getByText(/owns poap #5/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/\/app\/verify\?tx=abab/)).toBeInTheDocument();
    expect(service.publishDisclosureRequest).not.toHaveBeenCalled();
    expect(service.proveTokenOwnership).toHaveBeenCalledWith(expect.any(Uint8Array), BigInt(5));
  });

  it('warns about the two signatures and the identity link when no request exists', async () => {
    getAllDisclosureRequests.mockResolvedValue([]);
    const service = {
      publishDisclosureRequest: jest
        .fn()
        .mockResolvedValue({ public: { txHash: '0xpub' }, private: { result: new Uint8Array(32).fill(1) } }),
      proveTokenOwnership: jest.fn().mockResolvedValue({ public: { txHash: 'ab'.repeat(32) } }),
    };
    renderWithProviders(<ProveOwnership />, { drawerValue: buildDrawerValue(service) });

    const button = await screen.findByRole('button', { name: /generate proof \(2 signatures\)/i });
    expect(screen.getByText(/links\s+that ID to this token/i)).toBeInTheDocument();
    await userEvent.click(button);

    await waitFor(() => expect(screen.getByText(/^proof of ownership$/i)).toBeInTheDocument());
    expect(service.publishDisclosureRequest).toHaveBeenCalledTimes(1);
  });
});
