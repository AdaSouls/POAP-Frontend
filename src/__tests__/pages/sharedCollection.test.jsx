import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SharedCollection from '../../jsx/pages/sharedCollection';
import { encodeShareableCollection } from '../../midnight/collection-share';

// Public page (no wallet) — only the layout chrome needs stubbing; lookups hit the network.
jest.mock('../../jsx/layout/layout', () => ({ children }) => <div>{children}</div>);
jest.mock('../../midnight/indexer.service', () => ({ getEvent: jest.fn(), getToken: jest.fn() }));
jest.mock('../../jsx/hooks/useEventMetadata', () => ({ fetchMetadata: jest.fn() }));
jest.mock('../../midnight/proof-verification', () => ({ blockTimestamp: jest.fn() }));

const { getEvent, getToken } = jest.requireMock('../../midnight/indexer.service');
const { fetchMetadata } = jest.requireMock('../../jsx/hooks/useEventMetadata');
const { blockTimestamp } = jest.requireMock('../../midnight/proof-verification');

const ISSUER = 'bb'.repeat(32);
const EVENT = 'aa'.repeat(32);
const DAY = 24 * 60 * 60 * 1000;

function token(overrides = {}) {
  return {
    tokenId: 1,
    ownerPk: 'cc'.repeat(32),
    issuerPk: ISSUER,
    firstEventId: EVENT,
    isBurned: false,
    mintedBlock: 10,
    mintedTx: 'dd'.repeat(32),
    tokenMetadataURI: 'ipfs://event',
    metadataURI: 'ipfs://event',
    ...overrides,
  };
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/share" element={<SharedCollection />} />
        <Route path="/app/share/:pkHex" element={<SharedCollection />} />
      </Routes>
    </MemoryRouter>,
  );
}

const linkFor = (entries) => `/app/share?d=${encodeShareableCollection(entries)}`;

describe('SharedCollection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEvent.mockResolvedValue({ eventId: EVENT, metadataURI: 'ipfs://event' });
    fetchMetadata.mockResolvedValue({ name: 'Midnight Summit', organization: { name: 'Velum Labs' } });
    blockTimestamp.mockResolvedValue(Date.now() - DAY);
  });

  it('shows each shared POAP with its event name and a Valid status', async () => {
    getToken.mockResolvedValue(token());

    renderAt(linkFor([{ issuerPkHex: ISSUER, tokenId: 1n }]));

    expect(await screen.findByText('Midnight Summit')).toBeInTheDocument();
    expect(screen.getByText(/by Velum Labs/)).toBeInTheDocument();
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText(/doesn't prove they own them/i)).toBeInTheDocument();
  });

  it('marks a revoked POAP as Revoked', async () => {
    getToken.mockResolvedValue(token({ isBurned: true }));

    renderAt(linkFor([{ issuerPkHex: ISSUER, tokenId: 1n }]));

    expect(await screen.findByText('Revoked')).toBeInTheDocument();
  });

  it('marks a POAP past its validity as Expired', async () => {
    getToken.mockResolvedValue(token());
    fetchMetadata.mockResolvedValue({ name: 'Midnight Summit', category: 'event', validity: { amount: 1, unit: 'days' } });
    blockTimestamp.mockResolvedValue(Date.now() - 3 * DAY);

    renderAt(linkFor([{ issuerPkHex: ISSUER, tokenId: 1n }]));

    expect(await screen.findByText('Expired')).toBeInTheDocument();
  });

  it('flags a token that does not exist, or whose issuer does not match the link, as Not found', async () => {
    getToken.mockImplementation(async (id) => {
      if (String(id) === '1') return token({ issuerPk: 'ee'.repeat(32) });
      throw new Error('404');
    });

    renderAt(linkFor([{ issuerPkHex: ISSUER, tokenId: 1n }, { issuerPkHex: ISSUER, tokenId: 999n }]));

    await waitFor(() => expect(screen.getAllByText('Not found')).toHaveLength(2));
    expect(screen.queryByText('Midnight Summit')).not.toBeInTheDocument();
  });

  it('still works for older links that carried the wallet address in the path', async () => {
    getToken.mockResolvedValue(token());

    renderAt(`/app/share/${'ff'.repeat(32)}?d=${encodeShareableCollection([{ issuerPkHex: ISSUER, tokenId: 1n }])}`);

    expect(await screen.findByText('Midnight Summit')).toBeInTheDocument();
  });

  it('explains a link with no collection instead of crashing', () => {
    renderAt('/app/share?d=not-valid-base64!!');

    expect(screen.getByText(/doesn't contain a collection/i)).toBeInTheDocument();
    expect(getToken).not.toHaveBeenCalled();
  });
});
