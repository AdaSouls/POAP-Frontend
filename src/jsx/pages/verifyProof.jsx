import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BadgeCheck, CircleAlert, ExternalLink } from "lucide-react";
import Layout from "../layout/layout";
import { lookupProofTransaction, PROOF_KINDS } from "../../midnight/proof-verification";
import { explorerTxUrl } from "../../utils/midnightExplorer";

// B8 — public check of a proof receipt (ProofReceipt.jsx's verify link). No wallet: reads the
// transaction straight from the Midnight indexer. See proof-verification.ts for what it can and
// can't confirm.
export default function VerifyProof() {
  const [searchParams] = useSearchParams();
  const [txHash, setTxHash] = useState(searchParams.get("tx") || "");
  const [submitted, setSubmitted] = useState(searchParams.get("tx") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!submitted) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    lookupProofTransaction(submitted.trim(), process.env.REACT_APP_MIDNIGHT_CONTRACT_ADDRESS)
      .then((found) => {
        if (!cancelled) setResult(found);
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
  }, [submitted]);

  const kind = result?.status === "found" ? PROOF_KINDS[result.entryPoint] : null;
  const valid = result?.status === "found" && result.isOurContract && kind?.isProof;

  return (
    <Layout>
      <div>
        <div className="inner-header">
          <div className="inner-header-row">
            <h4 className="m-0">Verify a Proof</h4>
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-lg-8 d-flex flex-column" style={{ gap: "16px" }}>
            <form
              className="d-flex"
              style={{ gap: "8px" }}
              onSubmit={(event) => {
                event.preventDefault();
                setSubmitted(txHash);
              }}
            >
              <input
                id="verifyTxHash"
                type="text"
                className="form-control"
                placeholder="Transaction hash from the proof receipt"
                value={txHash}
                onChange={(event) => setTxHash(event.target.value)}
              />
              <button type="submit" className="btn btn-gradient flex-shrink-0" disabled={!txHash.trim() || loading}>
                Verify
              </button>
            </form>

            {loading && <p className="text-muted small m-0">Checking on the Midnight network…</p>}
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
            {result?.status === "found" && (
              <div className="drawer-modal-preview-card">
                <div className="d-flex align-items-center mb-3" style={{ gap: "12px" }}>
                  {valid ? (
                    <BadgeCheck size={32} className="poap-verified-seal-icon flex-shrink-0" />
                  ) : (
                    <CircleAlert size={32} className="text-warning flex-shrink-0" />
                  )}
                  <div>
                    <p className="m-0 font-weight-semibold">
                      {valid ? `Valid: ${kind.title}` : result.isOurContract ? "Not a proof" : "Not an AdaSouls POAP transaction"}
                    </p>
                    <p className="m-0 text-muted small">
                      {valid
                        ? kind.description
                        : result.isOurContract
                          ? `This transaction called "${result.entryPoint}", which doesn't prove anything about a POAP.`
                          : "This transaction exists, but it doesn't call the AdaSouls POAP contract."}
                    </p>
                  </div>
                </div>
                <ul className="list-unstyled small mb-0">
                  <li className="mb-1">
                    <span className="text-muted">Confirmed in block </span>
                    <span className="text-white">{result.blockHeight ?? "N/A"}</span>
                    {result.timestamp && (
                      <span className="text-muted"> · {new Date(result.timestamp).toLocaleString()}</span>
                    )}
                  </li>
                  <li className="mb-1">
                    <span className="text-muted">Transaction </span>
                    <a href={explorerTxUrl(result.hash)} target="_blank" rel="noopener noreferrer" className="text-white text-break">
                      {result.hash} <ExternalLink size={12} />
                    </a>
                  </li>
                </ul>
                {valid && (
                  <p className="text-muted small mt-3 mb-0">
                    A proof only reaches the chain if it's correct, so a confirmed transaction is the
                    proof. Check that the time matches when you asked, and that the question on the
                    receipt is yours.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
