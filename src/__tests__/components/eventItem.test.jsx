import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EventItem from '../../jsx/components/eventItem';
import { MockDrawerProvider, mockDrawerContext } from '../../testUtils';

describe('EventItem Component', () => {
  const event = {
    eventId: 'aa'.repeat(32),
    issuerPk: 'bb'.repeat(32),
    maxSupply: 100,
    minted: 1,
    expiration: 0,
  };

  it('navigates to /my-events when the arrow button is clicked', async () => {
    render(
      <MockDrawerProvider value={mockDrawerContext}>
        <MemoryRouter initialEntries={['/legacy-events-table']}>
          <Routes>
            <Route
              path="/legacy-events-table"
              element={<table><tbody><EventItem event={event} index={0} mintable owned={false} /></tbody></table>}
            />
            <Route path="/app/my-events" element={<div>My Events Page</div>} />
          </Routes>
        </MemoryRouter>
      </MockDrawerProvider>
    );

    await userEvent.click(screen.getByRole('button'));

    expect(screen.getByText(/my events page/i)).toBeInTheDocument();
  });
});
