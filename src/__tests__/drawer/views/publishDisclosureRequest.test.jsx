import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublishDisclosureRequest from '../../../jsx/drawer/views/publishDisclosureRequest';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { getDisclosureRequestsByVerifier } from '../../../midnight/indexer.service';
import { buildMerkleTree } from '../../../midnight/merkle';
import { publishRequestSet } from '../../../midnight/disclosure-sets';

jest.mock('../../../midnight/disclosure-sets', () => ({
  publishRequestSet: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../midnight/indexer.service', () => ({
  getDisclosureRequestsByVerifier: jest.fn(),
}));
// Pulls in @midnight-ntwrk/compact-runtime (WASM-bindgen, unloadable under this project's Jest —
// see src/__tests__/midnight/merkle.test.ts's header comment), so it's mocked wholesale here same
// as in createEvent.test.jsx.
jest.mock('../../../midnight/merkle', () => ({
  buildMerkleTree: jest.fn(),
}));

const FIELD = { fieldId: 'cc'.repeat(32), label: 'Region' };
const EVENT_ID_HEX = 'aa'.repeat(32);

function buildDrawerValue({ publishDisclosureRequest, address = 'dd'.repeat(32) } = {}) {
  return {
    ...mockDrawerContext,
    midnight: {
      ...mockDrawerContext.midnight,
      provider: { address, wallet: 'Lace', service: { publishDisclosureRequest } },
    },
    disclosureEvent: { eventId: EVENT_ID_HEX, fields: [FIELD] },
  };
}

describe('PublishDisclosureRequest drawer view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildMerkleTree.mockResolvedValue({
      rootBytes: new Uint8Array(32).fill(5),
      leafCount: 2,
      pathForIndex: jest.fn(),
      pathForLeaf: jest.fn(),
    });
  });

  it('shows a connect-wallet message when there is no provider', () => {
    renderWithProviders(<PublishDisclosureRequest />, {
      drawerValue: { ...mockDrawerContext, disclosureEvent: { eventId: EVENT_ID_HEX, fields: [FIELD] } },
    });
    expect(screen.getByText(/connect your wallet first/i)).toBeInTheDocument();
  });

  it('shows a no-attributes message when the event has no private attribute fields', () => {
    const drawerValue = buildDrawerValue({ publishDisclosureRequest: jest.fn() });
    drawerValue.disclosureEvent = { eventId: EVENT_ID_HEX, fields: [] };
    renderWithProviders(<PublishDisclosureRequest />, { drawerValue });
    expect(screen.getByText(/no private attributes to ask about/i)).toBeInTheDocument();
  });

  it('publishes the request, builds a depth-16 set tree, and shows a share link once the indexer confirms it', async () => {
    const publishDisclosureRequest = jest.fn().mockResolvedValue({ txHash: '0xabc' });
    const drawerValue = buildDrawerValue({ publishDisclosureRequest });
    getDisclosureRequestsByVerifier.mockResolvedValue([
      {
        requestId: 'ee'.repeat(32),
        verifierPk: drawerValue.midnight.provider.address,
        eventId: EVENT_ID_HEX,
        fieldId: FIELD.fieldId,
        setRoot: Buffer.from(new Uint8Array(32).fill(5)).toString('hex'),
      },
    ]);

    renderWithProviders(<PublishDisclosureRequest />, { drawerValue });

    const memberInputs = screen.getAllByLabelText('Candidate value');
    await userEvent.type(memberInputs[0], 'EU');
    await userEvent.type(memberInputs[1], 'APAC');
    await userEvent.click(screen.getByRole('button', { name: /^publish request$/i }));

    await waitFor(() => expect(publishDisclosureRequest).toHaveBeenCalled());
    const [, eventIdArg, fieldIdArg, setRootArg] = publishDisclosureRequest.mock.calls[0];
    expect(eventIdArg).toEqual(Uint8Array.from(Buffer.from(EVENT_ID_HEX, 'hex')));
    expect(fieldIdArg).toEqual(Uint8Array.from(Buffer.from(FIELD.fieldId, 'hex')));
    expect(setRootArg).toEqual(new Uint8Array(32).fill(5));
    expect(buildMerkleTree).toHaveBeenCalledWith([expect.any(Uint8Array), expect.any(Uint8Array)], 16);

    expect(await screen.findByText(new RegExp(`requestId=${'ee'.repeat(32)}`))).toBeInTheDocument();
  });

  it('for a per-credential field: uses the returned requestId and publishes the accepted values for holders', async () => {
    const requestIdBytes = new Uint8Array(32).fill(0xee);
    const publishDisclosureRequest = jest
      .fn()
      .mockResolvedValue({ public: { txHash: '0xabc' }, private: { result: requestIdBytes } });
    publishRequestSet.mockResolvedValue(undefined);
    const drawerValue = buildDrawerValue({ publishDisclosureRequest });
    drawerValue.disclosureEvent = { eventId: EVENT_ID_HEX, fields: [{ ...FIELD, label: 'Sector', kind: 'credential' }] };
    renderWithProviders(<PublishDisclosureRequest />, { drawerValue });

    const memberInputs = screen.getAllByLabelText('Candidate value');
    await userEvent.type(memberInputs[0], 'Campo');
    await userEvent.type(memberInputs[1], 'Platea');
    await userEvent.click(screen.getByRole('button', { name: /^publish request$/i }));

    expect(await screen.findByText(/holders whose sector is one of these values/i)).toBeInTheDocument();
    expect(publishRequestSet).toHaveBeenCalledWith('ee'.repeat(32), ['Campo', 'Platea']);
    expect(getDisclosureRequestsByVerifier).not.toHaveBeenCalled();
    expect(screen.queryByText(/requestId=/)).not.toBeInTheDocument();
  });

  it('rejects submission with no candidate values', async () => {
    const publishDisclosureRequest = jest.fn();
    const drawerValue = buildDrawerValue({ publishDisclosureRequest });
    renderWithProviders(<PublishDisclosureRequest />, { drawerValue });

    await userEvent.click(screen.getByRole('button', { name: /^publish request$/i }));

    expect(publishDisclosureRequest).not.toHaveBeenCalled();
  });

  it('dispatches CLOSE_DRAWER when the close button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<PublishDisclosureRequest />, {
      drawerValue: buildDrawerValue({ publishDisclosureRequest: jest.fn() }),
      drawerDispatch: dispatch,
    });

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
  });
});
