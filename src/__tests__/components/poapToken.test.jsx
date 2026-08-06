import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PoapToken from '../../jsx/components/poapToken';

describe('PoapToken Component', () => {
  const poap = {
    issuerPkHex: 'aa'.repeat(32),
    tokenId: 1n,
    attendedEventIds: [],
  };

  it('navigates to /poap-management when the arrow button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/wallet']}>
        <Routes>
          <Route path="/wallet" element={<table><tbody><PoapToken poap={poap} index={0} /></tbody></table>} />
          <Route path="/poap-management" element={<div>My POAPs Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByText(/my poaps page/i)).toBeInTheDocument();
  });
});
