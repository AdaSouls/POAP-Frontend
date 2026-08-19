import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MintPoap from '../../../jsx/drawer/views/mintPoap';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { uploadImageToIPFS, uploadJSONToIPFS } from '../../../services/ipfs.service';

jest.mock('../../../services/ipfs.service', () => ({
  uploadImageToIPFS: jest.fn(),
  uploadJSONToIPFS: jest.fn(),
}));

function makeFile(name) {
  return new File([new Uint8Array(1024)], name, { type: 'image/png' });
}

const mintEvent = {
  eventId: 'aa'.repeat(32),
  issuerPk: 'bb'.repeat(32),
  minted: 3,
  maxSupply: 100,
  metadataURI: null,
};

const buildDrawerValue = (mintTo) => ({
  ...mockDrawerContext,
  mintEvent,
  midnight: {
    ...mockDrawerContext.midnight,
    provider: { wallet: 'Lace', service: { mintTo } },
  },
});

const clickNext = () => userEvent.click(screen.getByRole('button', { name: /^next$/i }));
const clickBack = () => userEvent.click(screen.getByRole('button', { name: /^back$/i }));
const clickMint = () => userEvent.click(screen.getByRole('button', { name: /mint poap/i }));

const validRecipientPkHex = 'cc'.repeat(32);

async function goToDocumentStep() {
  await userEvent.type(screen.getByLabelText(/Recipient's Key/i), validRecipientPkHex);
  await clickNext();
}

async function goToIconStep() {
  await goToDocumentStep();
  await userEvent.upload(screen.getByLabelText(/Credential Image/i), makeFile('diploma.png'));
  await clickNext();
}

describe('MintPoap drawer view', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-preview');
    global.URL.revokeObjectURL = jest.fn();
    uploadImageToIPFS.mockResolvedValue('ipfs://Qmimage');
    uploadJSONToIPFS.mockResolvedValue('ipfs://Qmtoken');
  });

  it('shows a fallback message when no event is selected', () => {
    renderWithProviders(<MintPoap />);
    expect(screen.getByText(/no event selected/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Recipient's Key/i)).not.toBeInTheDocument();
  });

  it('starts on the recipient step, with 3 step dots and no Back button', () => {
    const { container } = renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(jest.fn()) });

    expect(screen.getByLabelText(/Recipient's Key/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.step-dot')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /^back$/i })).not.toBeInTheDocument();
  });

  it('keeps Next disabled on the recipient step until a valid 64-char hex key is entered', async () => {
    renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(jest.fn()) });

    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/Recipient's Key/i), 'not-hex');
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/Recipient's Key/i));
    await userEvent.type(screen.getByLabelText(/Recipient's Key/i), validRecipientPkHex);
    expect(screen.getByRole('button', { name: /^next$/i })).toBeEnabled();
  });

  it('keeps Next disabled on the credential-image step until an image is chosen', async () => {
    renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(jest.fn()) });

    await goToDocumentStep();
    expect(screen.getByLabelText(/Credential Image/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();

    await userEvent.upload(screen.getByLabelText(/Credential Image/i), makeFile('diploma.png'));
    expect(screen.getByRole('button', { name: /^next$/i })).toBeEnabled();
  });

  it('Back from the credential-image step returns to the recipient step, key preserved', async () => {
    renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(jest.fn()) });

    await goToDocumentStep();
    await clickBack();

    expect(screen.getByLabelText(/Recipient's Key/i)).toHaveValue(validRecipientPkHex);
  });

  it('reaches the icon step (optional) with a Mint POAP submit button', async () => {
    renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(jest.fn()) });

    await goToIconStep();

    expect(screen.getByLabelText(/Icon/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mint poap/i })).toBeEnabled();
  });

  it('mints with only the required credential image (no icon): uploads the document, builds tokenMetadataURI, calls mintTo', async () => {
    const mintTo = jest.fn().mockResolvedValue({ txHash: '0xabc' });
    renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(mintTo) });

    await goToIconStep();
    await clickMint();

    await waitFor(() => expect(mintTo).toHaveBeenCalled());
    expect(uploadImageToIPFS).toHaveBeenCalledTimes(1); // document image only, no icon uploaded
    expect(uploadJSONToIPFS).toHaveBeenCalledWith(expect.objectContaining({ documentImage: 'ipfs://Qmimage' }));
    expect(uploadJSONToIPFS).toHaveBeenCalledWith(expect.not.objectContaining({ image: expect.anything() }));
    expect(mintTo).toHaveBeenCalledWith(
      Uint8Array.from(Buffer.from(mintEvent.eventId, 'hex')),
      Uint8Array.from(Buffer.from(validRecipientPkHex, 'hex')),
      'ipfs://Qmtoken',
    );
  });

  it('mints with both an icon and a credential image: both get uploaded, both land in tokenMetadataURI', async () => {
    const mintTo = jest.fn().mockResolvedValue({ txHash: '0xabc' });
    renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(mintTo) });

    await goToIconStep();
    await userEvent.upload(screen.getByLabelText(/Icon/i), makeFile('icon.png'));
    await clickMint();

    await waitFor(() => expect(mintTo).toHaveBeenCalled());
    expect(uploadImageToIPFS).toHaveBeenCalledTimes(2); // icon + document
    expect(uploadJSONToIPFS).toHaveBeenCalledWith(
      expect.objectContaining({ image: 'ipfs://Qmimage', documentImage: 'ipfs://Qmimage' }),
    );
  });

  it('dispatches CLOSE_DRAWER when the close button is clicked', async () => {
    const dispatch = jest.fn();
    renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(jest.fn()), drawerDispatch: dispatch });

    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(dispatch).toHaveBeenCalledWith({ type: 'CLOSE_DRAWER' });
  });

  it('uploads the credential image exactly as picked, with no crop applied', async () => {
    const mintTo = jest.fn().mockResolvedValue({ txHash: '0xabc' });
    renderWithProviders(<MintPoap />, { drawerValue: buildDrawerValue(mintTo) });
    const documentFile = makeFile('diploma.png');

    await userEvent.type(screen.getByLabelText(/Recipient's Key/i), validRecipientPkHex);
    await clickNext();
    await userEvent.upload(screen.getByLabelText(/Credential Image/i), documentFile);
    await clickNext();
    await clickMint();

    await waitFor(() => expect(mintTo).toHaveBeenCalled());
    expect(uploadImageToIPFS).toHaveBeenCalledWith(documentFile);
  });

  describe('organizer name', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("shows the organizer's display name in the preview card when the event's metadata has one", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'Diplomas 2026', organization: { name: 'AdaSouls Inc.' } }),
      });
      const eventWithMetadata = { ...mintEvent, metadataURI: 'https://example.com/meta-org.json' };
      const { container } = renderWithProviders(<MintPoap />, { drawerValue: { ...buildDrawerValue(jest.fn()), mintEvent: eventWithMetadata } });

      // Scoped to this render's own container — a prior test's success toast (sweetalert2, which
      // mounts outside React's tree and isn't cleaned up by RTL) can otherwise still be sitting in
      // document.body when this query runs against the unscoped `screen`.
      expect(await within(container).findByText('AdaSouls Inc.')).toBeInTheDocument();
    });

    it("mirrors the event's organization into the minted token's own metadata", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ name: 'Diplomas 2026', organization: { name: 'AdaSouls Inc.' } }),
      });
      const eventWithMetadata = { ...mintEvent, metadataURI: 'https://example.com/meta-org-mirror.json' };
      const mintTo = jest.fn().mockResolvedValue({ txHash: '0xabc' });
      const { container } = renderWithProviders(<MintPoap />, { drawerValue: { ...buildDrawerValue(mintTo), mintEvent: eventWithMetadata } });

      await within(container).findByText('AdaSouls Inc.');
      await goToIconStep();
      await clickMint();

      await waitFor(() => expect(mintTo).toHaveBeenCalled());
      expect(uploadJSONToIPFS).toHaveBeenCalledWith(
        expect.objectContaining({ organization: { name: 'AdaSouls Inc.' } }),
      );
    });
  });
});
