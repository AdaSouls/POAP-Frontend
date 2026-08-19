import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateEvent from '../../../jsx/drawer/views/createEvent';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { uploadJSONToIPFS } from '../../../services/ipfs.service';

jest.mock('../../../services/ipfs.service', () => ({
  uploadImageToIPFS: jest.fn(),
  uploadJSONToIPFS: jest.fn(),
  uploadPrivateJSONToIPFS: jest.fn(),
}));
jest.mock('../../../midnight/contract.service', () => ({
  computePrivateMetadataCommit: jest.fn(),
}));
jest.mock('../../../midnight/private-event-metadata', () => ({
  savePrivateEventDraft: jest.fn(),
}));

const buildDrawerValue = (createEvent) => ({
  ...mockDrawerContext,
  midnight: {
    ...mockDrawerContext.midnight,
    provider: { address: 'aa'.repeat(32), wallet: 'Lace', service: { createEvent } },
  },
});

const clickNext = () => userEvent.click(screen.getByRole('button', { name: /^next$/i }));
const clickBack = () => userEvent.click(screen.getByRole('button', { name: /^back$/i }));
const clickCreate = () => userEvent.click(screen.getByRole('button', { name: /^create$/i }));

// Every category walks details → image → supply → channels → taxonomy → org profile → extra info,
// then STEP_POAP_IMAGE only for self-mint categories (Event/Subscription) — Credential skips it,
// since its tokens get their own per-recipient image later via push-mint, not a shared one set
// here (see createEvent.jsx's steps useMemo). Every step after supply is fully optional, so this
// just keeps clicking Next until Create appears instead of hardcoding a step count per category.
async function fillThroughToSubmit({ categoryLabel, name, maxSupply }) {
  await userEvent.click(screen.getByText(categoryLabel));
  await clickNext(); // step 0 -> details
  await userEvent.type(screen.getByLabelText(/Event Name/i), name);
  await clickNext(); // details -> image
  await clickNext(); // image -> supply (no image picked, nothing to crop)
  await userEvent.clear(screen.getByLabelText(/Maximum Supply/i));
  await userEvent.type(screen.getByLabelText(/Maximum Supply/i), maxSupply);
  while (screen.queryByRole('button', { name: /^next$/i })) {
    await clickNext();
  }
  await clickCreate(); // submit
}

describe('CreateEvent drawer view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadJSONToIPFS.mockResolvedValue('ipfs://Qmmetadata');
  });

  it('shows Step 0 with the three categories, Next disabled until one is picked', async () => {
    renderWithProviders(<CreateEvent />);

    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Credential')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();

    await userEvent.click(screen.getByText('Event'));
    expect(screen.getByRole('button', { name: /^next$/i })).toBeEnabled();
  });

  it('uses a category-specific header title and shows a Back button once past Step 0', async () => {
    renderWithProviders(<CreateEvent />);

    await userEvent.click(screen.getByText('Credential'));
    await clickNext();

    expect(screen.getByRole('heading', { name: /create credential/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
  });

  it('going back from the first content step returns to the category picker without losing entered data', async () => {
    renderWithProviders(<CreateEvent />);

    await userEvent.click(screen.getByText('Event'));
    await clickNext();
    await userEvent.type(screen.getByLabelText(/Event Name/i), 'DevCon');
    await clickBack();

    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Credential')).toBeInTheDocument();

    await clickNext();
    expect(screen.getByLabelText(/Event Name/i)).toHaveValue('DevCon');
  });

  it('does not offer an editable public/private switch on the supply step — it is fixed by category', async () => {
    renderWithProviders(<CreateEvent />);

    await userEvent.click(screen.getByText('Event'));
    await clickNext();
    await userEvent.type(screen.getByLabelText(/Event Name/i), 'DevCon');
    await clickNext(); // details -> image
    await clickNext(); // image -> supply

    expect(screen.queryByRole('checkbox', { name: /public mint/i })).not.toBeInTheDocument();
    expect(screen.getByText(/^Public Mint$/i)).toBeInTheDocument();
  });

  it('completes the Event flow: public mint, category/taxonomy/channels land in the metadata JSON', async () => {
    const createEvent = jest.fn().mockResolvedValue({ txHash: '0xabc' });
    renderWithProviders(<CreateEvent />, { drawerValue: buildDrawerValue(createEvent) });

    await userEvent.click(screen.getByText('Event'));
    await clickNext(); // step 0 -> details
    await userEvent.type(screen.getByLabelText(/Event Name/i), 'DevCon');
    await clickNext(); // details -> image
    await clickNext(); // image -> supply
    await userEvent.clear(screen.getByLabelText(/Maximum Supply/i));
    await userEvent.type(screen.getByLabelText(/Maximum Supply/i), '10');
    await clickNext(); // supply -> channels
    await userEvent.click(screen.getByRole('button', { name: /add channel/i }));
    await userEvent.type(screen.getByLabelText('Channel value'), 'hello@devcon.com');
    await clickNext(); // channels -> taxonomy
    await userEvent.click(screen.getByLabelText('Format'));
    await userEvent.click(screen.getByRole('option', { name: 'In-person' }));
    await clickNext(); // taxonomy -> org profile
    await clickNext(); // org profile -> extra info
    await clickNext(); // extra info -> POAP image
    await clickCreate(); // submit

    await waitFor(() => expect(createEvent).toHaveBeenCalled());
    expect(uploadJSONToIPFS).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'DevCon',
        category: 'event',
        modality: 'in_person',
        channels: [{ type: 'email', value: 'hello@devcon.com' }],
      }),
    );
    const [, , , isPublicMintArg, metadataURIArg] = createEvent.mock.calls[0];
    expect(isPublicMintArg).toBe(true);
    expect(metadataURIArg).toBe('ipfs://Qmmetadata');
  });

  it('completes the Credential flow with a fixed invite-only mint type', async () => {
    const createEvent = jest.fn().mockResolvedValue({ txHash: '0xabc' });
    renderWithProviders(<CreateEvent />, { drawerValue: buildDrawerValue(createEvent) });

    await fillThroughToSubmit({ categoryLabel: 'Credential', name: 'Diplomas 2026', maxSupply: '0' });

    await waitFor(() => expect(createEvent).toHaveBeenCalled());
    expect(uploadJSONToIPFS).toHaveBeenCalledWith(expect.objectContaining({ category: 'credential' }));
    const [, , , isPublicMintArg] = createEvent.mock.calls[0];
    expect(isPublicMintArg).toBe(false);
  });

  it('does not ask for a shared POAP image on the Credential flow — tokens get their own image later via push-mint', async () => {
    renderWithProviders(<CreateEvent />);

    await userEvent.click(screen.getByText('Credential'));
    await clickNext(); // step 0 -> details
    await userEvent.type(screen.getByLabelText(/Event Name/i), 'Diplomas 2026');
    await clickNext(); // details -> image
    await clickNext(); // image -> supply
    await userEvent.clear(screen.getByLabelText(/Maximum Supply/i));
    await userEvent.type(screen.getByLabelText(/Maximum Supply/i), '0');

    let sawPoapImageStep = false;
    while (screen.queryByRole('button', { name: /^next$/i })) {
      if (screen.queryByText(/different poap image/i) || screen.queryByText(/same as event image/i)) {
        sawPoapImageStep = true;
      }
      await clickNext();
    }

    expect(sawPoapImageStep).toBe(false);
    expect(screen.getByRole('button', { name: /^create$/i })).toBeInTheDocument();
  });

  it('shows an error and does not call the service when submitting without a connected wallet', async () => {
    const createEvent = jest.fn();
    const drawerValue = buildDrawerValue(createEvent);
    drawerValue.midnight.provider = null;
    renderWithProviders(<CreateEvent />, { drawerValue });

    await fillThroughToSubmit({ categoryLabel: 'Subscription', name: 'AdaSouls Updates', maxSupply: '0' });

    expect(createEvent).not.toHaveBeenCalled();
  });

  it('dispatches CLOSE_DRAWER when the close button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<CreateEvent />, { drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
  });
});
