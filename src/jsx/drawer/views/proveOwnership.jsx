import { useEffect, useState } from "react";
import { X, Info } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../../contexts/drawer/drawer.provider";
import { errorFunction, loadingFunction, succesfullBlockchainCreation } from "../../toasts/sweetAlerts";
import { findOwnershipRequest, proveOwnership } from "../../../midnight/ownership-proof";
import ProofReceipt from "../../components/ProofReceipt";
import loadingGif from "../../../images/loading.gif";

const PROGRESS_TITLE = "Proving Ownership";

// B6 — opened from poapCard.jsx's expanded view (SHOW_PROVE_OWNERSHIP, payload = the token). Looks
// up a request to prove against first (ownership-proof.ts), so the user sees whether it takes one
// signature or two — and, for two, that publishing the request ties this wallet to the token —
// before signing anything. The result stays in the popup: it's what the holder shows.
export default function ProveOwnership() {
  const { midnight, ownershipProof: token } = useDrawer();
  const dispatch = useDrawerDispatch();
  const myPkHex = midnight?.provider?.address;

  const [choice, setChoice] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!token || !myPkHex) return undefined;
    let cancelled = false;
    findOwnershipRequest({ eventIdHex: token.eventId, organizerPkHex: token.issuerPkHex, myPkHex })
      .then((found) => {
        if (!cancelled) setChoice(found);
      })
      .catch((error) => {
        console.error("Error looking up disclosure requests:", error);
        if (!cancelled) setLookupError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [token, myPkHex]);

  const closeDrawer = () => dispatch({ type: "CLOSE_DRAWER" });

  const handleProve = async () => {
    if (!midnight?.provider || !token || !choice) return;
    setSubmitting(true);
    try {
      const proof = await proveOwnership({
        service: midnight.provider.service,
        tokenId: token.tokenId,
        eventIdHex: token.eventId,
        choice,
        onStep: (step) =>
          loadingFunction(
            PROGRESS_TITLE,
            step === "publish" ? "Publishing the proof request (1 of 2)…" : choice.requestId ? "Preparing transaction…" : "Generating the proof (2 of 2)…",
          ),
      });
      setResult({ ...proof, provenAt: new Date() });
      succesfullBlockchainCreation("Ownership Proven", proof.txHash ? `Transaction: ${proof.txHash}` : "", "");
    } catch (error) {
      console.error("Error proving ownership:", error);
      errorFunction("Error", error.message || "Failed to prove ownership. Please try again.", "");
    } finally {
      setSubmitting(false);
    }
  };

  const signatures = choice?.source === "new" ? 2 : 1;

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button className="btn wallet-modal-close" onClick={closeDrawer} aria-label="close">
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">Prove I Own This POAP</h4>
      </div>

      <div className="drawer-body">
        {!midnight?.provider ? (
          <div className="alert alert-info" role="alert">
            Connect your wallet first to prove ownership.
          </div>
        ) : !token ? null : result ? (
          <ProofReceipt
            kind="proveTokenOwnership"
            question={`Owns POAP #${String(token.tokenId)}`}
            eventName={token.eventName}
            tokenId={token.tokenId}
            txHash={result.txHash}
            provenAt={result.provenAt}
          />
        ) : (
          <>
            <p className="text-muted small mb-3">
              Creates a public, ZK-proved transaction showing that the holder of this POAP made it.
              Anyone can check it on the explorer; your wallet address is not revealed.
            </p>

            <div className="info-hint-card mb-3">
              <Info size={16} />
              <p>
                The proof names this token (#{String(token.tokenId)}), so it shows that <em>this</em> POAP
                has a holder who can prove it — not just that someone attended the event.
              </p>
            </div>

            {lookupError ? (
              <div className="alert alert-danger mb-0" role="alert">
                Could not check for existing proof requests. Try again in a moment.
              </div>
            ) : !choice ? (
              <p className="text-muted small mb-0 d-flex align-items-center">
                <img src={loadingGif} width="14" height="14" alt="" className="mr-2" />
                Checking for an existing proof request…
              </p>
            ) : choice.source === "new" ? (
              <div className="info-hint-card is-warning mb-0">
                <Info size={16} />
                <p>
                  Nobody has asked for a proof on this event yet, so your wallet publishes the request
                  first: <strong>2 signatures</strong>. That request carries your wallet's public ID (the
                  same one shown as organizer on events you create), so together with the proof it links
                  that ID to this token.
                </p>
              </div>
            ) : (
              <p className="text-muted small mb-0">
                Uses the request {choice.source === "organizer" ? "the organizer published" : "you published earlier"}:{" "}
                <strong className="text-white">1 signature</strong>.
              </p>
            )}
          </>
        )}
      </div>

      <div className="drawer-footer d-flex flex-column">
        {result ? (
          <button className="btn btn-card-detail-action" onClick={closeDrawer}>
            Done
          </button>
        ) : (
          <button
            className="btn btn-gradient"
            onClick={handleProve}
            disabled={!midnight?.provider || !choice || submitting || token?.isBurned}
          >
            {submitting ? "Proving…" : `Generate Proof${choice ? ` (${signatures} signature${signatures > 1 ? "s" : ""})` : ""}`}
          </button>
        )}
      </div>
    </div>
  );
}
