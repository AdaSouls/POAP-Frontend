/**
 * Data Synchronization Service
 * Handles real-time data synchronization between frontend and backend
 */

import { getAllEventsService, getAllPoapsService } from './paima.service';

class DataSyncService {
  constructor() {
    this.pollingIntervals = new Map();
    this.isPolling = false;
  }

  /**
   * Start polling for events data
   * @param {Function} updateCallback - Callback function to update events
   * @param {number} intervalMs - Polling interval in milliseconds (default: 5000)
   */
  startEventsPolling(updateCallback, intervalMs = 5000) {
    if (this.pollingIntervals.has('events')) {
      this.stopEventsPolling();
    }

    const pollEvents = async () => {
      try {
        const events = await getAllEventsService();
        updateCallback(events);
      } catch (error) {
        console.error('Error polling events:', error);
      }
    };

    // Poll immediately
    pollEvents();

    // Set up interval
    const intervalId = setInterval(pollEvents, intervalMs);
    this.pollingIntervals.set('events', intervalId);
    this.isPolling = true;

    console.log('Started events polling with interval:', intervalMs);
  }

  /**
   * Start polling for POAPs data
   * @param {Function} updateCallback - Callback function to update POAPs
   * @param {number} intervalMs - Polling interval in milliseconds (default: 5000)
   */
  startPoapsPolling(updateCallback, intervalMs = 5000) {
    if (this.pollingIntervals.has('poaps')) {
      this.stopPoapsPolling();
    }

    const pollPoaps = async () => {
      try {
        const poaps = await getAllPoapsService();
        updateCallback(poaps);
      } catch (error) {
        console.error('Error polling POAPs:', error);
      }
    };

    // Poll immediately
    pollPoaps();

    // Set up interval
    const intervalId = setInterval(pollPoaps, intervalMs);
    this.pollingIntervals.set('poaps', intervalId);
    this.isPolling = true;

    console.log('Started POAPs polling with interval:', intervalMs);
  }

  /**
   * Stop polling for events data
   */
  stopEventsPolling() {
    const intervalId = this.pollingIntervals.get('events');
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete('events');
      console.log('Stopped events polling');
    }
  }

  /**
   * Stop polling for POAPs data
   */
  stopPoapsPolling() {
    const intervalId = this.pollingIntervals.get('poaps');
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete('poaps');
      console.log('Stopped POAPs polling');
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling() {
    this.pollingIntervals.forEach((intervalId, key) => {
      clearInterval(intervalId);
      console.log(`Stopped ${key} polling`);
    });
    this.pollingIntervals.clear();
    this.isPolling = false;
  }

  /**
   * Get polling status
   */
  getPollingStatus() {
    return {
      isPolling: this.isPolling,
      activePolls: Array.from(this.pollingIntervals.keys())
    };
  }

  /**
   * Refresh events data once (without polling)
   * @param {Function} updateCallback - Callback function to update events
   */
  async refreshEvents(updateCallback) {
    try {
      const events = await getAllEventsService();
      updateCallback(events);
      return events;
    } catch (error) {
      console.error('Error refreshing events:', error);
      throw error;
    }
  }

  /**
   * Refresh POAPs data once (without polling)
   * @param {Function} updateCallback - Callback function to update POAPs
   */
  async refreshPoaps(updateCallback) {
    try {
      const poaps = await getAllPoapsService();
      updateCallback(poaps);
      return poaps;
    } catch (error) {
      console.error('Error refreshing POAPs:', error);
      throw error;
    }
  }
}

// Export singleton instance
const dataSyncService = new DataSyncService();
export default dataSyncService;
