import { renderHook, waitFor } from '@testing-library/react';
import { useEventMetadata } from '../../jsx/hooks/useEventMetadata';

function mockFetchOnce(response) {
  global.fetch = jest.fn().mockResolvedValue(response);
}

function jsonResponse(body, ok = true) {
  return { ok, json: jest.fn().mockResolvedValue(body) };
}

describe('useEventMetadata Hook', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('does not fetch and returns null metadata when there is no metadataURI', () => {
    global.fetch = jest.fn();
    const { result } = renderHook(() => useEventMetadata(undefined));

    expect(result.current.metadata).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches and returns metadata for a plain https URI', async () => {
    mockFetchOnce(jsonResponse({ name: 'DevCon 2026', description: 'desc', image: 'https://example.com/img.png' }));

    const { result } = renderHook(() => useEventMetadata('https://example.com/meta.json'));

    await waitFor(() => expect(result.current.metadata).not.toBeNull());
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/meta.json');
    expect(result.current.metadata.name).toBe('DevCon 2026');
    expect(result.current.metadata.imageUrl).toBe('https://example.com/img.png');
  });

  it('resolves an ipfs:// metadataURI through the ipfs.io gateway', async () => {
    mockFetchOnce(jsonResponse({ name: 'IPFS Event' }));

    const { result } = renderHook(() => useEventMetadata('ipfs://bafyCID/meta.json'));

    await waitFor(() => expect(result.current.metadata).not.toBeNull());
    expect(global.fetch).toHaveBeenCalledWith('https://ipfs.io/ipfs/bafyCID/meta.json');
  });

  it('resolves an ipfs:// image field inside the fetched JSON through the gateway too', async () => {
    mockFetchOnce(jsonResponse({ name: 'IPFS Event', image: 'ipfs://bafyImageCID' }));

    const { result } = renderHook(() => useEventMetadata('https://example.com/meta-with-ipfs-image.json'));

    await waitFor(() => expect(result.current.metadata).not.toBeNull());
    expect(result.current.metadata.imageUrl).toBe('https://ipfs.io/ipfs/bafyImageCID');
  });

  it('resolves to null metadata on a non-OK response, without throwing', async () => {
    mockFetchOnce(jsonResponse({}, false));

    const { result } = renderHook(() => useEventMetadata('https://example.com/missing.json'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metadata).toBeNull();
  });

  it('resolves to null metadata on malformed JSON, without throwing', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockRejectedValue(new Error('invalid json')),
    });

    const { result } = renderHook(() => useEventMetadata('https://example.com/bad.json'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metadata).toBeNull();
  });

  it('resolves to null metadata on a network error, without throwing', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useEventMetadata('https://example.com/unreachable.json'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.metadata).toBeNull();
  });

  it('shares one fetch across concurrent callers for the same metadataURI', async () => {
    mockFetchOnce(jsonResponse({ name: 'Shared Event' }));

    const uri = 'https://example.com/shared.json';
    const { result: a } = renderHook(() => useEventMetadata(uri));
    const { result: b } = renderHook(() => useEventMetadata(uri));

    await waitFor(() => expect(a.current.metadata).not.toBeNull());
    await waitFor(() => expect(b.current.metadata).not.toBeNull());

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
