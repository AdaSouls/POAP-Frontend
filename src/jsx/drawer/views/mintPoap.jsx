import { useState } from "react";
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

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

// mintTo(eventId, recipientPk) — the organizer-only push-mint circuit (poap.compact) — is the
// counterpart to createPoap.jsx's self-service claimOrUpdate: instead of the recipient claiming
// their own token, the organizer mints it directly to a wallet that hasn't claimed anything
// locally yet. Always opened pre-filled with a specific event (CREATE_MINT's payload, dispatched
// from eventCard.jsx's expanded detail — no event selector here, unlike Claim POAP).
export default function MintPoap() {
  const { mintEvent, midnight } = useDrawer();
  const dispatch = useDrawerDispatch();

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
      loadingFunction("Minting POAP", "Please confirm the transaction in your Lace wallet…", "");
      const eventIdBytes = Uint8Array.from(Buffer.from(mintEvent.eventId, "hex"));
      const recipientPk = Uint8Array.from(Buffer.from(recipientPkHex.trim(), "hex"));
      const { txHash } = await midnight.provider.service.mintTo(eventIdBytes, recipientPk);

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
    <div className="d-flex flex-column w-100 h-100 p-3 overflow-auto">
      <div className="drawer-header">
        <div className="d-flex justify-content-start">
          <button
            className="btn btn-close align-content-center px-1 mt-2 position-absolute"
            onClick={closeDrawer}
            aria-label="close"
          ></button>
          <h4 className="align-content-center text-center w-100 m-0 py-3 font-weight-semibold">
            Mint POAP
          </h4>
        </div>
      </div>

      <div className="drawer-body">
        {mintEvent ? (
          <form name="mintPoapForm" className="signin_validate row g-3" onSubmit={handleSubmit}>
            <div className="col-12">
              <div className="card">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-3">
                    <img className="mr-3 rounded-circle" src={eventNormal} width="48" height="48" alt="" />
                    <div>
                      <h5 className="mb-1" style={{ fontSize: "16px" }}>Event {truncateHex(mintEvent.eventId)}</h5>
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
            </div>

            <div className="col-12 mt-3">
              <label className="form-label">Recipient Public Key (hex)</label>
              <input
                type="text"
                className="form-control"
                placeholder="64-character hex public key"
                name="recipientPkHex"
                value={recipientPkHex}
                onChange={(event) => setRecipientPkHex(event.target.value)}
                required
              />
              <small className="form-text text-muted">
                The Midnight public key of the wallet you're minting to — they don't need to claim
                anything themselves. Ask them for their address from the Wallet page.
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
