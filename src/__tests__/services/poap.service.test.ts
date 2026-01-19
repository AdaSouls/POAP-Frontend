import { getUserPoaps, getAllPoaps, getPoapById, getPoapsByEvent, createPoapForEvent } from '../../services/poap.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('POAP Service', () => {
  const API_BASE_URL = process.env.REACT_APP_PAIMA_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('getUserPoaps', () => {
    it('fetches user POAPs successfully', async () => {
      const mockPoaps = [
        { tokenId: 1, ownerAddress: '0x123' },
        { tokenId: 2, ownerAddress: '0x123' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ poaps: mockPoaps }),
      });

      const result = await getUserPoaps('0x123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/owner_poaps?walletAddress=0x123`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockPoaps);
    });

    it('throws error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(getUserPoaps('0x123')).rejects.toThrow();
    });
  });

  describe('getAllPoaps', () => {
    it('fetches all POAPs successfully', async () => {
      const mockPoaps = [
        { tokenId: 1 },
        { tokenId: 2 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ poaps: mockPoaps }),
      });

      const result = await getAllPoaps();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/get_all_poaps`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockPoaps);
    });
  });

  describe('getPoapById', () => {
    it('fetches POAP(s) by ID successfully - returns array', async () => {
      // NOTE: tokenId is NOT unique, so API returns an array
      const mockPoaps = [{ tokenId: 1, eventId: 1, poapUuid: 'uuid-1' }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPoaps,
      });

      const result = await getPoapById(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/get_poap/1`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockPoaps);
    });

    it('handles single POAP result and converts to array', async () => {
      const mockPoap = { tokenId: 1, eventId: 1, poapUuid: 'uuid-1' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPoap,
      });

      const result = await getPoapById(1);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([mockPoap]);
    });
  });

  describe('getPoapsByEvent', () => {
    it('fetches POAPs by event ID successfully', async () => {
      const mockPoaps = [
        { tokenId: 1, eventId: 1 },
        { tokenId: 2, eventId: 1 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ poaps: mockPoaps }),
      });

      const result = await getPoapsByEvent(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/get_poaps_by_event?eventId=1`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockPoaps);
    });
  });

  describe('createPoapForEvent', () => {
    it('creates POAP for event successfully', async () => {
      const mockPoap = { tokenId: 1, eventId: 1, issuerId: 1 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPoap,
      });

      const result = await createPoapForEvent(1, 1, '0x123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/create_poap_for_event`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: 1, issuerId: 1, ownerAddress: '0x123' }),
        })
      );
      expect(result).toEqual(mockPoap);
    });
  });
});

