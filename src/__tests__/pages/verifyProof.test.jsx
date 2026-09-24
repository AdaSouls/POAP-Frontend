import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifyProof from '../../jsx/pages/verifyProof';

// The page is public (no wallet) — only the layout chrome needs stubbing.
jest.mock('../../jsx/layout/layout', () => ({ children }) => <div>{children}</div>);

const CONTRACT = 'c0'.repeat(32);
const TX = 'ab'.repeat(32);

function graphqlReturns(transactions) {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { transactions } }) });
}

function renderAt(tx) {
  return render(
    <MemoryRouter initialEntries={[`/app/verify?tx=${tx}`]}>
      <VerifyProof />
    </MemoryRouter>,
  );
}

describe('VerifyProof page', () => {
  const originalAddress = process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS;
  beforeAll(() => {
    process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS = CONTRACT;
  });
  afterAll(() => {
    process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS = originalAddress;
  });

  it('confirms a proof transaction on the POAP contract', async () => {
    graphqlReturns([
      {
        hash: TX,
        block: { height: 1300, timestamp: 1790256564002 },
        contractActions: [{ __typename: 'ContractCall', address: CONTRACT, entryPoint: 'proveEventAttendance' }],
      },
    ]);
    renderAt(TX);
    expect(await screen.findByText(/valid: anonymous proof of attendance/i)).toBeInTheDocument();
    expect(screen.getByText('1300')).toBeInTheDocument();
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.variables).toEqual({ hash: TX });
  });

  it('flags a transaction that is not a proof', async () => {
    graphqlReturns([
      { hash: TX, block: { height: 5, timestamp: null }, contractActions: [{ __typename: 'ContractCall', address: CONTRACT, entryPoint: 'createEvent' }] },
    ]);
    renderAt(TX);
    expect(await screen.findByText(/not a proof/i)).toBeInTheDocument();
  });

  it('flags a transaction on another contract', async () => {
    graphqlReturns([
      { hash: TX, block: { height: 5, timestamp: null }, contractActions: [{ __typename: 'ContractCall', address: 'ff'.repeat(32), entryPoint: 'proveEventAttendance' }] },
    ]);
    renderAt(TX);
    expect(await screen.findByText(/not an adasouls poap transaction/i)).toBeInTheDocument();
  });

  it('says when the transaction does not exist', async () => {
    graphqlReturns([]);
    renderAt(TX);
    expect(await screen.findByText(/no transaction with this hash exists/i)).toBeInTheDocument();
  });
});
