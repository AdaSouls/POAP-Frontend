import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import {
  errorFunction,
  loadingFunction,
  succesfullBlockchainCreation,
} from "../../toasts/sweetAlerts";
import { encodeAttributeValue } from "../../../midnight/attribute-value-codec";
import { buildMerkleTree } from "../../../midnight/merkle";
import { getDisclosureRequestsByVerifier } from "../../../midnight/indexer.service";
import BlockchainField from "../../components/BlockchainField";
import { publishRequestSet } from "../../../midnight/disclosure-sets";

const REQUEST_ID_POLL_ATTEMPTS = 10;
const REQUEST_ID_POLL_DELAY_MS = 1500;

// After publishDisclosureRequest's tx confirms, the requestId it produced isn't something we can
// recompute ourselves (poap.compact's disclosure_request_key is NOT an exported pure circuit, unlike
// computeEventId) or trust out of the tx result (this codebase's established convention — see
// contract.service.ts's own comment near computeEventId). So: poll the indexer for OUR OWN just-
// published request, matching on the (eventId, fieldId, setRoot) we already know client-side.
async function pollForRequestId({ verifierPkHex, eventIdHex, fieldIdHex, setRootHex }) {
  for (let attempt = 0; attempt < REQUEST_ID_POLL_ATTEMPTS; attempt++) {
    const requests = await getDisclosureRequestsByVerifier(verifierPkHex);
    const match = requests.find(
      (request) =>
        request.eventId === eventIdHex &&
        request.fieldId === fieldIdHex &&
        request.setRoot === setRootHex,
    );
    if (match) return match.requestId;
    await new Promise((resolve) => setTimeout(resolve, REQUEST_ID_POLL_DELAY_MS));
  }
  return null;
}

// Any connected wallet can publish a disclosure request (poap.compact's publishDisclosureRequest has
// no organizer/admin gate) — this popup is opened from eventCard.jsx's "Ask for a Disclosure" button
// on any event that has at least one field listed in its metadataURI's privateAttributeFields (see
// createEvent.jsx's private-attributes step). See docs/selective-disclosure-ui-design.md.
export default function PublishDisclosureRequest() {
  const { midnight, disclosureEvent } = useDrawer();
  const dispatch = useDrawerDispatch();

  const fields = disclosureEvent?.fields || [];
  const [fieldId, setFieldId] = useState(fields[0]?.fieldId || "");
  const [members, setMembers] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [publishedForHolders, setPublishedForHolders] = useState(false);
  // kind "credential" (a private field each credential carries, B7): the HOLDER answers, from their
  // POAP card, so the accepted values are published for them (publishRequestSet). kind "event"
  // (event-level attribute): only this organizer's browser can answer, via the share link.
  const selectedField = fields.find((field) => field.fieldId === fieldId);
  const isCredentialField = selectedField?.kind === "credential";
  const [copied, setCopied] = useState(false);

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const updateMember = (index, value) => {
    setMembers((current) => current.map((m, i) => (i === index ? value : m)));
  };
  const removeMember = (index) => {
    setMembers((current) => current.filter((_, i) => i !== index));
  };
  const addMember = () => setMembers((current) => [...current, ""]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!midnight?.provider || !disclosureEvent?.eventId || !fieldId) return;

    const trimmedMembers = members.map((m) => m.trim()).filter(Boolean);
    if (trimmedMembers.length === 0) {
      errorFunction("Validation Error", "Add at least one candidate value to the set.", "");
      return;
    }

    setLoading(true);
    setShareLink(null);
    try {
      const encodedMembers = trimmedMembers.map(encodeAttributeValue);
      const tree = await buildMerkleTree(encodedMembers, 16);
      const setRootHex = Buffer.from(tree.rootBytes).toString("hex");

      const label = new Uint8Array(32);
      crypto.getRandomValues(label);
      const eventIdBytes = Uint8Array.from(Buffer.from(disclosureEvent.eventId, "hex"));
      const fieldIdBytes = Uint8Array.from(Buffer.from(fieldId, "hex"));

      loadingFunction("Publishing Disclosure Request", "Preparing transaction…", "");
      const published = await midnight.provider.service.publishDisclosureRequest(
        label,
        eventIdBytes,
        fieldIdBytes,
        tree.rootBytes,
      );

      // The circuit returns the requestId (private.result); the indexer poll stays as a fallback.
      const returned = published?.private?.result;
      let requestId = returned instanceof Uint8Array && returned.length === 32 ? Buffer.from(returned).toString("hex") : null;
      if (!requestId) {
        loadingFunction("Publishing Disclosure Request", "Waiting for the indexer to pick it up…", "");
        requestId = await pollForRequestId({
          verifierPkHex: midnight.provider.address,
          eventIdHex: disclosureEvent.eventId,
          fieldIdHex: fieldId,
          setRootHex,
        });
      }
      if (!requestId) {
        throw new Error("Published, but the indexer hasn't shown it yet — try Get Share Link again shortly.");
      }

      // Raw values, URI-encoded individually then comma-joined — NOT hex-encoded: whoever responds
      // (disclosure-response.ts) re-encodes each one itself via the same encodeAttributeValue used
      // here, so the wire format only needs to survive a URL round-trip, not double as the on-chain
      // encoding.
      const link = `${window.location.origin}/app/disclosure/respond?requestId=${requestId}&members=${trimmedMembers.map(encodeURIComponent).join(",")}`;
      setShareLink(link);

      // Holders answer from their card, so they need the accepted values — the chain only has the root.
      loadingFunction("Publishing Disclosure Request", "Publishing the accepted values…", "");
      try {
        await publishRequestSet(requestId, trimmedMembers);
      } catch (setError) {
        console.error("Publishing the accepted values failed:", setError);
        if (isCredentialField) {
          throw new Error(
            "The request is on-chain, but its accepted values couldn't be published, so holders can't answer it. Publish the request again.",
          );
        }
      }
      setPublishedForHolders(isCredentialField);
      succesfullBlockchainCreation(
        "Disclosure Request Published",
        isCredentialField
          ? "Holders can now answer it from their POAP (Prove a Private Detail)."
          : `Request ID: ${requestId}`,
        "",
      );
    } catch (error) {
      console.error("Error publishing disclosure request:", error);
      errorFunction("Error", error.message || "Failed to publish the disclosure request. Please try again.", "");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!shareLink) return;
    navigator.clipboard?.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button className="btn wallet-modal-close" onClick={closeDrawer} aria-label="close">
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">Ask for a Disclosure</h4>
      </div>

      <div className="drawer-body">
        {!midnight?.provider ? (
          <div className="alert alert-info" role="alert">
            Connect your wallet first to publish a disclosure request.
          </div>
        ) : fields.length === 0 ? (
          <div className="alert alert-info" role="alert">
            This event has no private attributes to ask about.
          </div>
        ) : (
          <form className="row g-3" onSubmit={handlePublish}>
            <div className="col-12">
              <label className="form-label" htmlFor="disclosureField">Attribute</label>
              <select
                id="disclosureField"
                className="form-control"
                value={fieldId}
                onChange={(event) => setFieldId(event.target.value)}
              >
                {fields.map((field) => (
                  <option key={field.fieldId} value={field.fieldId}>
                    {field.kind === "credential" ? `${field.label} (each credential)` : field.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label">Candidate set</label>
              {members.map((member, index) => (
                <div className="d-flex align-items-center mb-2" style={{ gap: "8px" }} key={index}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. EU"
                    aria-label="Candidate value"
                    value={member}
                    onChange={(event) => updateMember(index, event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-card-detail-action btn-sm flex-shrink-0"
                    onClick={() => removeMember(index)}
                    aria-label="Remove candidate value"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-card-detail-action btn-sm mt-1" onClick={addMember}>
                <Plus size={14} className="mr-1" />
                Add candidate value
              </button>
              <small className="form-text text-muted d-block mt-2">
                The real answer must be one of these values, plus at least one decoy — a set with
                too few members makes membership equivalent to full disclosure.
              </small>
            </div>

            {publishedForHolders && (
              <div className="col-12 mt-2">
                <div className="alert alert-success m-0" role="status">
                  Published. Holders whose {selectedField?.label} is one of these values can prove it
                  from their POAP card (Prove a Private Detail), without revealing it.
                </div>
              </div>
            )}

            {shareLink && !isCredentialField && (
              <div className="col-12 mt-2">
                <BlockchainField
                  label="Share Link"
                  value={shareLink}
                  copied={copied}
                  onCopy={copyLink}
                  copyAriaLabel="Copy share link"
                />
              </div>
            )}
          </form>
        )}
      </div>

      {midnight?.provider && fields.length > 0 && (
        <div className="drawer-footer">
          <button
            type="submit"
            className="btn btn-gradient btn-block"
            onClick={handlePublish}
            disabled={loading}
          >
            {loading ? "Publishing…" : "Publish Request"}
          </button>
        </div>
      )}
    </div>
  );
}
