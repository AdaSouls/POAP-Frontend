import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../layout/layout";
import { useDrawer } from "../contexts/drawer/drawer.provider";
import { getDisclosureRequest } from "../../midnight/indexer.service";
import { getPrivateAttributeDraft } from "../../midnight/private-attribute-drafts";
import { buildAndSubmitDisclosureProof } from "../../midnight/disclosure-response";
import { errorFunction, loadingFunction, succesfullBlockchainCreation } from "../toasts/sweetAlerts";

const truncateHex = (hex) => `${hex.slice(0, 8)}…${hex.slice(-6)}`;

// Direct-link entry point for responding to a disclosure request (see
// publishDisclosureRequest.jsx, which generates this URL). Wrapped in <Layout> and gated on wallet
// connection — unlike sharedCollection.jsx's walletless design, this flow needs the organizer's own
// wallet + localStorage drafts to do anything at all (see docs/selective-disclosure-ui-design.md).
export default function DisclosureRespond() {
  const { midnight } = useDrawer();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId");
  const membersParam = searchParams.get("members");
  // Raw candidate values, URI-decoded — see publishDisclosureRequest.jsx's comment on why the link
  // carries these instead of pre-encoded hex (re-encoding happens once, here, via
  // disclosure-response.ts's own encodeAttributeValue call).
  const members = membersParam ? membersParam.split(",").map(decodeURIComponent) : [];

  const [request, setRequest] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [once, setOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState(null);

  useEffect(() => {
    if (!requestId) return undefined;
    let cancelled = false;
    getDisclosureRequest(requestId)
      .then((found) => {
        if (!cancelled) setRequest(found);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const draft = request ? getPrivateAttributeDraft(request.eventId, request.fieldId) : null;

  const handleRespond = async () => {
    if (!midnight?.provider || !request) return;
    setSubmitting(true);
    try {
      loadingFunction("Responding", `Please confirm the transaction in your ${midnight.provider.wallet} wallet…`, "");
      const result = await buildAndSubmitDisclosureProof({
        service: midnight.provider.service,
        requestId: Uint8Array.from(Buffer.from(requestId, "hex")),
        eventId: Uint8Array.from(Buffer.from(request.eventId, "hex")),
        fieldId: Uint8Array.from(Buffer.from(request.fieldId, "hex")),
        members,
        once,
      });
      setTxHash(result.txHash);
      succesfullBlockchainCreation("Disclosure Response Submitted", `Transaction: ${result.txHash}`, "");
    } catch (error) {
      console.error("Error responding to disclosure request:", error);
      errorFunction("Error", error.message || "Failed to respond. Please try again.", "");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="role-organizer">
        <div className="inner-header">
          <div className="inner-header-row">
            <h4 className="m-0">Respond to Disclosure Request</h4>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {!requestId ? (
              <div className="alert alert-danger" role="alert">
                Missing requestId in the link.
              </div>
            ) : !midnight?.provider ? (
              <div className="alert alert-info" role="alert">
                Connect your wallet first to respond.
              </div>
            ) : loadError ? (
              <div className="alert alert-danger" role="alert">
                Could not find this disclosure request.
              </div>
            ) : !request ? (
              <p className="text-muted small">Loading…</p>
            ) : !draft ? (
              <div className="alert alert-info" role="alert">
                You don't hold this attribute — no local draft found for this event/field on this
                browser.
              </div>
            ) : txHash ? (
              <div className="alert alert-success" role="alert">
                Response submitted. Transaction: {txHash}
              </div>
            ) : (
              <div className="drawer-modal-preview-card">
                <p className="m-0 small text-muted mb-3">
                  Event {truncateHex(request.eventId)} · Attribute{" "}
                  <span className="text-white">{draft.fieldName}</span>
                </p>
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="onceSwitch"
                    checked={once}
                    onChange={(event) => setOnce(event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="onceSwitch">
                    Single-use — record a nullifier so this request can only be answered once
                  </label>
                </div>
                <button
                  type="button"
                  className="btn btn-gradient"
                  onClick={handleRespond}
                  disabled={submitting}
                >
                  {submitting ? "Responding…" : "Respond"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
