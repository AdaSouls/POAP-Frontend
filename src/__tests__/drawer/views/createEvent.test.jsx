import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateEvent from '../../../jsx/drawer/views/createEvent';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { uploadJSONToIPFS } from '../../../services/ipfs.service';
import { computeAttributeLeaf, computeEventId } from '../../../midnight/contract.service';
import { buildMerkleTree } from '../../../midnight/merkle';
import { savePrivateAttributeDraft } from '../../../midnight/private-attribute-drafts';

jest.mock('../../../services/ipfs.service', () => ({
  uploadImageToIPFS: jest.fn(),
  uploadJSONToIPFS: jest.fn(),
  uploadPrivateJSONToIPFS: jest.fn(),
}));
jest.mock('../../../midnight/contract.service', () => ({
  computePrivateMetadataCommit: jest.fn(),
  computeEventId: jest.fn(() => new Uint8Array(32).fill(1)),
  computeAttributeLeaf: jest.fn((eventId, fieldId) => fieldId),
}));
jest.mock('../../../midnight/private-event-metadata', () => ({
  savePrivateEventDraft: jest.fn(),
}));
// merkle.ts pulls in @midnight-ntwrk/compact-runtime, a WASM-bindgen build Jest can't load (see
// src/__tests__/midnight/merkle.test.ts's header comment) — mocked here purely so importing
// createEvent.jsx doesn't transitively try to load it, same reasoning as every other service mock
// in this file.
jest.mock('../../../midnight/merkle', () => ({
  buildMerkleTree: jest.fn(),
}));
jest.mock('../../../midnight/private-attribute-drafts', () => ({
  savePrivateAttributeDraft: jest.fn(),
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
async function fillThroughToSubmit({ categoryLabel, name, maxSupply, configureBeforeLastNext }) {
  await userEvent.click(screen.getByText(categoryLabel));
  await clickNext(); // step 0 -> details
  // Label text is category-specific ("Event Name"/"Subscription Name"/"Credential Name" — see
  // eventCategories.js's detailsFields), so match on the common "Name" suffix rather than one
  // category's exact wording.
  await userEvent.type(screen.getByLabelText(/Name/i), name);
  await clickNext(); // details -> image
  await clickNext(); // image -> supply (no image picked, nothing to crop)
  await userEvent.clear(screen.getByLabelText(/Maximum Supply/i));
  await userEvent.type(screen.getByLabelText(/Maximum Supply/i), maxSupply);
  let pendingConfigure = configureBeforeLastNext;
  while (screen.queryByRole('button', { name: /^next$/i })) {
    // Runs once, on the private-attributes step, right before clicking past it — lets callers fill
    // in an attribute row without hardcoding this wizard's exact step count/order.
    if (pendingConfigure && screen.queryByRole('button', { name: /add private attribute/i })) {
      await pendingConfigure();
      pendingConfigure = null;
    }
    await clickNext();
  }
  await clickCreate(); // submit
}

describe('CreateEvent drawer view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadJSONToIPFS.mockResolvedValue('ipfs://Qmmetadata');
    // Re-applied every test — this project's jest config resets mock implementations (not just
    // call history) between tests despite only calling jest.clearAllMocks(), so the jest.mock()
    // factory's inline implementations above don't survive past the first test either.
    computeEventId.mockImplementation(() => new Uint8Array(32).fill(1));
    computeAttributeLeaf.mockImplementation((eventId, fieldId) => fieldId);
    buildMerkleTree.mockResolvedValue({
      rootBytes: new Uint8Array(32).fill(9),
      leafCount: 0,
      pathForIndex: jest.fn(),
      pathForLeaf: jest.fn(),
    });
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
    expect(screen.queryByText(/^Public Mint$/i)).not.toBeInTheDocument();
  });

  it('shows the fixed mint type as a badge on each category card at Step 0', () => {
    renderWithProviders(<CreateEvent />);

    const eventCard = screen.getByText('Event').closest('[role="button"]');
    const subscriptionCard = screen.getByText('Subscription').closest('[role="button"]');
    const credentialCard = screen.getByText('Credential').closest('[role="button"]');

    expect(within(eventCard).getByText('Public Mint')).toBeInTheDocument();
    expect(within(subscriptionCard).getByText('Public Mint')).toBeInTheDocument();
    expect(within(credentialCard).getByText('Invite-Only Mint')).toBeInTheDocument();
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
    await clickNext(); // extra info -> private attributes
    await clickNext(); // private attributes -> POAP image
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

  it('commits a private attribute: builds the Merkle root, passes it to createEvent, saves the draft, and lists it in the metadata JSON', async () => {
    const createEvent = jest.fn().mockResolvedValue({ txHash: '0xabc' });
    const mockedRoot = new Uint8Array(32).fill(7);
    buildMerkleTree.mockResolvedValue({
      rootBytes: mockedRoot,
      leafCount: 1,
      pathForIndex: jest.fn(),
      pathForLeaf: jest.fn(),
    });
    renderWithProviders(<CreateEvent />, { drawerValue: buildDrawerValue(createEvent) });

    await fillThroughToSubmit({
      categoryLabel: 'Subscription',
      name: 'DevCon Pass',
      maxSupply: '0',
      configureBeforeLastNext: async () => {
        await userEvent.click(screen.getByRole('button', { name: /add private attribute/i }));
        await userEvent.type(screen.getByLabelText('Attribute label'), 'Region');
        await userEvent.type(screen.getByLabelText('Attribute value'), 'EU');
      },
    });

    await waitFor(() => expect(createEvent).toHaveBeenCalled());
    expect(computeAttributeLeaf).toHaveBeenCalledTimes(1);
    expect(buildMerkleTree).toHaveBeenCalledWith([expect.any(Uint8Array)], 8);

    const call = createEvent.mock.calls[0];
    expect(call[6]).toEqual(mockedRoot); // privateAttributesRoot is the 7th positional arg

    // savePrivateAttributeDraft runs in the code path AFTER `await provider.service.createEvent(...)`
    // resolves — createEvent having been *called* (waited for above) doesn't guarantee that
    // continuation has run yet, so this needs its own waitFor rather than a synchronous assertion.
    await waitFor(() => expect(savePrivateAttributeDraft).toHaveBeenCalledTimes(1));
    const [eventIdHexArg, fieldIdHexArg, draftArg] = savePrivateAttributeDraft.mock.calls[0];
    expect(eventIdHexArg).toBe(Buffer.from(new Uint8Array(32).fill(1)).toString('hex'));
    expect(typeof fieldIdHexArg).toBe('string');
    expect(draftArg).toEqual(
      expect.objectContaining({ fieldName: 'Region', valueHex: expect.any(String), randHex: expect.any(String) }),
    );

    expect(uploadJSONToIPFS).toHaveBeenCalledWith(
      expect.objectContaining({
        privateAttributeFields: [{ fieldId: fieldIdHexArg, label: 'Region' }],
      }),
    );
  });

  it('leaves privateAttributesRoot at the all-zero default when no attribute rows are filled in', async () => {
    const createEvent = jest.fn().mockResolvedValue({ txHash: '0xabc' });
    renderWithProviders(<CreateEvent />, { drawerValue: buildDrawerValue(createEvent) });

    await fillThroughToSubmit({ categoryLabel: 'Subscription', name: 'DevCon Pass', maxSupply: '0' });

    await waitFor(() => expect(createEvent).toHaveBeenCalled());
    expect(buildMerkleTree).not.toHaveBeenCalled();
    expect(savePrivateAttributeDraft).not.toHaveBeenCalled();
    const call = createEvent.mock.calls[0];
    expect(call[6]).toEqual(new Uint8Array(32));
    expect(uploadJSONToIPFS).toHaveBeenCalledWith(
      expect.not.objectContaining({ privateAttributeFields: expect.anything() }),
    );
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
    await userEvent.type(screen.getByLabelText(/Credential Name/i), 'Diplomas 2026');
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
