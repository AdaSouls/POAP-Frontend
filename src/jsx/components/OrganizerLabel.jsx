import { ShieldCheck } from "lucide-react";
import Tooltip from "./Tooltip";

// How an organizer is named on event and credential cards. The display name is self-declared (the
// event metadata's organization.name, editable by its organizer), so it's never the identity on its
// own: the short organizer-key id next to it stays the same across all of that organizer's events
// whatever the name says, and "Verified" appears only for keys the admin registered in the
// contract's issuers registry (useIssuerRegistry). See docs/organizer-profile-design.md.
export function shortKeyId(pkHex) {
  return pkHex ? pkHex.slice(0, 6) : "";
}

// No name: the key itself, in the same shortened form the cards always used.
function truncatedKey(pkHex) {
  return pkHex ? `${pkHex.slice(0, 8)}…${pkHex.slice(-6)}` : "N/A";
}

export default function OrganizerLabel({ name, issuerPk, verified = false, className = "text-white" }) {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return (
    <span className="organizer-label">
      <span className={className}>{trimmed || truncatedKey(issuerPk)}</span>
      {trimmed && issuerPk && (
        <Tooltip label={`Organizer key ${issuerPk}`} multiline>
          <span className="organizer-label-key">· {shortKeyId(issuerPk)}</span>
        </Tooltip>
      )}
      {verified && (
        <Tooltip label="Registered by the Velum admin after checking who this organizer is." multiline>
          <span className="organizer-label-verified">
            <ShieldCheck size={11} />
            Verified
          </span>
        </Tooltip>
      )}
    </span>
  );
}
