import { useState } from "react";
import { Button } from "react-bootstrap";
import { X } from "lucide-react";
import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import EventImageField from "../../components/EventImageField";
import eventNormal from "../../../images/svg/event-normal.svg";
import eventOwnerIcon from "../../../icons/svg/collection-owner.svg";
import {
  succesfullBlockchainCreation,
  errorFunction,
  loadingFunction,
} from "../../toasts/sweetAlerts";
import { useEventMetadata } from "../../hooks/useEventMetadata";
import { uploadImageToIPFS, uploadJSONToIPFS } from "../../../services/ipfs.service";
import { getCroppedImageBlob } from "../../../utils/cropImage";

const truncateHex = (hex) => {
  if (!hex) return "N/A";
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
};

const STEP_RECIPIENT = 1;
const STEP_DOCUMENT = 2;
const STEP_ICON = 3;
const LAST_STEP = STEP_ICON;

// mintTo(eventId, recipientPk, tokenMetadataURI, tokenPrivateMetadataCommit) — the organizer-only
// push-mint circuit (poap.compact) — is the counterpart to createPoap.jsx's self-service claim():
// instead of the recipient claiming their own token, the organizer mints a brand-new one directly
// to a recipient's per-issuer holder pk. Always opened pre-filled with a specific event
// (CREATE_MINT's payload, dispatched from eventCard.jsx's expanded detail — no event selector
// here, unlike Claim POAP).
//
// A small 3-step wizard, same Back/Next/step-dot pattern as createEvent.jsx, one field group per
// step: recipient → credential image → icon. Only reachable for Credential-category (invite-only)
// events — see createEvent.jsx, where that category is the only one with no shared "POAP image"
// step, precisely because each credential gets its own image right here instead of inheriting one
// set at event-creation time. Two images, both independent of the event's own metadataURI:
// - `image` (icon, optional) — the small thumbnail wherever this token appears in a list/grid.
// - `documentImage` (required) — the actual ticket/diploma/document, shown full-size when the
//   holder opens this specific credential (poapCard.jsx's expanded view).
export default function MintPoap() {
  const { mintEvent, midnight } = useDrawer();
  const dispatch = useDrawerDispatch();
  const { metadata } = useEventMetadata(mintEvent?.metadataURI);

  const [step, setStep] = useState(STEP_RECIPIENT);
  const [recipientPkHex, setRecipientPkHex] = useState("");
  const [iconValues, setIconValues] = useState({ imageFile: null, croppedAreaPixels: null });
  const [documentValues, setDocumentValues] = useState({ imageFile: null, croppedAreaPixels: null });
  const [loading, setLoading] = useState(false);

  const isRecipientValid = () => /^[0-9a-fA-F]{64}$/.test(recipientPkHex.trim());
  const isDocumentValid = () => Boolean(documentValues.imageFile);

  const stepValidators = {
    [STEP_RECIPIENT]: isRecipientValid,
    [STEP_DOCUMENT]: isDocumentValid,
  };
  const isCurrentStepValid = () => {
    const validator = stepValidators[step];
    return validator ? validator() : true;
  };

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const handleNext = () => setStep((s) => Math.min(LAST_STEP, s + 1));
  const handleBack = () => setStep((s) => Math.max(STEP_RECIPIENT, s - 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!midnight?.provider || !mintEvent) return;

    if (!isRecipientValid()) {
      errorFunction(
        "Invalid Public Key",
        "Recipient public key must be a 32-byte hex string (64 hex characters).",
        ""
      );
      return;
    }

    if (!isDocumentValid()) {
      errorFunction(
        "Credential Image Required",
        "Upload the ticket, diploma, or document this credential represents.",
        ""
      );
      return;
    }

    setLoading(true);
    try {
      let iconUri;
      if (iconValues.imageFile) {
        loadingFunction("Minting POAP", "Uploading icon to IPFS…", "");
        const iconBlob = iconValues.croppedAreaPixels
          ? await getCroppedImageBlob(iconValues.imageFile, iconValues.croppedAreaPixels)
          : iconValues.imageFile;
        iconUri = await uploadImageToIPFS(iconBlob);
      }

      loadingFunction("Minting POAP", "Uploading credential image to IPFS…", "");
      // noCrop on this field (see below) — the document keeps its original aspect ratio
      // (horizontal, vertical, or square), so croppedAreaPixels is never set; upload the file as-is.
      const documentImageUri = await uploadImageToIPFS(documentValues.imageFile);

      // Name/description/category/organization mirror the event's own (organizer can always tell
      // tokens apart by recipient/event either way) — the images are what's actually personalized
      // per recipient. Mirroring category/organization keeps the category badge and the
      // organizer's display name showing on this credential too, instead of falling back to no
      // badge / the raw pk the way it would with no tokenMetadataURI fields of its own.
      loadingFunction("Minting POAP", "Uploading token metadata to IPFS…", "");
      const tokenMetadataURI = await uploadJSONToIPFS({
        ...(metadata?.name ? { name: metadata.name } : {}),
        ...(metadata?.description ? { description: metadata.description } : {}),
        ...(metadata?.category ? { category: metadata.category } : {}),
        ...(metadata?.organization ? { organization: metadata.organization } : {}),
        ...(iconUri ? { image: iconUri } : {}),
        documentImage: documentImageUri,
      });

      loadingFunction("Minting POAP", `Please confirm the transaction in your ${midnight.provider.wallet} wallet…`, "");
      const eventIdBytes = Uint8Array.from(Buffer.from(mintEvent.eventId, "hex"));
      const recipientPk = Uint8Array.from(Buffer.from(recipientPkHex.trim(), "hex"));
      const { txHash } = await midnight.provider.service.mintTo(
        eventIdBytes,
        recipientPk,
        tokenMetadataURI
      );

      succesfullBlockchainCreation("POAP Minted Successfully", `Transaction: ${txHash}`, "");
      closeDrawer();
    } catch (error) {
      console.error("Error minting POAP:", error);
      errorFunction("Error", error.message || "Failed to mint POAP. Please try again.", "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column w-100 drawer-modal-inner">
      <div className="drawer-header">
        <button
          className="btn wallet-modal-close"
          onClick={closeDrawer}
          aria-label="close"
        >
          <X size={15} />
        </button>
        <h4 className="text-center w-100 m-0 font-weight-semibold">
          Mint POAP
        </h4>
      </div>

      {mintEvent && (
        <div className="drawer-modal-steps">
          <span className={`step-dot${step === STEP_RECIPIENT ? ' active' : ''}`} />
          <span className={`step-dot${step === STEP_DOCUMENT ? ' active' : ''}`} />
          <span className={`step-dot${step === STEP_ICON ? ' active' : ''}`} />
        </div>
      )}

      <div className="drawer-body">
        {mintEvent ? (
          <form name="mintPoapForm" className="row g-3" onSubmit={handleSubmit}>
            {step === STEP_RECIPIENT && (
              <>
                <div className="col-12">
                  <div className="drawer-modal-preview-card">
                    <div className="d-flex align-items-center mb-3">
                      <img
                        className="mr-3 rounded-circle"
                        src={metadata?.poapImageUrl || metadata?.imageUrl || eventNormal}
                        width="48"
                        height="48"
                        alt=""
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = eventNormal; }}
                      />
                      <div>
                        <h5 className="mb-1" style={{ fontSize: "16px" }}>
                          {metadata?.name || `Event ${truncateHex(mintEvent.eventId)}`}
                        </h5>
                      </div>
                    </div>
                    <ul className="list-unstyled mb-0 small">
                      <li className="d-flex align-items-center mb-2">
                        <img className="mr-2" src={eventOwnerIcon} width="16" height="16" alt="" />
                        Organizer: <span className="text-white">{metadata?.organization?.name || truncateHex(mintEvent.issuerPk)}</span>
                      </li>
                      <li className="mb-2">
                        Supply: {mintEvent.minted}/{mintEvent.maxSupply || "unlimited"}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="col-12 mt-3">
                  <label className="form-label" htmlFor="recipientPkHex">Recipient's Key (hex)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="64-character hex key"
                    id="recipientPkHex"
                    name="recipientPkHex"
                    value={recipientPkHex}
                    onChange={(event) => setRecipientPkHex(event.target.value)}
                    required
                  />
                  <small className="form-text text-muted">
                    Not their wallet address — this has to be the key they generate specifically for
                    you. Send them your organizer public key ({truncateHex(mintEvent.issuerPk)}), have
                    them open My Subscriptions → Get My Key and paste it in, and they'll get back the
                    value to paste here.
                  </small>
                </div>
              </>
            )}

            {step === STEP_DOCUMENT && (
              <div className="col-12">
                <EventImageField
                  values={documentValues}
                  onChange={setDocumentValues}
                  noCrop
                  id="documentImage"
                  label={<>Credential Image <span className="text-danger">*</span></>}
                  helperText="Required. The ticket, diploma, or document this credential represents — horizontal, vertical, or square, shown uncropped when the recipient opens it."
                />
              </div>
            )}

            {step === STEP_ICON && (
              <div className="col-12">
                <EventImageField
                  values={iconValues}
                  onChange={setIconValues}
                  circular
                  id="iconImage"
                  label="Icon (optional)"
                  helperText="Optional. Shown as the small thumbnail wherever this credential appears in a list — falls back to a generic icon if left blank."
                />
              </div>
            )}
          </form>
        ) : (
          <div className="alert alert-info" role="alert">
            No event selected. Open this from an event's expanded detail on the Events page.
          </div>
        )}
      </div>

      {mintEvent && (
        <div className="drawer-footer">
          {step === STEP_RECIPIENT ? (
            <Button
              type="button"
              className="btn btn-gradient btn-block w-100"
              onClick={handleNext}
              disabled={!isCurrentStepValid()}
            >
              Next
            </Button>
          ) : (
            <div className="d-flex gap-2 w-100">
              <Button
                type="button"
                className="btn btn-card-detail-action"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
              {step === LAST_STEP ? (
                <Button
                  type="submit"
                  className="btn btn-gradient flex-grow-1"
                  onClick={handleSubmit}
                  disabled={loading || !isDocumentValid()}
                >
                  {loading ? "Minting…" : "Mint POAP"}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="btn btn-gradient flex-grow-1"
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                >
                  Next
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
