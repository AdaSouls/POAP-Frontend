import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DisclosureRespond from '../../jsx/pages/disclosureRespond';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getDisclosureRequest } from '../../midnight/indexer.service';
import { getPrivateAttributeDraft } from '../../midnight/private-attribute-drafts';
import { buildAndSubmitDisclosureProof } from '../../midnight/disclosure-response';

jest.mock('../../midnight/indexer.service', () => ({
  getDisclosureRequest: jest.fn(),
}));
jest.mock('../../midnight/private-attribute-drafts', () => ({
  getPrivateAttributeDraft: jest.fn(),
}));
jest.mock('../../midnight/disclosure-response', () => ({
  buildAndSubmitDisclosureProof: jest.fn(),
}));

const REQUEST_ID_HEX = 'ee'.repeat(32);
const EVENT_ID_HEX = 'aa'.repeat(32);
const FIELD_ID_HEX = 'bb'.repeat(32);

function renderAt(pathAndQuery, options) {
  window.history.pushState({}, '', pathAndQuery);
  return renderWithProviders(<DisclosureRespond />, options);
}

function drawerValueWithProvider(service) {
  return {
    ...mockDrawerContext,
    midnight: { ...mockDrawerContext.midnight, provider: { wallet: 'Lace', service } },
  };
}

describe('DisclosureRespond page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDisclosureRequest.mockResolvedValue({ eventId: EVENT_ID_HEX, fieldId: FIELD_ID_HEX });
  });

  it('shows a missing-requestId message when the link has no requestId param', () => {
    renderAt('/app/disclosure/respond');
    expect(screen.getByText(/missing requestid/i)).toBeInTheDocument();
  });

  it('shows a connect-wallet message when there is no provider', () => {
    renderAt(`/app/disclosure/respond?requestId=${REQUEST_ID_HEX}`);
    expect(screen.getByText(/connect your wallet first/i)).toBeInTheDocument();
  });

  it('shows an error when the requestId cannot be found', async () => {
    getDisclosureRequest.mockRejectedValue(new Error('not found'));
    renderAt(`/app/disclosure/respond?requestId=${REQUEST_ID_HEX}`, {
      drawerValue: drawerValueWithProvider({}),
    });

    expect(await screen.findByText(/could not find this disclosure request/i)).toBeInTheDocument();
  });

  it("shows a 'don't hold this attribute' message when there is no local draft", async () => {
    getDisclosureRequest.mockResolvedValue({ eventId: EVENT_ID_HEX, fieldId: FIELD_ID_HEX });
    getPrivateAttributeDraft.mockReturnValue(null);
    renderAt(`/app/disclosure/respond?requestId=${REQUEST_ID_HEX}`, {
      drawerValue: drawerValueWithProvider({}),
    });

    expect(await screen.findByText(/don't hold this attribute/i)).toBeInTheDocument();
  });

  it('decodes URI-encoded members from the link and submits via the shared helper', async () => {
    getDisclosureRequest.mockResolvedValue({ eventId: EVENT_ID_HEX, fieldId: FIELD_ID_HEX });
    getPrivateAttributeDraft.mockReturnValue({ fieldName: 'Region', valueHex: '01'.repeat(32), randHex: '02'.repeat(32) });
    buildAndSubmitDisclosureProof.mockResolvedValue({ txHash: '0xabc' });
    const service = { proveAttributeMembership: jest.fn() };

    renderAt(
      `/app/disclosure/respond?requestId=${REQUEST_ID_HEX}&members=EU,North%20America`,
      { drawerValue: drawerValueWithProvider(service) },
    );

    expect(await screen.findByText(/Region/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^respond$/i }));

    await waitFor(() => expect(buildAndSubmitDisclosureProof).toHaveBeenCalledWith({
      service,
      requestId: Uint8Array.from(Buffer.from(REQUEST_ID_HEX, 'hex')),
      eventId: Uint8Array.from(Buffer.from(EVENT_ID_HEX, 'hex')),
      fieldId: Uint8Array.from(Buffer.from(FIELD_ID_HEX, 'hex')),
      members: ['EU', 'North America'],
      once: false,
    }));
    expect(await screen.findByText(/^Response submitted\./i)).toBeInTheDocument();
  });

  it('passes once: true when the single-use switch is checked', async () => {
    getDisclosureRequest.mockResolvedValue({ eventId: EVENT_ID_HEX, fieldId: FIELD_ID_HEX });
    getPrivateAttributeDraft.mockReturnValue({ fieldName: 'Region', valueHex: '01'.repeat(32), randHex: '02'.repeat(32) });
    buildAndSubmitDisclosureProof.mockResolvedValue({ txHash: '0xabc' });
    const service = { proveAttributeMembershipOnce: jest.fn() };

    renderAt(`/app/disclosure/respond?requestId=${REQUEST_ID_HEX}&members=EU`, {
      drawerValue: drawerValueWithProvider(service),
    });

    await screen.findByText(/Region/i);
    await userEvent.click(screen.getByRole('checkbox', { name: /single-use/i }));
    await userEvent.click(screen.getByRole('button', { name: /^respond$/i }));

    await waitFor(() =>
      expect(buildAndSubmitDisclosureProof).toHaveBeenCalledWith(expect.objectContaining({ once: true })),
    );
  });
});
