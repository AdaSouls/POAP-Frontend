import { getAllEvents, getEventById, getEventsByOrganizer, createEvent, updateEventStatus } from '../../services/event.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('Event Service', () => {
  const API_BASE_URL = process.env.REACT_APP_PAIMA_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('getAllEvents', () => {
    it('fetches all events without filters', async () => {
      const mockEvents = [
        { eventId: 1, title: 'Event 1' },
        { eventId: 2, title: 'Event 2' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      });

      const result = await getAllEvents();

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/get_all_events`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockEvents);
    });

    it('fetches events with filters', async () => {
      const filters = {
        organiserAddress: '0x123',
        status: 'Active',
        expired: 'false',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getAllEvents(filters);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('organiserAddress=0x123'),
        expect.any(Object)
      );
    });
  });

  describe('getEventById', () => {
    it('fetches event by ID successfully', async () => {
      const mockEvent = { eventId: 1, title: 'Event 1' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      });

      const result = await getEventById(1);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/get_event/1`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockEvent);
    });
  });

  describe('getEventsByOrganizer', () => {
    it('fetches events by organizer address', async () => {
      const mockEvents = [{ eventId: 1, organiserAddress: '0x123' }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvents,
      });

      const result = await getEventsByOrganizer('0x123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/get_events_by_organizer?address=0x123`,
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockEvents);
    });
  });

  describe('createEvent', () => {
    it('creates event successfully', async () => {
      const eventData = {
        title: 'New Event',
        description: 'Event Description',
        maxSupply: 100,
      };

      const mockEvent = { eventId: 1, ...eventData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockEvent),
      });

      const result = await createEvent(eventData);

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/create_event`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData),
        })
      );
      expect(result).toEqual(mockEvent);
    });

    it('handles empty response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await expect(createEvent({})).rejects.toThrow('empty response');
    });
  });

  describe('updateEventStatus', () => {
    it('updates event status successfully', async () => {
      const mockEvent = { eventId: 1, status: 'Active' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      });

      const result = await updateEventStatus(1, 'Active');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/update_event_status`,
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: 1, status: 'Active' }),
        })
      );
      expect(result).toEqual(mockEvent);
    });
  });
});

