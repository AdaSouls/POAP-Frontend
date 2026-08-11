import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
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
  // Step 1: pick the event (+ its preview card). Step 2: soulbound choice + confirm/submit — the
  // only one of these four forms with enough content to warrant a second step (event dropdown +
  // preview card + toggle), per the /brainstorm design discussion.
  const [step, setStep] = useState(1);

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
      loadingFunction("Claiming POAP", "Please confirm the transaction in your Lace wallet…", "");
      const eventIdBytes = Uint8Array.from(Buffer.from(selectedEvent.eventId, 'hex'));
      const { txHash } = await provider.service.claimOrUpdate(eventIdBytes, isSoulbound);
      recordLastClaimTx(selectedEvent.issuerPk, txHash);

      succesfullBlockchainCreation("POAP Claimed Successfully", `Transaction: ${txHash}`, "");
      closeDrawer();
      navigate("/my-subscriptions");
    } catch (error) {
      console.error("Error claiming POAP:", error);
      errorFunction("Error", error.message || "Failed to claim POAP. Please try again.", "");
    } finally {
      setLoading(false);
    }
  };

  const eventStatusLabel = (evt) =>
    mintable ? 'Claimable' : isExpired(evt) ? 'Expired' : isFull(evt) ? 'Full' : 'Inactive';

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button
          className="btn wallet-modal-close"
          onClick={closeDrawer}
          aria-label="close"
        >
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">
          Claim POAP
        </h4>
      </div>

      <div className="drawer-modal-steps">
        <span className={`step-dot${step === 1 ? ' active' : ''}`} />
        <span className={`step-dot${step === 2 ? ' active' : ''}`} />
      </div>

      <div className="drawer-body">
        <form name="createPoapForm" className="row g-3" onSubmit={handleSubmit}>
          {step === 1 && (
            <>
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
                  <div className="drawer-modal-preview-card">
                    <div className="d-flex align-items-center mb-3">
                      <img className="mr-3 rounded-circle" src={eventNormal} width="48" height="48" alt="" />
                      <div>
                        <h5 className="mb-1" style={{ fontSize: '16px' }}>Event {truncateHex(selectedEvent.eventId)}</h5>
                        <span className={`badge ${mintable ? 'bg-success' : 'bg-danger'}`}>
                          {eventStatusLabel(selectedEvent)}
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
              )}
            </>
          )}

          {step === 2 && selectedEvent && (
            <>
              <div className="col-12">
                <div className="drawer-modal-preview-card">
                  <h5 className="mb-1" style={{ fontSize: '16px' }}>Event {truncateHex(selectedEvent.eventId)}</h5>
                  <p className="small text-muted mb-0">Confirm your claim for this event.</p>
                </div>
              </div>

              <div className="col-12 form-check form-switch mt-3">
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
            </>
          )}
        </form>
      </div>

      <div className="drawer-footer">
        {step === 1 ? (
          <button
            type="button"
            className="btn btn-gradient btn-block w-100"
            onClick={() => setStep(2)}
            disabled={!selectedEvent || !mintable}
          >
            Next
          </button>
        ) : (
          <div className="d-flex gap-2 w-100">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-gradient flex-grow-1"
              onClick={handleSubmit}
              disabled={loading || !selectedEvent || !mintable}
            >
              {loading ? 'Claiming…' : 'Claim POAP'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
