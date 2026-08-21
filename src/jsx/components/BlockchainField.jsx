import { Check, Copy, Info } from "lucide-react";

// One label+value row in an expanded card's raw blockchain-data block (Event ID / Organizer /
// Block / Tx in eventCard.jsx, Token ID / Issuer / Event ID / Block / Tx in poapCard.jsx). Renders
// nothing for a missing value so callers don't need their own conditional (see any Tx field, which
// isn't always present). The label carries the visual weight (bold, uppercase, small) so it reads
// as the primary cue and the hex value as supporting detail. The copy button (when supplied) sits
// directly in the row next to the value instead of pinned to the far edge of a flex-grow paragraph,
// so it stays visually attached to what it copies even once the hex wraps across multiple lines.
export default function BlockchainField({ label, value, onCopy, copied, hint, copyAriaLabel }) {
  if (!value) return null;
  const copyButton = onCopy && (
    <button
      type="button"
      className="btn btn-card-detail-action btn-sm blockchain-field-copy"
      onClick={(e) => {
        e.stopPropagation();
        onCopy();
      }}
      aria-label={copied ? "Copied" : copyAriaLabel || `Copy ${label}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
  return (
    <div className="blockchain-field">
      <div className="blockchain-field-row">
        <p className="blockchain-field-value">
          <span className="blockchain-field-label">{label}:</span> {value}
        </p>
        {/* When there's a hint, the copy button lives there instead (see below) — right-margined
            in that same box rather than sitting next to the raw hex up here. */}
        {!hint && copyButton}
      </div>
      {hint && (
        <div className="info-hint-card">
          <Info size={18} />
          <p>{hint}</p>
          {copyButton}
        </div>
      )}
    </div>
  );
}
