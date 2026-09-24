import { useEffect, useState } from "react";
import { X, ShieldCheck, CloudUpload, Download, RotateCcw, Copy, Check, Eye, EyeOff } from "lucide-react";
import { useDrawer, useDrawerDispatch } from "../../contexts/drawer/drawer.provider";
import { backupNow, restoreIntoSession } from "../../../midnight/backup";
import { setAutoBackup, subscribeBackupStatus } from "../../../midnight/backup-status";
import { clearCallerPkCache } from "../../contexts/drawer/callerPkCache";
import { getStoredRecoveryCode, markRecoveryCodeSaved } from "../../../midnight/storage-password";
import { useRecoveryCodeSaved } from "../../hooks/useRecoveryCodeSaved";
import RestoreFields from "../../components/RestoreFields";
import loadingGif from "../../../images/loading.gif";

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// Encrypted backup of this wallet's identity (local_sk) and private-attribute drafts — see
// src/midnight/backup.ts. Everything is keyed by the wallet's recovery code (storage-password.ts):
// shown here to save, and asked for when restoring. A restore needs a reconnect, since the running
// session still holds the previous identity.
export default function BackupRestore() {
  const { midnight } = useDrawer();
  const dispatch = useDrawerDispatch();
  const connected = Boolean(midnight?.provider);

  const [status, setStatus] = useState(null);
  useEffect(() => subscribeBackupStatus(setStatus), []);

  const [busy, setBusy] = useState(null); // 'cloud' | 'file' | 'restore'
  const [message, setMessage] = useState(null); // { kind: 'success' | 'error', text }
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [source, setSource] = useState("cloud");
  const [file, setFile] = useState({ name: "", text: "" });
  const [restoreCode, setRestoreCode] = useState("");
  const [restored, setRestored] = useState(false);

  const coinPublicKey = midnight?.provider?.service?.walletCoinPublicKey;
  const recoveryCode = coinPublicKey ? getStoredRecoveryCode(coinPublicKey) : null;
  const codeSaved = useRecoveryCodeSaved(coinPublicKey);
  const [codeVisible, setCodeVisible] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(recoveryCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const downloadCode = () => {
    const text = `AdaSouls recovery code

${recoveryCode}

Keep it private. With it (and your wallet) you can restore your AdaSouls identity in any browser.
`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "adasouls-recovery-code.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const closeDrawer = () => dispatch({ type: "CLOSE_DRAWER" });

  const runBackup = async (target) => {
    setBusy(target);
    setMessage(null);
    try {
      await backupNow({ cloud: target === "cloud", file: target === "file" });
      setMessage({
        kind: "success",
        text: target === "cloud" ? "Backed up to the cloud." : "Encrypted backup file downloaded.",
      });
    } catch (error) {
      setMessage({ kind: "error", text: error.message || "Backup failed." });
    } finally {
      setBusy(null);
    }
  };

  const runRestore = async () => {
    setBusy("restore");
    setMessage(null);
    try {
      await restoreIntoSession(
        restoreCode,
        source === "file" ? { kind: "file", text: file.text } : { kind: "cloud" },
      );
      clearCallerPkCache(midnight.provider.service.walletCoinPublicKey, midnight.provider.contractAddress);
      midnight.disconnect();
      dispatch({ type: "UPDATE_MIDNIGHT_WALLET", payload: null });
      setRestored(true);
    } catch (error) {
      setMessage({ kind: "error", text: error.message || "Restore failed." });
    } finally {
      setBusy(null);
    }
  };

  const reconnect = () => dispatch({ type: "SHOW_MIDNIGHT_WALLET" });

  const statusText = !status
    ? null
    : !status.lastBackupAt
      ? "Not backed up yet."
      : status.dirty
        ? `Last backup ${formatDate(status.lastBackupAt)} — there are changes since then.`
        : `Backed up ${formatDate(status.lastBackupAt)}.`;

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button className="btn wallet-modal-close" onClick={closeDrawer} aria-label="close">
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">
          <ShieldCheck size={16} className="mr-2" style={{ verticalAlign: "-2px" }} />
          Backup &amp; Restore
        </h4>
      </div>

      <div className="drawer-body backup-restore-body">
        {restored ? (
          <div className="alert alert-success mb-0" role="status">
            Backup restored. Connect your wallet again to use the restored identity — this browser now uses
            that recovery code.
          </div>
        ) : !connected ? (
          <p className="text-muted mb-0">Connect your wallet to back up or restore your identity.</p>
        ) : (
          <>
            <p className="text-muted small">
              Your identity (the key behind your POAPs and events) and your private-attribute secrets
              live in this browser and are backed up automatically, encrypted with your recovery code.
              Keep the code somewhere safe: it's what restores everything in another browser.
            </p>

            {recoveryCode && (
              <div className={"recovery-code-box" + (codeSaved ? "" : " is-unsaved")}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="recovery-code-label">Recovery code</span>
                  <span className="d-flex" style={{ gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-card-detail-action btn-sm"
                      onClick={() => setCodeVisible((visible) => !visible)}
                      aria-label={codeVisible ? "Hide recovery code" : "Show recovery code"}
                    >
                      {codeVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button type="button" className="btn btn-card-detail-action btn-sm" onClick={copyCode} aria-label="Copy recovery code">
                      {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button type="button" className="btn btn-card-detail-action btn-sm" onClick={downloadCode} aria-label="Download recovery code">
                      <Download size={14} />
                    </button>
                  </span>
                </div>
                <code className="recovery-code-value">
                  {codeVisible ? recoveryCode : recoveryCode.replace(/[0-9A-Z]/g, "•")}
                </code>
                <div className="form-check form-switch share-toggle-row mt-3 mb-0">
                  <input
                    id="recovery-code-saved"
                    type="checkbox"
                    className="form-check-input"
                    checked={Boolean(codeSaved)}
                    onChange={() => markRecoveryCodeSaved(coinPublicKey)}
                    disabled={Boolean(codeSaved)}
                  />
                  <label htmlFor="recovery-code-saved" className="form-check-label small">
                    I saved my recovery code somewhere safe
                  </label>
                </div>
              </div>
            )}

            <div className={"backup-status" + (status?.lastBackupAt && !status?.dirty ? " is-ok" : " is-warning")}>
              {statusText}
            </div>

            <div className="backup-actions mt-3">
              <button type="button" className="btn btn-card-detail-action btn-sm" onClick={() => runBackup("cloud")} disabled={Boolean(busy)}>
                {busy === "cloud" ? (
                  <img src={loadingGif} width="14" height="14" alt="" className="mr-2" />
                ) : (
                  <CloudUpload size={14} className="mr-2" />
                )}
                Back up to cloud
              </button>
              <button type="button" className="btn btn-card-detail-action btn-sm" onClick={() => runBackup("file")} disabled={Boolean(busy)}>
                {busy === "file" ? (
                  <img src={loadingGif} width="14" height="14" alt="" className="mr-2" />
                ) : (
                  <Download size={14} className="mr-2" />
                )}
                Download encrypted file
              </button>
            </div>

            <div className="form-check form-switch share-toggle-row mt-3 mb-0">
              <input
                id="auto-backup"
                type="checkbox"
                className="form-check-input"
                checked={Boolean(status?.autoBackup)}
                onChange={(event) => setAutoBackup(event.target.checked)}
                disabled={Boolean(busy)}
              />
              <label htmlFor="auto-backup" className="form-check-label small">
                Back up to the cloud automatically when something changes
              </label>
            </div>

            {message && (
              <div className={"alert mt-3 mb-0 " + (message.kind === "success" ? "alert-success" : "alert-danger")} role="status">
                {message.text}
              </div>
            )}

            <hr style={{ marginTop: "18px", marginBottom: "20px" }} />

            {!restoreOpen ? (
              <button type="button" className="btn btn-link btn-sm p-0 d-inline-flex align-items-center align-self-center backup-restore-link" onClick={() => setRestoreOpen(true)}>
                <RotateCcw size={13} className="mr-1" />
                Restore from a backup
              </button>
            ) : (
              <>
                <h6 className="mb-2">Restore from a backup</h6>
                <p className="text-muted small mb-3">
                  This replaces the identity stored in this browser with the one in the backup, and this
                  browser starts using that backup's recovery code. You'll reconnect afterwards.
                </p>
                <RestoreFields
                  source={source}
                  onSourceChange={setSource}
                  fileName={file.name}
                  onFile={(name, text) => setFile({ name, text })}
                  code={restoreCode}
                  onCodeChange={setRestoreCode}
                  disabled={Boolean(busy)}
                />
                <button
                  type="button"
                  className="btn btn-card-detail-action btn-sm mt-3"
                  onClick={runRestore}
                  disabled={Boolean(busy) || !restoreCode.trim() || (source === "file" && !file.text)}
                >
                  {busy === "restore" && <img src={loadingGif} width="14" height="14" alt="" className="mr-2" />}
                  Restore
                </button>
              </>
            )}
          </>
        )}
      </div>

      {restored && (
        <div className="drawer-footer d-flex flex-column">
          <button className="btn btn-gradient" onClick={reconnect}>
            Connect wallet
          </button>
        </div>
      )}
    </div>
  );
}
