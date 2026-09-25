import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MintPoap from '../../../jsx/drawer/views/mintPoap';
import { mockDrawerContext, renderWithProviders } from '../../../testUtils';
import { buildCredentialAttributes } from '../../../midnight/credential-delivery';
import { uploadImageToIPFS, uploadJSONToIPFS } from '../../../services/ipfs.service';

jest.mock('../../../midnight/credential-delivery', () => ({
  buildCredentialAttributes: jest.fn(),
  deliverCredentialPackage: jest.fn(),
  packageToLinkFragment: jest.fn(() => 'fragment'),
}));
jest.mock('../../../services/ipfs.service', () => ({ uploadImageToIPFS: jest.fn(), uploadJSONToIPFS: jest.fn() }));

const FIELDS = [
  { fieldId: 'a1'.repeat(32), label: 'Sector', type: 'list', options: ['Campo', 'Platea', 'VIP'] },
  { fieldId: 'a2'.repeat(32), label: 'Asiento', type: 'number', min: 1, max: 100 },
  { fieldId: 'a3'.repeat(32), label: 'Titular', type: 'text' },
  { fieldId: 'a4'.repeat(32), label: 'Nacimiento', type: 'date' },
  { fieldId: 'a5'.repeat(32), label: 'Valid until', type: 'date', auto: 'validUntil' },
];

// Regression (2026-09-25): a birth date showed up as the holder's "Valid until". The form itself
// keeps each date on its own field — this pins that down.
it('keeps a birth date and the automatic Valid until on their own fields', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ name: 'Soda', validity: { amount: 1, unit: 'years' }, credentialAttributeFields: FIELDS }),
  });
  global.URL.createObjectURL = jest.fn(() => 'blob:x');
  global.URL.revokeObjectURL = jest.fn();
  buildCredentialAttributes.mockResolvedValue({ fields: [], root: new Uint8Array(32) });
  uploadImageToIPFS.mockResolvedValue('ipfs://img');
  uploadJSONToIPFS.mockResolvedValue('ipfs://meta');
  const mintTo = jest.fn().mockResolvedValue({ public: { txHash: '0x1' } });
  const view = renderWithProviders(<MintPoap />, {
    drawerValue: {
      ...mockDrawerContext,
      mintEvent: { eventId: 'bb'.repeat(32), issuerPk: 'cc'.repeat(32), minted: 0, maxSupply: 0, metadataURI: 'https://x/repro.json' },
      midnight: { ...mockDrawerContext.midnight, provider: { wallet: 'Lace', service: { mintTo } } },
    },
  });
  await waitFor(() => expect(view.container.querySelectorAll('.step-dot')).toHaveLength(4));
  await userEvent.type(screen.getByLabelText(/Recipient's Key/i), 'dd'.repeat(32));
  await userEvent.click(screen.getByRole('button', { name: /^next$/i }));

  await userEvent.selectOptions(screen.getByLabelText('Sector'), 'Campo');
  await userEvent.type(screen.getByLabelText(/^Asiento/), '12');
  await userEvent.type(screen.getByLabelText('Titular'), 'Juan Perez');
  await userEvent.type(screen.getByLabelText('Nacimiento'), '2000-05-17');
  await userEvent.click(screen.getByRole('button', { name: /^next$/i }));
  await userEvent.upload(screen.getByLabelText(/Credential Image/i), new File([new Uint8Array(1024)], 't.png', { type: 'image/png' }));
  await userEvent.click(screen.getByRole('button', { name: /^next$/i }));
  await userEvent.click(screen.getByRole('button', { name: /mint poap/i }));
  await waitFor(() => expect(buildCredentialAttributes).toHaveBeenCalled());
  expect(buildCredentialAttributes.mock.calls[0][1]).toEqual({
    [FIELDS[0].fieldId]: 'Campo',
    [FIELDS[1].fieldId]: '12',
    [FIELDS[2].fieldId]: 'Juan Perez',
    [FIELDS[3].fieldId]: '2000-05-17',
    [FIELDS[4].fieldId]: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
  });
  expect(buildCredentialAttributes.mock.calls[0][1][FIELDS[4].fieldId]).not.toBe('2000-05-17');
});
