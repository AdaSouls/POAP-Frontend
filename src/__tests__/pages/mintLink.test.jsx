import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MintLink from '../../jsx/pages/mintLink';
import { mockDrawerContext, renderWithProviders } from '../../testUtils';
import { getAllEvents, getEvent } from '../../midnight/indexer.service';

jest.mock('../../midnight/indexer.service', () => ({
  getEvent: jest.fn(),
  getAllEvents: jest.fn(),
}));
jest.mock('../../jsx/layout/layout', () => ({ children }) => <div>{children}</div>);

const ORG = 'ab'.repeat(32);
const EVENT_ID = 'cd'.repeat(32);
const CODE = `${'11'.repeat(32)}.${'22'.repeat(32)}`;
const EVENT = { eventId: EVENT_ID, issuerPk: ORG, isPublicMint: false, isActive: true, minted: 2, metadataURI: null };

function openAt(hash, address, dispatch = jest.fn()) {
  window.history.pushState({}, '', `/app/mint${hash}`);
  renderWithProviders(<MintLink />, {
    drawerValue: {
      ...mockDrawerContext,
      midnight: { ...mockDrawerContext.midnight, provider: address ? { address } : null },
    },
    drawerDispatch: dispatch,
  });
  return dispatch;
}

describe('MintLink page', () => {
  beforeEach(() => {
    getEvent.mockResolvedValue(EVENT);
    getAllEvents.mockResolvedValue([EVENT, { ...EVENT, eventId: 'ef'.repeat(32), isPublicMint: true }]);
  });

  it('rejects a link without a valid key', () => {
    openAt('#to=hello', ORG);
    expect(screen.getByText(/doesn't contain a valid key/i)).toBeInTheDocument();
  });

  it("opens Mint POAP for the link's event with the recipient filled in, for its organizer", async () => {
    const dispatch = openAt(`#to=${CODE}&event=${EVENT_ID}`, ORG);
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_MINT', payload: EVENT, recipient: CODE }),
    );
  });

  it("refuses to open it for a wallet that isn't the event's organizer", async () => {
    const dispatch = openAt(`#to=${CODE}&event=${EVENT_ID}`, 'ee'.repeat(32));
    expect(await screen.findByText(/this link is for the organizer of this event/i)).toBeInTheDocument();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("without an event, lists the organizer's own invite-only events to pick from", async () => {
    const dispatch = openAt(`#to=${CODE}`, ORG);
    const buttons = await screen.findAllByRole('button', { name: /mint poap/i });
    expect(buttons).toHaveLength(1);
    await userEvent.click(buttons[0]);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CREATE_MINT', payload: EVENT, recipient: CODE });
  });
});
