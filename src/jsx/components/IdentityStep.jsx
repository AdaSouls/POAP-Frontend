import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { submitPassword } from "../../midnight/storage-password";
import RestoreFields from "./RestoreFields";
import loadingGif from "../../images/loading.gif";

// Shown inside the wallet popup only when this browser has no key for the wallet being connected
// (private-state-unlock.ts): 'welcome' — first time here, continue as new or restore with a recovery
// code; 'locked' — an identity is stored but its key is missing, so restore it (or, as a last
// resort, start over). Every other connect is silent.
export default function IdentityStep({ request }) {
  const { mode, error } = request;
  const [restoring, setRestoring] = useState(mode === "locked");
  const [confirmStartOver, setConfirmStartOver] = useState(false);
  const [source, setSource] = useState("cloud");
  const [file, setFile] = useState({ name: "", text: "" });
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // A new request (retry after an error) means the last answer was handled.
  useEffect(() => {
    setSubmitting(false);
  }, [request]);

  const canRestore = code.trim() && (source === "cloud" || file.text);

  const continueAsNew = () => {
    setSubmitting(true);
    submitPassword({ kind: "new" });
  };

  const onRestore = (event) => {
    event.preventDefault();
    if (!canRestore || submitting) return;
    setSubmitting(true);
    submitPassword({
      kind: "restore",
      password: code,
      source: source === "file" ? { kind: "file", text: file.text } : { kind: "cloud" },
    });
  };

  const spinner = <img src={loadingGif} width="16" height="16" alt="" className="mr-2" />;

  return (
    <div className="password-step">
      <div className="password-step-header d-flex align-items-center mb-2">
        <KeyRound size={18} className="mr-2" />
        <h5 className="mb-0">
          {mode === "locked" ? "Restore your identity" : restoring ? "Restore from a backup" : "Welcome to AdaSouls"}
        </h5>
      </div>

      {!restoring ? (
        <>
          <p className="text-muted small mb-3">
            First time using this wallet in this browser. AdaSouls will create your identity and back it
            up automatically — you'll get a recovery code to keep.
          </p>
          <button type="button" className="btn btn-gradient w-100" onClick={continueAsNew} disabled={submitting}>
            {submitting ? <span className="d-flex align-items-center justify-content-center">{spinner}Setting up</span> : "Continue"}
          </button>
          <button
            type="button"
            className="btn btn-link btn-sm w-100 mt-1 password-step-switch"
            onClick={() => setRestoring(true)}
            disabled={submitting}
          >
            I used AdaSouls before — restore with my recovery code
          </button>
        </>
      ) : (
        <form onSubmit={onRestore} noValidate>
          <p className="text-muted small mb-3">
            {mode === "locked"
              ? "This browser has an identity for this wallet, but not the key to open it. Enter your recovery code to restore it from your backup."
              : "Enter the recovery code you saved to bring back your identity from its backup."}
          </p>
          <RestoreFields
            source={source}
            onSourceChange={setSource}
            fileName={file.name}
            onFile={(name, text) => setFile({ name, text })}
            code={code}
            onCodeChange={setCode}
            disabled={submitting}
          />

          {error && (
            <div className="alert alert-danger mt-3 mb-0" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-gradient w-100 mt-3" disabled={!canRestore || submitting}>
            {submitting ? <span className="d-flex align-items-center justify-content-center">{spinner}Restoring</span> : "Restore"}
          </button>

          {mode === "welcome" ? (
            <button
              type="button"
              className="btn btn-link btn-sm w-100 mt-1 password-step-switch"
              onClick={() => setRestoring(false)}
              disabled={submitting}
            >
              Back
            </button>
          ) : !confirmStartOver ? (
            <button
              type="button"
              className="btn btn-link btn-sm w-100 mt-1 password-step-switch"
              onClick={() => setConfirmStartOver(true)}
              disabled={submitting}
            >
              I don't have my recovery code
            </button>
          ) : (
            <div className="alert alert-warning mt-3 mb-0">
              <p className="small mb-2">
                Without the recovery code, the identity stored here can't be opened. Starting over creates a new
                identity: POAPs and events tied to the old one won't show up for this wallet anymore.
              </p>
              <button type="button" className="btn btn-card-detail-action btn-sm" onClick={continueAsNew} disabled={submitting}>
                Start over with a new identity
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
