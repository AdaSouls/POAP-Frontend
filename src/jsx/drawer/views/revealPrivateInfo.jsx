import { useState } from "react";
import { X } from "lucide-react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { getPrivateContentSignedUrl } from "../../../services/ipfs.service";
import {
  errorFunction,
  loadingFunction,
  succesfullBlockchainCreation,
} from "../../toasts/sweetAlerts";

const HEX32_PATTERN = /^[0-9a-fA-F]{64}$/;

// revealPrivateMetadata(eventId, value, rand) has no identity check on-chain — knowing the
// (value, rand) opening of the commit IS the authorization (see poap.compact's own comment on the
// circuit). eventCard.jsx already lets the organizer reveal their own event (it has value/rand
// cached locally from creation). This view is the counterpart for anyone the organizer shared
// (value, rand) with out-of-band (chat, email, in person) — a holder who was never the one who
// created the event, so there's no local draft to read from; every field has to be typed in.
export default function RevealPrivateInfo() {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();

  const [eventIdHex, setEventIdHex] = useState("");
  const [valueHex, setValueHex] = useState("");
  const [randHex, setRandHex] = useState("");
  const [revealedNotes, setRevealedNotes] = useState(null);
  const [loading, setLoading] = useState(false);

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const handleReveal = async (e) => {
    e.preventDefault();
    if (!midnight?.provider) return;

    const trimmedEventId = eventIdHex.trim();
    const trimmedValue = valueHex.trim();
    const trimmedRand = randHex.trim();
    if (!HEX32_PATTERN.test(trimmedEventId) || !HEX32_PATTERN.test(trimmedValue) || !HEX32_PATTERN.test(trimmedRand)) {
      errorFunction(
        "Invalid Input",
        "Event ID, Value, and Rand must each be a 32-byte hex string (64 hex characters).",
        ""
      );
      return;
    }

    setLoading(true);
    setRevealedNotes(null);
    try {
      loadingFunction("Revealing Private Info", `Please confirm the transaction in your ${midnight.provider.wallet} wallet…`, "");
      const eventIdBytes = Uint8Array.from(Buffer.from(trimmedEventId, "hex"));
      const valueBytes = Uint8Array.from(Buffer.from(trimmedValue, "hex"));
      const randBytes = Uint8Array.from(Buffer.from(trimmedRand, "hex"));
      const { txHash } = await midnight.provider.service.revealPrivateMetadata(eventIdBytes, valueBytes, randBytes);

      const url = await getPrivateContentSignedUrl(trimmedValue);
      const response = await fetch(url);
      const json = await response.json();
      setRevealedNotes(json?.notes ?? null);

      succesfullBlockchainCreation("Private Info Revealed", `Transaction: ${txHash}`, "");
    } catch (error) {
      console.error("Error revealing private metadata:", error);
      errorFunction("Error", error.message || "Failed to reveal private info. Please try again.", "");
    } finally {
      setLoading(false);
    }
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
          Reveal Private Info
        </h4>
      </div>

      <div className="drawer-body">
        {midnight?.provider ? (
          <form name="revealPrivateInfoForm" className="row g-3" onSubmit={handleReveal}>
            <div className="col-12">
              <label className="form-label" htmlFor="eventIdHex">Event ID (hex)</label>
              <input
                id="eventIdHex"
                type="text"
                className="form-control"
                placeholder="64-character hex event id"
                name="eventIdHex"
                value={eventIdHex}
                onChange={(event) => setEventIdHex(event.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="valueHex">Value (hex)</label>
              <input
                id="valueHex"
                type="text"
                className="form-control"
                placeholder="64-character hex value"
                name="valueHex"
                value={valueHex}
                onChange={(event) => setValueHex(event.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label" htmlFor="randHex">Rand (hex)</label>
              <input
                id="randHex"
                type="text"
                className="form-control"
                placeholder="64-character hex rand"
                name="randHex"
                value={randHex}
                onChange={(event) => setRandHex(event.target.value)}
                required
              />
              <small className="form-text text-muted">
                Ask the organizer for these three values — they got them when they created the
                event. Revealing publishes the value on-chain permanently; anyone can then read the
                same content, not just you.
              </small>
            </div>

            {revealedNotes && (
              <div className="col-12 mt-3">
                <div className="drawer-modal-preview-card">
                  <p className="m-0 small text-muted mb-1">Revealed content</p>
                  <p className="m-0 text-break small font-weight-semibold">{revealedNotes}</p>
                </div>
              </div>
            )}
          </form>
        ) : (
          <div className="alert alert-info" role="alert">
            Connect your wallet first to reveal private info.
          </div>
        )}
      </div>

      {midnight?.provider && (
        <div className="drawer-footer">
          <button
            type="submit"
            className="btn btn-gradient btn-block"
            onClick={handleReveal}
            disabled={loading}
          >
            {loading ? "Revealing…" : "Reveal"}
          </button>
        </div>
      )}
    </div>
  );
}
