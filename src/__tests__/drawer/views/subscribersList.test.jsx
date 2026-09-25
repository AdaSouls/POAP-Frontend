import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubscribersList from '../../../jsx/drawer/views/subscribersList';
import { mockDrawerContext, mockUserRoles, renderWithProviders } from '../../../testUtils';

const ORGANIZER = 'bb'.repeat(32);
const EVENT = { eventId: 'aa'.repeat(32), issuerPk: ORGANIZER };
const TOKENS = [
  { tokenId: 1, ownerPk: '11'.repeat(32), isBurned: false, mintedBlock: 10 },
  { tokenId: 2, ownerPk: '22'.repeat(32), isBurned: true, mintedBlock: 11 },
];

function drawerValueFor(address) {
  return {
    ...mockDrawerContext,
    midnight: { ...mockDrawerContext.midnight, provider: address ? { address } : null },
    subscribers: { event: EVENT, tokens: TOKENS, label: 'Recipients', eventName: 'Tributo' },
  };
}

describe('SubscribersList drawer view', () => {
  it('lists each token with its status', () => {
    renderWithProviders(<SubscribersList />, { drawerValue: drawerValueFor(null) });
    expect(screen.getByText(/Recipients \(2\)/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Burned')).toBeInTheDocument();
  });

  it('gives the organizer a Revoke button on live tokens only, opening the confirmation', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<SubscribersList />, { drawerValue: drawerValueFor(ORGANIZER), drawerDispatch: dispatch });

    expect(screen.getAllByRole('button', { name: /revoke poap/i })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: /revoke poap #1/i }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SHOW_BURN_TOKEN',
      payload: { mode: 'revoke', tokenId: 1, eventId: EVENT.eventId, eventName: 'Tributo' },
    });
  });

  it('shows no Revoke button to anyone else', () => {
    renderWithProviders(<SubscribersList />, { drawerValue: drawerValueFor('cc'.repeat(32)) });
    expect(screen.queryByRole('button', { name: /revoke/i })).not.toBeInTheDocument();
  });

  it('lets the admin revoke too', () => {
    renderWithProviders(<SubscribersList />, {
      drawerValue: drawerValueFor('cc'.repeat(32)),
      userRolesValue: { ...mockUserRoles, isAdmin: true },
    });
    expect(screen.getByRole('button', { name: /revoke poap #1/i })).toBeInTheDocument();
  });
});
