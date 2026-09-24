import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Award, BadgeCheck, CircleAlert, ExternalLink, Search } from "lucide-react";
import Layout from "../layout/layout";
import { lookupProofTransaction, PROOF_KINDS } from "../../midnight/proof-verification";
import { decodeProofDetails, isZeroHex } from "../../midnight/proof-transcript";
import { getEvent, getToken } from "../../midnight/indexer.service";
import { fetchMetadata } from "../hooks/useEventMetadata";
import { explorerBlockUrl, explorerTxUrl } from "../../utils/midnightExplorer";

const truncateHex = (hex) => (hex ? `${hex.slice(0, 10)}…${hex.slice(-8)}` : "N/A");

// What the proof was about, in words — built from what the transaction itself disclosed
// (proof-transcript.ts) plus the event's public metadata. Never from the receipt.
function questionFor(entryPoint, details, context) {
  if (entryPoint === "proveTokenOwnership") return `Owns POAP #${String(details.tokenId)} of this event`;
  if (entryPoint === "proveEventAttendance") return "Holds a valid POAP of this event (which one isn't revealed)";
  const label = context?.fieldLabel || "A private detail";
  const scope = entryPoint === "proveCredentialAttribute" ? "" : " of the event";
  return context?.members
    ? `${label}${scope} is one of: ${context.members.join(", ")}`
    : `${label}${scope} is one of the accepted values (list not published)`;
}

// Event, token and question context for a decoded proof. Every lookup is best-effort: the proof
// is valid on its own; this only puts names on it.
async function loadProofContext(entryPoint, details) {
  const event = await getEvent(details.eventId).catch(() => null);
  const metadata = event?.metadataURI ? await fetchMetadata(event.metadataURI) : null;
  const token = details.tokenId !== null ? await getToken(details.tokenId).catch(() => null) : null;

  let fieldLabel = null;
  let members = null;
  if (!isZeroHex(details.fieldId)) {
    const fields =
      entryPoint === "proveCredentialAttribute" ? metadata?.credentialAttributeFields : metadata?.privateAttributeFields;
    fieldLabel = (fields || []).find((field) => field.fieldId?.toLowerCase() === details.fieldId)?.label || null;
  }
  if (!isZeroHex(details.setRoot)) {
    // holder-proofs pulls in the compiled contract — only load it when a set has to be checked.
    const { fetchRequestSet } = await import("../../midnight/holder-proofs");
    members = await fetchRequestSet(details.requestId, details.setRoot).catch(() => null);
  }
  return { event, metadata, token, fieldLabel, members };
}

// B8 — public check of a proof receipt (ProofReceipt.jsx's verify link). No wallet: reads the
// transaction straight from the Midnight indexer, and what it proved from its own transcript.
export default function VerifyProof() {
  const [searchParams] = useSearchParams();
  const [txHash, setTxHash] = useState(searchParams.get("tx") || "");
  const [submitted, setSubmitted] = useState(searchParams.get("tx") || "");
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(null);
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const contractAddress = process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS;

  useEffect(() => {
    if (!submitted) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    setDetails(null);
    setContext(null);
    lookupProofTransaction(submitted.trim(), contractAddress)
      .then(async (found) => {
        if (cancelled) return;
        setResult(found);
        const isProof = found.status === "found" && found.isOurContract && PROOF_KINDS[found.entryPoint]?.isProof;
        if (!isProof || !found.raw) return;
        const decoded = await decodeProofDetails(found.raw, contractAddress).catch((decodeError) => {
          console.error("Could not read the proof's details from the transaction:", decodeError);
          return null;
        });
        if (cancelled || !decoded) return;
        setDetails(decoded);
        const loaded = await loadProofContext(found.entryPoint, decoded);
        if (!cancelled) setContext(loaded);
      })
      .catch((lookupError) => {
        if (!cancelled) setError(lookupError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submitted, contractAddress]);

  const kind = result?.status === "found" ? PROOF_KINDS[result.entryPoint] : null;
  const valid = result?.status === "found" && result.isOurContract && kind?.isProof && result.succeeded !== false;
  const event = context?.event;
  const metadata = context?.metadata;
  const token = context?.token;
  const askedByOrganizer = details && event && details.verifierPk === event.issuerPk?.toLowerCase();

  const verifyForm = (
    <form
      className="d-flex w-100"
      style={{ gap: "8px" }}
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        setSubmitted(txHash);
      }}
    >
      <input
        id="verifyTxHash"
        type="text"
        className="form-control"
        placeholder="Transaction hash from the proof receipt"
        value={txHash}
        onChange={(changeEvent) => setTxHash(changeEvent.target.value)}
      />
      <button type="submit" className="btn btn-gradient flex-shrink-0" disabled={!txHash.trim() || loading}>
        <Search size={14} className="mr-2" />
        Verify
      </button>
    </form>
  );

  const found = result?.status === "found";

  return (
    <Layout>
      <div className="verify-proof-page">
        <div className="drawer-modal-preview-card verify-proof-card">
          {!found && (
            <div className="verify-proof-heading">
              <BadgeCheck size={96} strokeWidth={1.25} className="text-muted" />
              <p className="m-0 verify-proof-title">Verify a Proof</p>
              <p className="m-0 text-muted small">
                Paste the transaction hash from a proof receipt. No wallet needed: the proof is checked on
                the Midnight network.
              </p>
            </div>
          )}

          {found && (
            <>
              <div className="verify-proof-heading">
                {valid ? (
                  <BadgeCheck size={128} strokeWidth={1.25} className="poap-verified-seal-icon" />
                ) : (
                  <CircleAlert size={128} strokeWidth={1.25} className="text-warning" />
                )}
                <p className="m-0 verify-proof-title">
                  {valid
                    ? kind.title
                    : result.isOurContract && kind?.isProof
                      ? "Failed transaction"
                      : result.isOurContract
                        ? "Not a proof"
                        : "Not an AdaSouls POAP transaction"}
                </p>
                {valid && <span className="badge verify-proof-valid-badge">Valid proof</span>}
                <p className="m-0 text-muted">
                  {valid
                    ? kind.description
                    : result.isOurContract && kind?.isProof
                      ? "The transaction was recorded but did not succeed, so it proves nothing."
                      : result.isOurContract
                        ? `This transaction called "${result.entryPoint}", which doesn't prove anything about a POAP.`
                        : "This transaction exists, but it doesn't call the AdaSouls POAP contract."}
                </p>
              </div>

              {valid && details && (
                <div className="verify-proof-event">
                  <div className="verify-proof-event-thumb">
                    {metadata?.imageUrl ? <img src={metadata.imageUrl} alt="" /> : <Award size={28} className="text-muted" />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="m-0 small text-muted">Event</p>
                    <p className="m-0 font-weight-semibold text-truncate">
                      {metadata?.name || (context ? `Event ${truncateHex(details.eventId)}` : "Loading…")}
                    </p>
                    {metadata?.organization?.name && (
                      <p className="m-0 small text-muted text-truncate">by {metadata.organization.name}</p>
                    )}
                  </div>
                </div>
              )}

              <dl className="proof-receipt-facts verify-proof-facts m-0">
                {valid && details && (
                  <>
                    <dt>Proven</dt>
                    <dd>{questionFor(result.entryPoint, details, context)}</dd>
                    {details.tokenId !== null && (
                      <>
                        <dt>Token</dt>
                        <dd>
                          #{String(details.tokenId)}
                          {token && (
                            <span className={token.isBurned ? "text-warning" : "text-muted"}>
                              {token.isBurned ? ` · revoked since block ${token.burnedBlock ?? "N/A"}` : " · still held today"}
                            </span>
                          )}
                        </dd>
                      </>
                    )}
                    <dt>Asked by</dt>
                    <dd title={details.verifierPk}>
                      {askedByOrganizer ? "The event's organizer" : `Someone else (${truncateHex(details.verifierPk)})`}
                    </dd>
                  </>
                )}
                <dt>When</dt>
                <dd>{result.timestamp ? new Date(result.timestamp).toLocaleString() : "N/A"}</dd>
                <dt>Block</dt>
                <dd>
                  {result.blockHeight !== null ? (
                    <a href={explorerBlockUrl(result.blockHeight)} target="_blank" rel="noopener noreferrer" className="text-white">
                      {result.blockHeight} <ExternalLink size={12} />
                    </a>
                  ) : (
                    "N/A"
                  )}
                </dd>
                <dt>Transaction</dt>
                <dd>
                  <a href={explorerTxUrl(result.hash)} target="_blank" rel="noopener noreferrer" className="text-white">
                    {truncateHex(result.hash)} <ExternalLink size={12} />
                  </a>
                </dd>
                {valid && details && (
                  <>
                    <dt>Event ID</dt>
                    <dd title={details.eventId}>{truncateHex(details.eventId)}</dd>
                    <dt>Request ID</dt>
                    <dd title={details.requestId}>{truncateHex(details.requestId)}</dd>
                  </>
                )}
                {result.entryPoint && (
                  <>
                    <dt>Circuit</dt>
                    <dd>{result.entryPoint}</dd>
                  </>
                )}
                <dt>Contract</dt>
                <dd title={contractAddress}>{truncateHex(contractAddress)}</dd>
              </dl>

              {valid && (
                <p className="text-muted small m-0 text-center">
                  A proof only reaches the chain if it's correct, so a confirmed transaction is the proof. It
                  shows the holder had this POAP at that moment; ask for a new proof to check they still do.
                </p>
              )}
            </>
          )}

          {loading && !result && <p className="text-muted small m-0 text-center">Checking on the Midnight network…</p>}
          {error && (
            <div className="alert alert-danger m-0" role="alert">
              {error}
            </div>
          )}
          {result?.status === "not-found" && (
            <div className="alert alert-danger m-0" role="alert">
              No transaction with this hash exists on this network. The proof is not valid here.
            </div>
          )}

          <div className="verify-proof-footer">
            {found && <p className="m-0 small text-muted">Verify another proof</p>}
            {verifyForm}
          </div>
        </div>
      </div>
    </Layout>
  );
}
