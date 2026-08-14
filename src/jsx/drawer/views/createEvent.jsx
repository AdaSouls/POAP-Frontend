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
import { uploadImageToIPFS, uploadJSONToIPFS } from "../../../services/ipfs.service";
import { getCroppedImageBlob } from "../../../utils/cropImage";
import eventNormal from "../../../images/svg/event-normal.svg";

// NOTE: createEvent(eventId, maxSupply, expiration, isPublicMint, metadataURI) circuit — the
// metadataURI is a pointer to off-chain JSON (name/description/image/…), not stored on-chain
// itself. It's shared by every token minted for this event. Built here from steps 1-2's fields by
// pinning an (optional) image and the resulting JSON to IPFS via the local server/ proxy —
// never a manually-authored URI, and never a Pinata key in this bundle.
export default function CreateEvent() {
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  // Step 1: name/description. Step 2: image (drag-and-drop + crop). Step 3: supply/expiration/
  // visibility + submit.
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
      errorFunction("Wallet Required", "Please connect your Lace wallet first.", "");
      return;
    }

    if (!isStep3Valid()) {
      errorFunction("Validation Error", "Maximum Supply must be 0 (unlimited) or greater.", "");
      return;
    }

    setLoading(true);
    try {
      let imageUri;
      if (preparedImageBlob) {
        loadingFunction("Creating Event", "Uploading image to IPFS…", "");
        imageUri = await uploadImageToIPFS(preparedImageBlob);
      }

      loadingFunction("Creating Event", "Uploading metadata to IPFS…", "");
      const metadataURI = await uploadJSONToIPFS({
        name: metadata.name.trim(),
        ...(metadata.description.trim() ? { description: metadata.description.trim() } : {}),
        ...(imageUri ? { image: imageUri } : {}),
      });

      const eventId = new Uint8Array(32);
      crypto.getRandomValues(eventId);

      const expiration = expirationDate
        ? BigInt(Math.floor(new Date(expirationDate).getTime() / 1000))
        : 0n;

      loadingFunction("Creating Event", "Please confirm the transaction in your Lace wallet…", "");

      const { txHash } = await provider.service.createEvent(
        eventId,
        BigInt(maxSupply || 0),
        expiration,
        isPublicMint,
        metadataURI,
      );

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
                      className="mr-3 rounded-circle"
                      src={previewImageUrl || eventNormal}
                      width="48"
                      height="48"
                      alt=""
                      style={{ objectFit: "cover" }}
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
              className="btn btn-outline-secondary"
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
              className="btn btn-outline-secondary"
              onClick={() => setStep(2)}
              disabled={loading}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="btn btn-gradient flex-grow-1"
              onClick={handleSubmit}
              disabled={loading || !isStep3Valid()}
            >
              {loading ? "Creating Event…" : "Create Event"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
