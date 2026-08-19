import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { X } from "lucide-react";
import {
  errorFunction,
  loadingFunction,
  succesfullBlockchainCreation,
} from "../../toasts/sweetAlerts";
import EventDetailsFields from "../../components/EventDetailsFields";
import EventImageField from "../../components/EventImageField";
import { uploadImageToIPFS, uploadJSONToIPFS, uploadPrivateJSONToIPFS } from "../../../services/ipfs.service";
import { getCroppedImageBlob } from "../../../utils/cropImage";
import { sha256 } from "../../../utils/cid";
import { computePrivateMetadataCommit } from "../../../midnight/contract.service";
import { savePrivateEventDraft } from "../../../midnight/private-event-metadata";
import eventNormal from "../../../images/svg/event-normal.svg";

// NOTE: createEvent(eventId, maxSupply, expiration, isPublicMint, metadataURI) circuit — the
// metadataURI is a pointer to off-chain JSON (name/description/image/…), not stored on-chain
// itself. It's shared by every token minted for this event. Built here from steps 1-2's fields by
// pinning an (optional) image and the resulting JSON to IPFS via the local server/ proxy —
// never a manually-authored URI, and never a Pinata key in this bundle.
export default function CreateEvent() {
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  // Step 1: name/description. Step 2: image (drag-and-drop + crop) — this is the event's own
  // listing/cover image. Step 3: supply/expiration/visibility. Step 4: optional extra info,
  // independent of the event's own public/private mint setting — has its own public/private switch
  // (see extraInfoIsPrivate below). Step 5: optional distinct image for the claimed POAP itself,
  // gated by usePoapImage — off by default, in which case the POAP just displays the event's own
  // image (poapImage omitted from the metadata JSON entirely, see handleSubmit/useEventMetadata.js).
  const [step, setStep] = useState(1);
  const [metadata, setMetadata] = useState({
    name: "",
    description: "",
    imageFile: null,
    croppedAreaPixels: null,
  });
  const [maxSupply, setMaxSupply] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [isPublicMint, setIsPublicMint] = useState(true);
  // Free-text extra info, independent of isPublicMint — its own switch decides whether it's baked
  // into the public metadataURI JSON (extraInfoIsPrivate: false) or uploaded via the private
  // commit/reveal flow (extraInfoIsPrivate: true). See src/midnight/private-event-metadata.ts and
  // docs/privacy-matrix.md.
  const [extraInfo, setExtraInfo] = useState("");
  const [extraInfoIsPrivate, setExtraInfoIsPrivate] = useState(false);
  const [usePoapImage, setUsePoapImage] = useState(false);
  // Separate {imageFile, croppedAreaPixels} pair — EventImageField hardcodes those two field names
  // on whatever `values` object it's given, so this can't share `metadata` above without colliding
  // with the event's own image.
  const [poapImageValues, setPoapImageValues] = useState({ imageFile: null, croppedAreaPixels: null });
  const [loading, setLoading] = useState(false);
  // Cropped once when leaving step 2, reused both for step 3's preview card and the actual
  // upload at submit — avoids re-running the canvas crop twice.
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [preparedImageBlob, setPreparedImageBlob] = useState(null);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const isStep1Valid = () => metadata.name.trim().length > 0;
  const isStep3Valid = () => Number(maxSupply) >= 0;
  const isStep5Valid = () => !usePoapImage || Boolean(poapImageValues.imageFile);

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  const goToStep3 = async () => {
    if (metadata.imageFile) {
      try {
        const blob = metadata.croppedAreaPixels
          ? await getCroppedImageBlob(metadata.imageFile, metadata.croppedAreaPixels)
          : metadata.imageFile;
        setPreparedImageBlob(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewImageUrl(url);
      } catch (error) {
        console.error("Error preparing image preview:", error);
      }
    } else {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreparedImageBlob(null);
      setPreviewImageUrl(null);
    }
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!provider) {
      errorFunction("Wallet Required", "Please connect your wallet first.", "");
      return;
    }

    if (!isStep3Valid()) {
      errorFunction("Validation Error", "Maximum Supply must be 0 (unlimited) or greater.", "");
      return;
    }

    if (!isStep5Valid()) {
      errorFunction("Validation Error", "Please choose a POAP image, or turn the switch off to use the event's own image.", "");
      return;
    }

    setLoading(true);
    try {
      let imageUri;
      if (preparedImageBlob) {
        loadingFunction("Creating Event", "Uploading image to IPFS…", "");
        imageUri = await uploadImageToIPFS(preparedImageBlob);
      }

      let poapImageUri;
      if (usePoapImage && poapImageValues.imageFile) {
        loadingFunction("Creating Event", "Uploading POAP image to IPFS…", "");
        const poapBlob = poapImageValues.croppedAreaPixels
          ? await getCroppedImageBlob(poapImageValues.imageFile, poapImageValues.croppedAreaPixels)
          : poapImageValues.imageFile;
        poapImageUri = await uploadImageToIPFS(poapBlob);
      }

      // Extra info's own switch decides where it goes — independent of isPublicMint. Public: just
      // another key in the same metadataURI JSON everyone already reads (no crypto, no reveal,
      // visible immediately). Private: the commit/reveal flow — value = sha256 of the exact JSON
      // that also gets uploaded, so the same 32 bytes double as the IPFS content's own CID digest
      // (verified against the real Pinata API, see private-event-metadata.ts's design notes), no
      // separate URI needs to be stored anywhere, just value/rand.
      const trimmedExtraInfo = extraInfo.trim();
      let privateMetadataCommit;
      let privateDraft = null;
      if (trimmedExtraInfo && extraInfoIsPrivate) {
        loadingFunction("Creating Event", "Uploading private info to IPFS…", "");
        const privateJSON = { notes: trimmedExtraInfo };
        const value = await sha256(JSON.stringify(privateJSON));
        const rand = new Uint8Array(32);
        crypto.getRandomValues(rand);
        privateMetadataCommit = computePrivateMetadataCommit(value, rand);
        await uploadPrivateJSONToIPFS(privateJSON);
        privateDraft = {
          notes: trimmedExtraInfo,
          valueHex: Buffer.from(value).toString("hex"),
          randHex: Buffer.from(rand).toString("hex"),
        };
      }

      loadingFunction("Creating Event", "Uploading metadata to IPFS…", "");
      const metadataURI = await uploadJSONToIPFS({
        name: metadata.name.trim(),
        ...(metadata.description.trim() ? { description: metadata.description.trim() } : {}),
        ...(imageUri ? { image: imageUri } : {}),
        ...(trimmedExtraInfo && !extraInfoIsPrivate ? { notes: trimmedExtraInfo } : {}),
        ...(poapImageUri ? { poapImage: poapImageUri } : {}),
      });

      const eventId = new Uint8Array(32);
      crypto.getRandomValues(eventId);

      const expiration = expirationDate
        ? BigInt(Math.floor(new Date(expirationDate).getTime() / 1000))
        : 0n;

      loadingFunction("Creating Event", `Please confirm the transaction in your ${provider.wallet} wallet…`, "");

      const { txHash } = await provider.service.createEvent(
        eventId,
        BigInt(maxSupply || 0),
        expiration,
        isPublicMint,
        metadataURI,
        ...(privateMetadataCommit ? [privateMetadataCommit] : []),
      );

      if (privateDraft) {
        savePrivateEventDraft(Buffer.from(eventId).toString("hex"), privateDraft);
      }

      closeDrawer();
      succesfullBlockchainCreation("Event Created Successfully", `Transaction: ${txHash}`, "");
    } catch (error) {
      console.error("Error creating event:", error);
      errorFunction(
        "Error",
        error.message || "An error occurred while creating the event. Please try again.",
        "",
      );
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
          Create Event
        </h4>
      </div>

      <div className="drawer-modal-steps">
        <span className={`step-dot${step === 1 ? ' active' : ''}`} />
        <span className={`step-dot${step === 2 ? ' active' : ''}`} />
        <span className={`step-dot${step === 3 ? ' active' : ''}`} />
        <span className={`step-dot${step === 4 ? ' active' : ''}`} />
        <span className={`step-dot${step === 5 ? ' active' : ''}`} />
      </div>

      <div className="drawer-body">
        <form className="row g-3" onSubmit={handleSubmit}>
          {step === 1 && (
            <EventDetailsFields values={metadata} onChange={setMetadata} />
          )}

          {step === 2 && (
            <EventImageField values={metadata} onChange={setMetadata} />
          )}

          {step === 3 && (
            <>
              <div className="col-12">
                <div className="drawer-modal-preview-card">
                  <div className="d-flex align-items-center">
                    <img
                      className="mr-3"
                      src={previewImageUrl || eventNormal}
                      width="96"
                      height="96"
                      alt=""
                      style={{ objectFit: "cover", borderRadius: 16, flexShrink: 0 }}
                    />
                    <div>
                      <h5 className="mb-1" style={{ fontSize: "16px" }}>
                        {metadata.name.trim() || "Untitled Event"}
                      </h5>
                      {metadata.description.trim() && (
                        <p className="small text-muted mb-0">{metadata.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <label className="form-label">
                  Maximum Supply <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0 for unlimited"
                  name="maxSupply"
                  value={maxSupply}
                  onChange={(event) => setMaxSupply(event.target.value)}
                  required
                  min="0"
                />
                <small className="form-text text-muted">
                  Maximum number of POAPs that can be claimed for this event. 0 means unlimited.
                </small>
              </div>

              <div className="col-12 mb-3">
                <label className="form-label">Expiration Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="expirationDate"
                  value={expirationDate}
                  onChange={(event) => setExpirationDate(event.target.value)}
                />
                <small className="form-text text-muted">
                  Optional. Leave blank for no expiration.
                </small>
              </div>

              <div className="col-12 mb-4">
                <div className="drawer-modal-preview-card">
                  <div className="d-flex align-items-center" style={{ gap: "14px" }}>
                    <div className="form-check form-switch mb-0 flex-shrink-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isPublicMint"
                        aria-label="Public mint"
                        checked={isPublicMint}
                        onChange={(event) => setIsPublicMint(event.target.checked)}
                      />
                    </div>
                    <div>
                      <span className="d-block font-weight-semibold">
                        {isPublicMint ? "Public Mint" : "Invite-Only Mint"}
                      </span>
                      <small className="form-text text-muted d-block mt-1">
                        {isPublicMint
                          ? "Anyone can claim a POAP for this event without the organizer minting to them."
                          : "Only the organizer can mint POAPs for this event — attendees can't claim on their own."}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

            </>
          )}

          {step === 4 && (
            <>
              <div className="col-12">
                <label className="form-label">Extra Info (optional)</label>
                <textarea
                  className="form-control"
                  placeholder="Anything extra you want attached to this event — an address, a note, whatever you want."
                  id="extraInfo"
                  name="extraInfo"
                  rows={5}
                  style={{ height: "120px", resize: "vertical", paddingTop: "12px" }}
                  value={extraInfo}
                  onChange={(event) => setExtraInfo(event.target.value)}
                />
                <small className="form-text text-muted">
                  Independent of Public Mint/Invite-Only above — this field has its own
                  public/private setting below.
                </small>
              </div>

              <div className="col-12 mt-3">
                <div className="drawer-modal-preview-card">
                  <div className="d-flex align-items-center" style={{ gap: "14px" }}>
                    <div className="form-check form-switch mb-0 flex-shrink-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="extraInfoIsPrivate"
                        aria-label="Extra info is private"
                        checked={extraInfoIsPrivate}
                        onChange={(event) => setExtraInfoIsPrivate(event.target.checked)}
                      />
                    </div>
                    <div>
                      <span className="d-block font-weight-semibold">
                        {extraInfoIsPrivate ? "Private" : "Public"}
                      </span>
                      <small className="form-text text-muted d-block mt-1">
                        {extraInfoIsPrivate
                          ? "Hidden until you reveal it later from the event's own page."
                          : "Visible to anyone as soon as the event is created."}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="col-12">
                <div className="drawer-modal-preview-card">
                  <div className="d-flex align-items-center" style={{ gap: "14px" }}>
                    <div className="form-check form-switch mb-0 flex-shrink-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="usePoapImage"
                        aria-label="Use a different image for the POAP"
                        checked={usePoapImage}
                        onChange={(event) => setUsePoapImage(event.target.checked)}
                      />
                    </div>
                    <div>
                      <span className="d-block font-weight-semibold">
                        {usePoapImage ? "Different POAP Image" : "Same as Event Image"}
                      </span>
                      <small className="form-text text-muted d-block mt-1">
                        {usePoapImage
                          ? "Choose the image attendees will see on the POAP they claim, separate from the event's own listing image."
                          : "The claimed POAP will display the same image as the event listing."}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {usePoapImage && (
                <EventImageField values={poapImageValues} onChange={setPoapImageValues} circular />
              )}
            </>
          )}
        </form>
      </div>

      <div className="drawer-footer">
        {step === 1 && (
          <Button
            type="button"
            className="btn btn-gradient btn-block w-100"
            onClick={() => setStep(2)}
            disabled={!isStep1Valid()}
          >
            Next
          </Button>
        )}
        {step === 2 && (
          <div className="d-flex gap-2 w-100">
            <Button
              type="button"
              className="btn btn-card-detail-action"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              type="button"
              className="btn btn-gradient flex-grow-1"
              onClick={goToStep3}
            >
              Next
            </Button>
          </div>
        )}
        {step === 3 && (
          <div className="d-flex gap-2 w-100">
            <Button
              type="button"
              className="btn btn-card-detail-action"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button
              type="button"
              className="btn btn-gradient flex-grow-1"
              onClick={() => setStep(4)}
              disabled={!isStep3Valid()}
            >
              Next
            </Button>
          </div>
        )}
        {step === 4 && (
          <div className="d-flex gap-2 w-100">
            <Button
              type="button"
              className="btn btn-card-detail-action"
              onClick={() => setStep(3)}
            >
              Back
            </Button>
            <Button
              type="button"
              className="btn btn-gradient flex-grow-1"
              onClick={() => setStep(5)}
            >
              Next
            </Button>
          </div>
        )}
        {step === 5 && (
          <div className="d-flex gap-2 w-100">
            <Button
              type="button"
              className="btn btn-card-detail-action"
              onClick={() => setStep(4)}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="btn btn-gradient flex-grow-1"
              onClick={handleSubmit}
              disabled={loading || !isStep3Valid() || !isStep5Valid()}
            >
              {loading ? "Creating Event…" : "Create Event"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
