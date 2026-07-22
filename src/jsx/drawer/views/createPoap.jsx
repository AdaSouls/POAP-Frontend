import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { getAllEvents } from '../../../midnight/indexer.service';
import { recordLastClaimTx } from '../../../midnight/attendance-proof';
import { loadingFunction, errorFunction, succesfullBlockchainCreation } from '../../toasts/sweetAlerts';
import eventNormal from '../../../images/svg/event-normal.svg';
import eventOwnerIcon from '../../../icons/svg/collection-owner.svg';

// Claiming a SPOAP on Midnight is a single self-service call — claimOrUpdate(eventId, isSoulbound)
// mints on first claim and updates the same token on every claim after, so there's no separate
// "recipient address" concept here (that's mintTo(), an organizer-only push-mint — a different,
// admin-facing action not covered by this view). Event data comes from the on-chain-only Midnight
// indexer API, so there's no title/description/image to show — see indexer.service.ts.
export default function CreatePoap() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSoulbound, setIsSoulbound] = useState(false);

  const { event, midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const closeDrawer = () => {
    dispatch({ type: 'CLOSE_DRAWER' });
  };

  const loadEvents = useCallback(async () => {
    try {
      const allEvents = await getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  }, []);

  useEffect(() => {
    if (event && event.event) {
      setSelectedEvent(event.event);
    }
    loadEvents();
  }, [event, loadEvents]);

  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      const eventIdFromUrl = searchParams.get('eventId');
      if (eventIdFromUrl) {
        const eventFromUrl = events.find((evt) => evt.eventId === eventIdFromUrl);
        if (eventFromUrl) setSelectedEvent(eventFromUrl);
      }
    }
  }, [events, searchParams, selectedEvent]);

  const truncateHex = (hex) => {
    if (!hex) return "N/A";
    return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
  };

  const isExpired = (evt) => Boolean(evt.expiration && evt.expiration > 0 && evt.expiration * 1000 <= Date.now());
  const isFull = (evt) => Boolean(evt.maxSupply && evt.maxSupply > 0 && evt.minted >= evt.maxSupply);
  const mintable = selectedEvent
    ? selectedEvent.isActive && !isExpired(selectedEvent) && !isFull(selectedEvent)
    : false;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!provider) {
      errorFunction("Wallet Required", "Please connect your Lace wallet first.", "");
      return;
    }
    if (!selectedEvent) {
      errorFunction("Event Selection Required", "Please select an event first.", "");
      return;
    }
    if (!mintable) {
      errorFunction("Cannot Claim", "This event is not currently claimable.", "");
      return;
    }

    setLoading(true);
    try {
      loadingFunction("Claiming SPOAP", "Please confirm the transaction in your Lace wallet…", "");
      const eventIdBytes = Uint8Array.from(Buffer.from(selectedEvent.eventId, 'hex'));
      const { txHash } = await provider.service.claimOrUpdate(eventIdBytes, isSoulbound);
      recordLastClaimTx(selectedEvent.issuerPk, txHash);

      succesfullBlockchainCreation("SPOAP Claimed Successfully", `Transaction: ${txHash}`, "");
      closeDrawer();
      navigate("/poap-management");
    } catch (error) {
      console.error("Error claiming POAP:", error);
      errorFunction("Error", error.message || "Failed to claim SPOAP. Please try again.", "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column w-100 h-100 p-3 overflow-auto">
      <div className="drawer-header">
        <div className="d-flex justify-content-start">
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          ></button>
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold">
            Claim SPOAP
          </h4>
        </div>
      </div>

      <div className="drawer-body">
        <form name="createPoapForm" className="signin_validate row g-3" onSubmit={handleSubmit}>
          <div className="col-12">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>
              Select Event
            </label>
            <select
              className="form-select"
              value={selectedEvent?.eventId || ''}
              onChange={(e) => {
                const evt = events.find((it) => it.eventId === e.target.value);
                setSelectedEvent(evt || null);
              }}
              required
            >
              <option value="" disabled>Choose an event…</option>
              {events.map((evt) => (
                <option key={evt.eventId} value={evt.eventId}>
                  {truncateHex(evt.eventId)} — {evt.minted}/{evt.maxSupply || '∞'} minted
                  {isExpired(evt) ? ' (expired)' : !evt.isActive ? ' (inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="col-12 mt-3">
              <div className="card">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <img className="mr-3 rounded-circle" src={eventNormal} width="48" height="48" alt="" />
                    <div>
                      <h5 className="mb-1" style={{ fontSize: '16px' }}>Event {truncateHex(selectedEvent.eventId)}</h5>
                      <span className={`badge ${mintable ? 'bg-success' : 'bg-danger'}`}>
                        {mintable ? 'Claimable' : isExpired(selectedEvent) ? 'Expired' : isFull(selectedEvent) ? 'Full' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <ul className="list-unstyled mb-0 small">
                    <li className="d-flex align-items-center mb-2">
                      <img className="mr-2" src={eventOwnerIcon} width="16" height="16" alt="" />
                      Organizer: {truncateHex(selectedEvent.issuerPk)}
                    </li>
                    <li className="mb-2">
                      Supply: {selectedEvent.minted}/{selectedEvent.maxSupply || 'unlimited'}
                    </li>
                    <li className="mb-2">
                      {selectedEvent.expiration > 0
                        ? `Expires: ${new Date(selectedEvent.expiration * 1000).toLocaleDateString()}`
                        : 'No expiry'}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="form-check form-switch mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isSoulbound"
                  checked={isSoulbound}
                  onChange={(e) => setIsSoulbound(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="isSoulbound">
                  Soulbound (non-transferable)
                </label>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="drawer-footer">
        <button
          type="submit"
          className="btn btn-gradient btn-block"
          onClick={handleSubmit}
          disabled={loading || !selectedEvent || !mintable}
        >
          {loading ? 'Claiming…' : 'Claim SPOAP'}
        </button>
      </div>
    </div>
  );
}
