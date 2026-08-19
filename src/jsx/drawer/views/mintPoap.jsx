import { useState } from "react";
import { X } from "lucide-react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import eventNormal from "../../../images/svg/event-normal.svg";
import eventOwnerIcon from "../../../icons/svg/collection-owner.svg";
import {
  succesfullBlockchainCreation,
  errorFunction,
  loadingFunction,
} from "../../toasts/sweetAlerts";
import { useEventMetadata } from "../../hooks/useEventMetadata";

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// mintTo(eventId, recipientPk, tokenMetadataURI, tokenPrivateMetadataCommit) — the organizer-only
// push-mint circuit (poap.compact) — is the counterpart to createPoap.jsx's self-service claim():
// instead of the recipient claiming their own token, the organizer mints a brand-new one directly
// to a recipient's per-issuer holder pk. Always opened pre-filled with a specific event
// (CREATE_MINT's payload, dispatched from eventCard.jsx's expanded detail — no event selector
// here, unlike Claim POAP).
export default function MintPoap() {
  const { mintEvent, midnight } = useDrawer();
  const dispatch = useDrawerDispatch();
  const { metadata } = useEventMetadata(mintEvent?.metadataURI);

  const [recipientPkHex, setRecipientPkHex] = useState("");
  const [loading, setLoading] = useState(false);

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!midnight?.provider || !mintEvent) return;

    if (!/^[0-9a-fA-F]{64}$/.test(recipientPkHex.trim())) {
      errorFunction(
        "Invalid Public Key",
        "Recipient public key must be a 32-byte hex string (64 hex characters).",
        ""
      );
      return;
    }

    setLoading(true);
    try {
      loadingFunction("Minting POAP", `Please confirm the transaction in your ${midnight.provider.wallet} wallet…`, "");
      const eventIdBytes = Uint8Array.from(Buffer.from(mintEvent.eventId, "hex"));
      const recipientPk = Uint8Array.from(Buffer.from(recipientPkHex.trim(), "hex"));
      // Mirror the event's own public metadata onto this token — mintTo stores exactly what's
      // passed here, there's no on-chain fallback to the event's metadataURI (see
      // contract.service.ts). Private per-token metadata isn't set from this drawer, so it's left
      // as the default "no private part".
      const { txHash } = await midnight.provider.service.mintTo(
        eventIdBytes,
        recipientPk,
        mintEvent.metadataURI || ""
      );

      succesfullBlockchainCreation("POAP Minted Successfully", `Transaction: ${txHash}`, "");
      closeDrawer();
    } catch (error) {
      console.error("Error minting POAP:", error);
      errorFunction("Error", error.message || "Failed to mint POAP. Please try again.", "");
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
          Mint POAP
        </h4>
      </div>

      <div className="drawer-body">
        {mintEvent ? (
          <form name="mintPoapForm" className="row g-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <div className="drawer-modal-preview-card">
                <div className="d-flex align-items-center mb-3">
                  <img
                    className="mr-3 rounded-circle"
                    src={metadata?.poapImageUrl || metadata?.imageUrl || eventNormal}
                    width="48"
                    height="48"
                    alt=""
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = eventNormal; }}
                  />
                  <div>
                    <h5 className="mb-1" style={{ fontSize: "16px" }}>
                      {metadata?.name || `Event ${truncateHex(mintEvent.eventId)}`}
                    </h5>
                  </div>
                </div>
                <ul className="list-unstyled mb-0 small">
                  <li className="d-flex align-items-center mb-2">
                    <img className="mr-2" src={eventOwnerIcon} width="16" height="16" alt="" />
                    Organizer: {truncateHex(mintEvent.issuerPk)}
                  </li>
                  <li className="mb-2">
                    Supply: {mintEvent.minted}/{mintEvent.maxSupply || "unlimited"}
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-12 mt-3">
              <label className="form-label">Recipient's Key (hex)</label>
              <input
                type="text"
                className="form-control"
                placeholder="64-character hex key"
                name="recipientPkHex"
                value={recipientPkHex}
                onChange={(event) => setRecipientPkHex(event.target.value)}
                required
              />
              <small className="form-text text-muted">
                Not their wallet address — this has to be the key they generate specifically for
                you. Send them your organizer public key ({truncateHex(mintEvent.issuerPk)}), have
                them open My Subscriptions → Get My Key and paste it in, and they'll get back the
                value to paste here.
              </small>
            </div>
          </form>
        ) : (
          <div className="alert alert-info" role="alert">
            No event selected. Open this from an event's expanded detail on the Events page.
          </div>
        )}
      </div>

      {mintEvent && (
        <div className="drawer-footer">
          <button
            type="submit"
            className="btn btn-gradient btn-block"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Minting…" : "Mint POAP"}
          </button>
        </div>
      )}
    </div>
  );
}
