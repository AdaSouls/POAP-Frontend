import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Award, Calendar, Ticket, ImageOff, Lock, Repeat } from 'lucide-react';
import { useDrawer, useDrawerDispatch } from '../../contexts/drawer/drawer.provider';
import { loadingFunction, errorFunction, succesfullBlockchainCreation } from '../../toasts/sweetAlerts';
import eventOwnerIcon from '../../../icons/svg/collection-owner.svg';
import { useEventMetadata } from '../../hooks/useEventMetadata';
import Tooltip from '../../components/Tooltip';
import { getClaimActionLabel, getTaxonomyEntries } from '../../constants/eventCategories';

// Claiming a POAP on Midnight is a single self-service call — claim(eventId, isSoulbound) mints a
// brand-new token scoped to (holder, event); calling it again for the same event the same wallet
// already claimed reverts on-chain ("Wallet already claimed this event"), so there's no separate
// "recipient address" concept here (that's mintTo(), an organizer-only push-mint — a different,
// admin-facing action not covered by this view). Name/image come from the event's own metadataURI
// (see useEventMetadata) — the indexer API itself only has the on-chain fields.
// Always opened from an event card's own "Subscribe" action (exploreEvents.jsx),
// which dispatches CREATE_POAP with that event as the payload — there's no standalone entry point
// into this drawer anymore, so selectedEvent comes from claimEvent alone, no event picker needed.
export default function CreatePoap() {
  const [loading, setLoading] = useState(false);
  const [isSoulbound, setIsSoulbound] = useState(false);
  // Step 1: event preview (read-only). Step 2: soulbound choice + confirm/submit.
  const [step, setStep] = useState(1);
  const [imgLoadError, setImgLoadError] = useState(false);

  const { claimEvent: selectedEvent, midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();
  const navigate = useNavigate();
  const { metadata, loading: metadataLoading } = useEventMetadata(selectedEvent?.metadataURI);
  const claimLabel = getClaimActionLabel(metadata);
  const taxonomyEntries = getTaxonomyEntries(metadata?.category, metadata);
  const showBrokenEventImage = !metadataLoading && (!metadata?.imageUrl || imgLoadError);
  // Falls back to imageUrl when the organizer didn't set a distinct POAP image — broken only if
  // neither is present.
  const showBrokenPoapImage = !metadataLoading && ((!metadata?.poapImageUrl && !metadata?.imageUrl) || imgLoadError);

  const closeDrawer = () => {
    dispatch({ type: 'CLOSE_DRAWER' });
  };

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
      errorFunction("Wallet Required", "Please connect your wallet first.", "");
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
      loadingFunction(claimLabel.loading, `Please confirm the transaction in your ${provider.wallet} wallet…`, "");
      const eventIdBytes = Uint8Array.from(Buffer.from(selectedEvent.eventId, 'hex'));
      const { txHash } = await provider.service.claim(eventIdBytes, isSoulbound);

      succesfullBlockchainCreation(`${claimLabel.done} Successfully`, `Transaction: ${txHash}`, "");
      closeDrawer();
      navigate("/app/my-subscriptions");
    } catch (error) {
      console.error("Error subscribing:", error);
      errorFunction("Error", error.message || `Failed to ${claimLabel.action.toLowerCase()}. Please try again.`, "");
    } finally {
      setLoading(false);
    }
  };

  const eventStatusLabel = (evt) =>
    mintable ? 'Claimable' : isExpired(evt) ? 'Expired' : isFull(evt) ? 'Full' : 'Inactive';

  // Same card in both steps (step 2 is a confirmation, not a different event) — only the
  // thumbnail differs: step 1 shows the event's own listing image (square, rounded corners, same
  // .card-media-thumb-wrap treatment as eventCard.jsx's cards); step 2 shows what the claimed
  // token itself will display (poapImage, falling back to the event image if the organizer didn't
  // set a distinct one) in a same-size but fully-round container, so the two read as visually
  // distinct: "the event" vs. "the POAP you're about to receive."
  const renderEventPreviewCard = (variant) => {
    const isPoap = variant === "poap";
    const imageUrl = isPoap ? metadata?.poapImageUrl || metadata?.imageUrl : metadata?.imageUrl;
    const showBroken = isPoap ? showBrokenPoapImage : showBrokenEventImage;
    return (
    <div className="drawer-modal-preview-card" style={{ position: "relative" }}>
      <div className={`d-flex align-items-${isPoap ? "center" : "start"}`} style={{ gap: "14px" }}>
        <div className="card-media-thumb-wrap" style={{ flexShrink: 0, borderRadius: isPoap ? "50%" : undefined }}>
          {metadataLoading ? (
            <div className="skeleton-block" style={{ width: "100%", height: "100%" }} />
          ) : showBroken ? (
            isPoap
              ? <Award size={22} className="card-media-thumb-broken-icon card-media-thumb-broken-icon-role" />
              : <ImageOff size={22} className="card-media-thumb-broken-icon" />
          ) : (
            <img
              className="card-media-thumb-photo"
              src={imageUrl}
              alt=""
              onError={() => setImgLoadError(true)}
            />
          )}
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0, paddingTop: isPoap ? 0 : "6px", paddingRight: isPoap ? "70px" : 0 }}>
          <div className={isPoap ? undefined : "d-flex align-items-start justify-content-between"} style={{ gap: "8px" }}>
            {metadataLoading ? (
              <div className="skeleton-block" style={{ height: "16px", width: "60%" }} />
            ) : (
              <h5 className="mb-1" style={{ fontSize: '16px', wordBreak: 'break-word' }}>
                {isPoap && "You'll receive a POAP for "}
                {metadata?.name || `Event ${truncateHex(selectedEvent.eventId)}`}
              </h5>
            )}
            {!isPoap && (
              <span className={`badge ${mintable ? 'bg-success' : 'bg-danger'} flex-shrink-0`}>
                {eventStatusLabel(selectedEvent)}
              </span>
            )}
          </div>
          {isPoap ? null : (
            <ul className="list-unstyled mb-0 small mt-3">
              <Tooltip label={selectedEvent.issuerPk} placement="top">
                <li className="d-flex align-items-center mb-1">
                  <img className="mr-2" src={eventOwnerIcon} width="14" height="14" alt="" style={{ flexShrink: 0 }} />
                  Organizer: {metadata?.organization?.name || truncateHex(selectedEvent.issuerPk)}
                </li>
              </Tooltip>
              <li className="d-flex align-items-center mb-1">
                <Ticket size={14} className="mr-2" style={{ flexShrink: 0 }} />
                Supply: {selectedEvent.minted}/{selectedEvent.maxSupply || 'unlimited'}
              </li>
              <li className="d-flex align-items-center">
                <Calendar size={14} className="mr-2" style={{ flexShrink: 0 }} />
                {selectedEvent.expiration > 0
                  ? `Expires: ${new Date(selectedEvent.expiration * 1000).toLocaleDateString()}`
                  : 'No expiry'}
              </li>
            </ul>
          )}
        </div>
      </div>
      {isPoap && !metadataLoading && (
        // Pinned top-right of the card, independent of the vertically-centered text block below it.
        <span
          className={`badge ${mintable ? 'bg-success' : 'bg-danger'}`}
          style={{ position: "absolute", top: "16px", right: "16px" }}
        >
          {eventStatusLabel(selectedEvent)}
        </span>
      )}
      {isPoap && (
        // Pinned bottom-right, out of the vertically-centered text block above — a quiet summary
        // of the switch below rather than another line competing with the title for space.
        <span
          className="d-flex align-items-center small text-muted"
          style={{ position: "absolute", bottom: "12px", right: "16px", gap: "6px" }}
        >
          {isSoulbound ? <Lock size={14} /> : <Repeat size={14} />}
          {isSoulbound ? 'Soulbound — non-transferable' : 'Transferable'}
        </span>
      )}
    </div>
    );
  };

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
          {claimLabel.action}
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
              {selectedEvent ? (
                <>
                  <div className="col-12 mb-3">{renderEventPreviewCard("event")}</div>
                  {taxonomyEntries.length > 0 && (
                    <div className="col-12 mb-3">
                      <div className="drawer-modal-preview-card">
                        <p className="text-muted small mb-2">About this organizer</p>
                        <ul className="list-unstyled mb-0 small">
                          {taxonomyEntries.map((entry) => (
                            <li className="mb-1" key={entry.field}>
                              <span className="text-muted">
                                {entry.label}: <span className="text-white">{entry.value}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="col-12">
                  <p className="text-muted small mb-0">No event selected.</p>
                </div>
              )}
            </>
          )}

          {step === 2 && selectedEvent && (
            <>
              <div className="col-12 mb-3">{renderEventPreviewCard("poap")}</div>

              <div className="col-12 mt-3 mb-3">
                <div className="drawer-modal-preview-card">
                  <div className="d-flex align-items-center" style={{ gap: "14px" }}>
                    <div className="form-check form-switch mb-0 flex-shrink-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isSoulbound"
                        checked={isSoulbound}
                        onChange={(e) => setIsSoulbound(e.target.checked)}
                      />
                    </div>
                    <label className="form-check-label mb-0" htmlFor="isSoulbound">
                      Soulbound (non-transferable)
                    </label>
                  </div>
                </div>
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
              className="btn btn-card-detail-action"
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
              {loading ? `${claimLabel.loading}…` : claimLabel.action}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
