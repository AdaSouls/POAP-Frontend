import { Cloud, FileText } from "lucide-react";

// Backup source + recovery code, shared by the wallet popup's identity step (restore instead of
// continuing as new) and the Backup & Restore popup. Controlled: the parent owns every value.
export default function RestoreFields({ source, onSourceChange, fileName, onFile, code, onCodeChange, disabled }) {
  const readFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => onFile(file.name, text));
  };

  return (
    <div className="restore-fields">
      <div className="restore-source-toggle" role="radiogroup" aria-label="Backup source">
        <button
          type="button"
          role="radio"
          aria-checked={source === "cloud"}
          className={"restore-source-option" + (source === "cloud" ? " is-selected" : "")}
          onClick={() => onSourceChange("cloud")}
          disabled={disabled}
        >
          <Cloud size={14} className="mr-2" />
          Cloud backup
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={source === "file"}
          className={"restore-source-option" + (source === "file" ? " is-selected" : "")}
          onClick={() => onSourceChange("file")}
          disabled={disabled}
        >
          <FileText size={14} className="mr-2" />
          Backup file
        </button>
      </div>

      {source === "file" && (
        <div className="form-group mt-3 mb-0">
          <label className="restore-file-label mb-0">
            <input type="file" accept="application/json,.json" onChange={readFile} disabled={disabled} hidden />
            <span className="btn btn-card-detail-action btn-sm">Choose file</span>
            <span className="ml-2 text-muted small">{fileName || "No file selected"}</span>
          </label>
        </div>
      )}

      <div className="form-group mt-3 mb-0">
        <label htmlFor="restore-code" className="mb-1">
          Recovery code
        </label>
        <input
          id="restore-code"
          type="text"
          className="form-control recovery-code-input"
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
