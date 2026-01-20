import dataSyncService from '../../services/dataSync.service';
import { getAllEventsService, getAllPoapsService } from '../../services/paima.service';

// Mock paima service
jest.mock('../../services/paima.service', () => ({
  getAllEventsService: jest.fn(),
  getAllPoapsService: jest.fn(),
}));

describe('DataSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Clear any existing intervals
    dataSyncService.stopAllPolling();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    dataSyncService.stopAllPolling();
  });

  describe('startEventsPolling', () => {
    it('starts polling for events', async () => {
      const mockEvents = [{ eventId: 1 }];
      getAllEventsService.mockResolvedValue(mockEvents);
      const updateCallback = jest.fn();

      dataSyncService.startEventsPolling(updateCallback, 1000);

      expect(getAllEventsService).toHaveBeenCalled();
    });

    it('stops previous polling before starting new one', () => {
      const updateCallback = jest.fn();
      dataSyncService.startEventsPolling(updateCallback, 1000);
      dataSyncService.startEventsPolling(updateCallback, 1000);

      expect(dataSyncService.getPollingStatus().activePolls).toContain('events');
    });
  });

  describe('startPoapsPolling', () => {
    it('starts polling for POAPs', async () => {
      const mockPoaps = [{ tokenId: 1 }];
      getAllPoapsService.mockResolvedValue(mockPoaps);
      const updateCallback = jest.fn();

      dataSyncService.startPoapsPolling(updateCallback, 1000);

      expect(getAllPoapsService).toHaveBeenCalled();
    });
  });

  describe('stopEventsPolling', () => {
    it('stops events polling', () => {
      const updateCallback = jest.fn();
      dataSyncService.startEventsPolling(updateCallback, 1000);
      dataSyncService.stopEventsPolling();

      expect(dataSyncService.getPollingStatus().activePolls).not.toContain('events');
    });
  });

  describe('stopPoapsPolling', () => {
    it('stops POAPs polling', () => {
      const updateCallback = jest.fn();
      dataSyncService.startPoapsPolling(updateCallback, 1000);
      dataSyncService.stopPoapsPolling();

      expect(dataSyncService.getPollingStatus().activePolls).not.toContain('poaps');
    });
  });

  describe('stopAllPolling', () => {
    it('stops all polling', () => {
      const updateCallback = jest.fn();
      dataSyncService.startEventsPolling(updateCallback, 1000);
      dataSyncService.startPoapsPolling(updateCallback, 1000);
      dataSyncService.stopAllPolling();

      expect(dataSyncService.getPollingStatus().isPolling).toBe(false);
      expect(dataSyncService.getPollingStatus().activePolls).toHaveLength(0);
    });
  });

  describe('refreshEvents', () => {
    it('refreshes events once', async () => {
      const mockEvents = [{ eventId: 1 }];
      getAllEventsService.mockResolvedValue(mockEvents);
      const updateCallback = jest.fn();

      const result = await dataSyncService.refreshEvents(updateCallback);

      expect(getAllEventsService).toHaveBeenCalledTimes(1);
      expect(updateCallback).toHaveBeenCalledWith(mockEvents);
      expect(result).toEqual(mockEvents);
    });
  });

  describe('refreshPoaps', () => {
    it('refreshes POAPs once', async () => {
      const mockPoaps = [{ tokenId: 1 }];
      getAllPoapsService.mockResolvedValue(mockPoaps);
      const updateCallback = jest.fn();

      const result = await dataSyncService.refreshPoaps(updateCallback);

      expect(getAllPoapsService).toHaveBeenCalledTimes(1);
      expect(updateCallback).toHaveBeenCalledWith(mockPoaps);
      expect(result).toEqual(mockPoaps);
    });
  });

  describe('getPollingStatus', () => {
    it('returns correct polling status', () => {
      const updateCallback = jest.fn();
      dataSyncService.startEventsPolling(updateCallback, 1000);

      const status = dataSyncService.getPollingStatus();

      expect(status.isPolling).toBe(true);
      expect(status.activePolls).toContain('events');
    });
  });
});

