import React from 'react';
import { screen } from '@testing-library/react';
import KeyInvite from '../../jsx/pages/keyInvite';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getEvent } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service', () => ({
  getEvent: jest.fn(),
}));
jest.mock('../../jsx/layout/layout', () => ({ children }) => <div>{children}</div>);

const ORG = 'ab'.repeat(32);
const EVENT = 'cd'.repeat(32);

function openAt(hash, provider) {
  window.history.pushState({}, '', `/app/key${hash}`);
  return renderWithProviders(<KeyInvite />, {
    drawerValue: { ...mockDrawerContext, midnight: { ...mockDrawerContext.midnight, provider } },
  });
}

describe('KeyInvite page', () => {
  beforeEach(() => {
    getEvent.mockResolvedValue({ eventId: EVENT, issuerPk: ORG, metadataURI: null });
  });

  it('says so when the link is incomplete', () => {
    openAt('#organizer=nope', null);
    expect(screen.getByText(/this invite link is incomplete/i)).toBeInTheDocument();
  });

  it('asks to connect a wallet before generating anything', () => {
    openAt(`#organizer=${ORG}&event=${EVENT}`, null);
    expect(screen.getByText(/connect the wallet that should receive the credential/i)).toBeInTheDocument();
  });

  it('generates the code for that organizer and shows the mint link back, with the event in it', async () => {
    const service = {
      getHolderPkHex: jest.fn().mockResolvedValue('11'.repeat(32)),
      getEncryptionKeyPair: jest.fn().mockResolvedValue({ publicKeyHex: '22'.repeat(32) }),
    };
    openAt(`#organizer=${ORG}&event=${EVENT}`, { address: 'ee'.repeat(32), service });

    const link = await screen.findByText(new RegExp(`/app/mint#to=${'11'.repeat(32)}\\.${'22'.repeat(32)}&event=${EVENT}`));
    expect(link).toBeInTheDocument();
    expect(service.getHolderPkHex).toHaveBeenCalledWith(Uint8Array.from(Buffer.from(ORG, 'hex')));
    expect(screen.getByText(/send this to the organizer/i, { selector: 'p' })).toBeInTheDocument();
  });
});
