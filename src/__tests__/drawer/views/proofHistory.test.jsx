import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProofHistory from '../../../jsx/drawer/views/proofHistory';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';

const record = (overrides) => ({
  kind: 'proveTokenOwnership',
  question: 'Do you hold this POAP?',
  provenAt: '2026-09-25T10:00:00.000Z',
  txHash: 'ab'.repeat(32),
  ...overrides,
});

describe('ProofHistory popup', () => {
  it('lists each proof with its Verify link, and the subscription validity it gave', () => {
    const drawerValue = {
      ...mockDrawerContext,
      proofHistoryContext: {
        records: [record(), record({ kind: 'proveCredentialAttribute', question: 'Sector is Campo', txHash: null })],
        eventName: 'Club Pass',
        validity: { amount: 1, unit: 'years' },
        isSubscription: true,
      },
    };
    renderWithProviders(<ProofHistory />, { drawerValue });

    expect(screen.getByText('Club Pass')).toBeInTheDocument();
    expect(screen.getByText('Do you hold this POAP?')).toBeInTheDocument();
    expect(screen.getByText('Sector is Campo')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /verify/i })).toHaveLength(1);
    expect(screen.getByText(/valid until/i)).toBeInTheDocument();
  });

  it('closes on the close button', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<ProofHistory />, {
      drawerValue: { ...mockDrawerContext, proofHistoryContext: { records: [] } },
      drawerDispatch: dispatch,
    });
    expect(screen.getByText(/no proofs made/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
  });
});
