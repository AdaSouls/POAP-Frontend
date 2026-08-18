import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { errorFunction } from "../../toasts/sweetAlerts";

// getHolderPk(issuerId) is a per-organizer pseudonym (poap.compact) — deliberately DIFFERENT from
// the caller pk shown as "your address" everywhere else in the app. It's the only value an
// organizer can actually mintTo() a wallet with; sharing the wrong one (the plain address) results
// in an unrecoverable mint — see witnesses.ts's deriveHolderPk comment. This view exists purely so
// a subscriber can generate and copy that value for a specific organizer, out-of-band (chat,
// email, in person) — there's no on-chain "give me this" handshake to automate here.
export default function GetHolderKey() {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();

  const [issuerPkHex, setIssuerPkHex] = useState("");
  const [holderPkHex, setHolderPkHex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!midnight?.provider) return;

    const trimmed = issuerPkHex.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
      errorFunction(
        "Invalid Public Key",
        "Organizer public key must be a 32-byte hex string (64 hex characters).",
        ""
      );
      return;
    }

    setLoading(true);
    setHolderPkHex(null);
    setCopied(false);
    try {
      const issuerIdBytes = Uint8Array.from(Buffer.from(trimmed, "hex"));
      const hex = await midnight.provider.service.getHolderPkHex(issuerIdBytes);
      setHolderPkHex(hex);
    } catch (error) {
      console.error("Error generating holder key:", error);
      errorFunction("Error", error.message || "Failed to generate your key. Please try again.", "");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!holderPkHex) return;
    navigator.clipboard?.writeText(holderPkHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          Get My Key
        </h4>
      </div>

      <div className="drawer-body">
        {midnight?.provider ? (
          <form name="getHolderKeyForm" className="row g-3" onSubmit={handleGenerate}>
            <div className="col-12">
              <label className="form-label" htmlFor="issuerPkHex">Organizer Public Key (hex)</label>
              <input
                id="issuerPkHex"
                type="text"
                className="form-control"
                placeholder="64-character hex public key"
                name="issuerPkHex"
                value={issuerPkHex}
                onChange={(event) => setIssuerPkHex(event.target.value)}
                required
              />
              <small className="form-text text-muted">
                Ask the organizer for their public key — this is different from your own wallet
                address, and is specific to this one organizer only (sharing it with someone else
                doesn't let them link it back to your other POAPs).
              </small>
            </div>

            {holderPkHex && (
              <div className="col-12 mt-3">
                <div className="drawer-modal-preview-card">
                  <p className="m-0 small text-muted mb-1">Your key for this organizer</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <p className="m-0 text-break small font-weight-semibold mr-2">{holderPkHex}</p>
                    <button
                      type="button"
                      className="btn btn-card-detail-action btn-sm flex-shrink-0"
                      onClick={handleCopy}
                      aria-label={copied ? "Copied" : "Copy"}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-muted small mb-0 mt-2">
                    Send this to the organizer — it's what they'll use to mint your POAP to.
                  </p>
                </div>
              </div>
            )}
          </form>
        ) : (
          <div className="alert alert-info" role="alert">
            Connect your wallet first to generate a key.
          </div>
        )}
      </div>

      {midnight?.provider && (
        <div className="drawer-footer">
          <button
            type="submit"
            className="btn btn-gradient btn-block"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate My Key"}
          </button>
        </div>
      )}
    </div>
  );
}
