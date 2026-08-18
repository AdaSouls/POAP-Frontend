import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';
import SharedCollection from '../../jsx/pages/sharedCollection';
import { getTokensByOwner } from '../../midnight/indexer.service';
import { encodeShareableCollection } from '../../midnight/collection-share';

jest.mock('../../midnight/indexer.service');

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/share/:pkHex" element={<SharedCollection />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SharedCollection', () => {
  const holderPkHex = 'ff'.repeat(32);
  const issuerPkHex = 'bb'.repeat(32);
  const eventIdA = 'aa'.repeat(32);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows only the verified section when no ?d= param is present', async () => {
    getTokensByOwner.mockResolvedValue([
      { tokenId: 1, ownerPk: holderPkHex, issuerPk: issuerPkHex, firstEventId: eventIdA, isBurned: false },
    ]);

    renderAt(`/share/${holderPkHex}`);

    await waitFor(() => {
      expect(screen.getByText(/POAP #1/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/declared/i)).not.toBeInTheDocument();
  });

  it('shows a graceful message when the indexer is unreachable', async () => {
    getTokensByOwner.mockRejectedValue(new Error('network error'));

    renderAt(`/share/${holderPkHex}`);

    await waitFor(() => {
      expect(screen.getByText(/could not reach the indexer/i)).toBeInTheDocument();
    });
  });

  it('shows declared events alongside verified ones, with a disclaimer, when the pair exists on-chain', async () => {
    getTokensByOwner.mockResolvedValue([
      { tokenId: 1, ownerPk: holderPkHex, issuerPk: issuerPkHex, firstEventId: eventIdA, isBurned: false },
    ]);
    const encoded = encodeShareableCollection([{ issuerPkHex, tokenId: 1n }]);

    renderAt(`/share/${holderPkHex}?d=${encoded}`);

    await waitFor(() => {
      expect(screen.getByText(/not itself verifiable/i)).toBeInTheDocument();
    });
  });

  it('drops declared entries whose issuer/token pair is not actually on-chain', async () => {
    getTokensByOwner.mockResolvedValue([]); // nothing verified for this pk
    const encoded = encodeShareableCollection([{ issuerPkHex, tokenId: 999n }]);

    renderAt(`/share/${holderPkHex}?d=${encoded}`);

    await waitFor(() => {
      expect(screen.getByText(/no tokens found on-chain/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/POAP #999/i)).not.toBeInTheDocument();
  });

  it('handles a malformed ?d= param without crashing', async () => {
    getTokensByOwner.mockResolvedValue([]);

    renderAt(`/share/${holderPkHex}?d=not-valid-base64!!`);

    await waitFor(() => {
      expect(screen.getByText(/no tokens found on-chain/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/declared/i)).not.toBeInTheDocument();
  });
});
