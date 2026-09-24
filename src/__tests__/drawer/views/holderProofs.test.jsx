import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HolderProofs from '../../../jsx/drawer/views/holderProofs';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { listAnswerableRequests, proveAttendance, proveAttribute, valueQualifies } from '../../../midnight/holder-proofs';

// holder-proofs pulls in the compiled contract (WASM) — mocked, see merkle.test.ts.
jest.mock('../../../midnight/holder-proofs', () => ({
  listAnswerableRequests: jest.fn(),
  proveAttendance: jest.fn(),
  proveAttribute: jest.fn(),
  valueQualifies: jest.fn(),
}));

const ORGANIZER = 'bb'.repeat(32);
const SECTOR = '01'.repeat(32);
const TOKEN = { tokenId: 4, eventId: 'aa'.repeat(32), issuerPk: ORGANIZER, holderPk: 'cc'.repeat(32) };
const PKG = { fields: [{ fieldId: SECTOR, label: 'Sector', valueHex: '00', randHex: '00' }] };
const request = (id, fieldId = '0'.repeat(64)) => ({ requestId: id, verifierPk: ORGANIZER, eventId: TOKEN.eventId, fieldId });

function renderView(mode = 'ownership') {
  return renderWithProviders(<HolderProofs />, {
    drawerValue: {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: { address: 'ee'.repeat(32), service: {} } },
      holderProofsContext: { mode, token: TOKEN, eventName: 'Recital', credentialFields: [{ fieldId: SECTOR, label: 'Sector' }], pkg: PKG },
    },
  });
}

describe('HolderProofs drawer view', () => {
  it('explains when the organizer has not enabled proofs yet', async () => {
    listAnswerableRequests.mockResolvedValue([]);
    renderView();
    expect(await screen.findByText(/hasn't enabled proofs on this event yet/i)).toBeInTheDocument();
  });

  it('shows only the questions of its own mode', async () => {
    listAnswerableRequests.mockResolvedValue([
      { kind: 'attendance', request: request('11'.repeat(32)) },
      { kind: 'attribute', request: request('22'.repeat(32), SECTOR), label: 'Sector', members: ['Campo'] },
    ]);
    valueQualifies.mockReturnValue(true);
    renderView('detail');
    expect(await screen.findByText('Sector is one of: Campo')).toBeInTheDocument();
    expect(screen.queryByText('Holds a valid POAP of this event')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /prove a private detail/i })).toBeInTheDocument();
  });

  it('answers an attendance request anonymously and shows the receipt', async () => {
    listAnswerableRequests.mockResolvedValue([{ kind: 'attendance', request: request('11'.repeat(32)) }]);
    proveAttendance.mockResolvedValue({ txHash: 'ab'.repeat(32) });
    renderView();

    await userEvent.click(await screen.findByRole('button', { name: /^prove$/i }));

    await waitFor(() => expect(screen.getByText(/anonymous ownership proof/i)).toBeInTheDocument());
    expect(proveAttendance).toHaveBeenCalledWith({}, TOKEN, '11'.repeat(32), PKG);
    expect(screen.getByText('Holds a valid POAP of this event')).toBeInTheDocument();
    expect(screen.queryByText(/^token$/i)).not.toBeInTheDocument();
  });

  it('answers a question about a private field when the value qualifies', async () => {
    const item = { kind: 'attribute', request: request('22'.repeat(32), SECTOR), label: 'Sector', members: ['Campo', 'Platea'] };
    listAnswerableRequests.mockResolvedValue([item]);
    valueQualifies.mockReturnValue(true);
    proveAttribute.mockResolvedValue({ txHash: 'cd'.repeat(32) });
    renderView('detail');

    expect(await screen.findByText('Sector is one of: Campo, Platea')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^prove$/i }));

    await waitFor(() => expect(screen.getByText(/private detail proof/i)).toBeInTheDocument());
    expect(proveAttribute).toHaveBeenCalledWith({}, TOKEN, item.request, ['Campo', 'Platea'], PKG);
  });

  it("disables the answer when the holder's value isn't accepted", async () => {
    listAnswerableRequests.mockResolvedValue([
      { kind: 'attribute', request: request('22'.repeat(32), SECTOR), label: 'Sector', members: ['Platea'] },
    ]);
    valueQualifies.mockReturnValue(false);
    renderView('detail');

    expect(await screen.findByText(/your value isn't one of the accepted ones/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^prove$/i })).toBeDisabled();
  });
});
