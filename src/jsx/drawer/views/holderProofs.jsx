import { useEffect, useState } from "react";
import { X, EyeOff, ShieldCheck } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../../contexts/drawer/drawer.provider";
import { errorFunction, loadingFunction, succesfullBlockchainCreation } from "../../toasts/sweetAlerts";
import {
  listAnswerableRequests,
  proveAttendance,
  proveAttribute,
  valueQualifies,
} from "../../../midnight/holder-proofs";
import ProofReceipt from "../../components/ProofReceipt";
import loadingGif from "../../../images/loading.gif";

const PROGRESS_TITLE = "Proving";

const questionFor = (item) =>
  item.kind === "attendance"
    ? "Holds a valid POAP of this event"
    : item.members
      ? `${item.label} is one of: ${item.members.join(", ")}`
      : `${item.label} (accepted values not published)`;

// Anonymous proofs from the holder's own POAP (poapCard.jsx → SHOW_HOLDER_PROOFS). Lists the
// requests published for this event that the holder can answer — plain ones (attendance) and ones
// about one of the credential's private fields — and answers them with one signature each. The
// holder never publishes a request here, so nothing ties the proof to their caller_pk. Ends in the
// shared receipt (B8). Logic: src/midnight/holder-proofs.ts.
export default function HolderProofs() {
  const { midnight, holderProofsContext: ctx } = useDrawer();
  const dispatch = useDrawerDispatch();
  const service = midnight?.provider?.service;

  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (!ctx || !service) return undefined;
    let cancelled = false;
    listAnswerableRequests(ctx.token.eventId, ctx.credentialFields || [])
      .then((found) => {
        if (!cancelled) setItems(found);
      })
      .catch((error) => {
        console.error("Error loading requests:", error);
        if (!cancelled) setLoadError(error);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx, service]);

  const closeDrawer = () => dispatch({ type: "CLOSE_DRAWER" });

  const answer = async (item) => {
    setBusyId(item.request.requestId);
    try {
      loadingFunction(PROGRESS_TITLE, "Preparing transaction…", "");
      const { txHash } =
        item.kind === "attendance"
          ? await proveAttendance(service, ctx.token, item.request.requestId, ctx.pkg)
          : await proveAttribute(service, ctx.token, item.request, item.members, ctx.pkg);
      setReceipt({
        kind: item.kind === "attendance" ? "proveEventAttendance" : "proveCredentialAttribute",
        question: questionFor(item),
        txHash,
        provenAt: new Date(),
      });
      succesfullBlockchainCreation("Proof Submitted", txHash ? `Transaction: ${txHash}` : "", "");
    } catch (error) {
      console.error("Error proving:", error);
      errorFunction("Error", error.message || "The proof failed. Please try again.", "");
    } finally {
      setBusyId(null);
    }
  };

  const organizerLabel = (verifierPk) => (verifierPk === ctx?.token.issuerPk ? "the organizer" : "someone else");

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button className="btn wallet-modal-close" onClick={closeDrawer} aria-label="close">
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">Anonymous Proofs</h4>
      </div>

      <div className="drawer-body">
        {!service ? (
          <div className="alert alert-info" role="alert">
            Connect your wallet first.
          </div>
        ) : !ctx ? null : receipt ? (
          <ProofReceipt {...receipt} eventName={ctx.eventName} />
        ) : (
          <div className="d-flex flex-column" style={{ gap: "12px" }}>
            <div className="info-hint-card m-0">
              <EyeOff size={16} />
              <p>
                These proofs reveal neither which POAP is yours nor your wallet — only that the
                holder of <em>some</em> valid POAP of this event answered. Each one takes one
                signature.
              </p>
            </div>

            {loadError ? (
              <div className="alert alert-danger m-0" role="alert">
                Could not load the requests for this event. Try again in a moment.
              </div>
            ) : !items ? (
              <p className="text-muted small m-0 d-flex align-items-center">
                <img src={loadingGif} width="14" height="14" alt="" className="mr-2" />
                Looking for requests on this event…
              </p>
            ) : items.length === 0 ? (
              <p className="text-muted small m-0">
                Nobody has asked for a proof on this event yet. The organizer can publish one from
                their event card (Ask for Proof of Ownership, or Ask for a Disclosure on a private field).
              </p>
            ) : (
              <ul className="list-unstyled m-0 d-flex flex-column" style={{ gap: "10px" }}>
                {items.map((item) => {
                  const isAttribute = item.kind === "attribute";
                  const qualifies = isAttribute ? valueQualifies(ctx.pkg, item.request.fieldId, item.members) : true;
                  const hasValue = !isAttribute || Boolean(ctx.pkg?.fields.some((f) => f.fieldId === item.request.fieldId));
                  const reason = !isAttribute
                    ? null
                    : !item.members
                      ? "The accepted values for this question aren't available."
                      : !hasValue
                        ? "Your credential has no value for this field."
                        : !qualifies
                          ? "Your value isn't one of the accepted ones."
                          : null;
                  return (
                    <li key={item.request.requestId} className="holder-proof-item">
                      <div>
                        <p className="m-0 small font-weight-semibold">{questionFor(item)}</p>
                        <p className="m-0 small text-muted">Asked by {organizerLabel(item.request.verifierPk)}</p>
                        {reason && <p className="m-0 small text-warning">{reason}</p>}
                      </div>
                      <button
                        type="button"
                        className="btn btn-card-detail-action btn-sm flex-shrink-0"
                        onClick={() => answer(item)}
                        disabled={Boolean(busyId) || Boolean(reason)}
                      >
                        <ShieldCheck size={14} className="mr-2" />
                        {busyId === item.request.requestId ? "Proving…" : "Prove"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="drawer-footer d-flex flex-column">
        <button className="btn btn-card-detail-action" onClick={closeDrawer}>
          {receipt ? "Done" : "Close"}
        </button>
      </div>
    </div>
  );
}
