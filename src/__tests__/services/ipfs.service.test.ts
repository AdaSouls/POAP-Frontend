import {
  uploadImageToIPFS,
  uploadJSONToIPFS,
  uploadPrivateJSONToIPFS,
  getPrivateContentSignedUrl,
} from '../../services/ipfs.service';

function jsonResponse(body: unknown, ok = true, statusText = 'Error') {
  return { ok, statusText, json: jest.fn().mockResolvedValue(body) };
}

describe('ipfs.service', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch as typeof global.fetch;
  });

  it('uploadJSONToIPFS posts the metadata as JSON to the local proxy and returns the ipfs:// uri', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ uri: 'ipfs://bafyMetaCID' })) as any;

    const uri = await uploadJSONToIPFS({ name: 'Test Event' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/ipfs/upload-json',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Event' }),
      }),
    );
    expect(uri).toBe('ipfs://bafyMetaCID');
  });

  it('uploadImageToIPFS posts the file as multipart form-data and returns the ipfs:// uri', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ uri: 'ipfs://bafyImageCID' })) as any;
    const file = new File(['fake-bytes'], 'photo.png', { type: 'image/png' });

    const uri = await uploadImageToIPFS(file);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/ipfs/upload-image',
      expect.objectContaining({ method: 'POST' }),
    );
    const call = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(call.body).toBeInstanceOf(FormData);
    expect(uri).toBe('ipfs://bafyImageCID');
  });

  it('throws the server-provided error message on a non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ error: 'Pinata upload failed (401): bad key' }, false)) as any;

    await expect(uploadJSONToIPFS({ name: 'x' })).rejects.toThrow('Pinata upload failed (401): bad key');
  });

  it('falls back to statusText when the error response has no body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      json: jest.fn().mockRejectedValue(new Error('no body')),
    }) as any;

    await expect(uploadJSONToIPFS({ name: 'x' })).rejects.toThrow('IPFS upload failed: Internal Server Error');
  });

  it('uploadPrivateJSONToIPFS posts to the private-network route and returns the ipfs:// uri', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ uri: 'ipfs://bafyPrivateCID' })) as any;

    const uri = await uploadPrivateJSONToIPFS({ notes: 'secret' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/ipfs/upload-json-private',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'secret' }),
      }),
    );
    expect(uri).toBe('ipfs://bafyPrivateCID');
  });

  it('getPrivateContentSignedUrl posts the value hex and returns the signed url', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ url: 'https://gateway.example/signed' })) as any;
    const valueHex = 'aa'.repeat(32);

    const url = await getPrivateContentSignedUrl(valueHex);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/ipfs/private-signed-url',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: valueHex }),
      }),
    );
    expect(url).toBe('https://gateway.example/signed');
  });

  it('getPrivateContentSignedUrl throws the server-provided error message on a non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse({ error: 'Expected a 32-byte hex "value"' }, false)) as any;

    await expect(getPrivateContentSignedUrl('not-hex')).rejects.toThrow('Expected a 32-byte hex "value"');
  });
});
