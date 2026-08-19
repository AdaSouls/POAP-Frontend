import {
  useDrawer,
  useDrawerDispatch,
} from "../../contexts/drawer/drawer.provider";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { X } from "lucide-react";
import {
  errorFunction,
  loadingFunction,
  succesfullBlockchainCreation,
} from "../../toasts/sweetAlerts";
import EventDetailsFields from "../../components/EventDetailsFields";
import EventImageField from "../../components/EventImageField";
import CategoryPicker from "../../components/CategoryPicker";
import TaxonomyStepFields from "../../components/TaxonomyStepFields";
import ChannelsField from "../../components/ChannelsField";
import OrganizationProfileFields from "../../components/OrganizationProfileFields";
import { uploadImageToIPFS, uploadJSONToIPFS, uploadPrivateJSONToIPFS } from "../../../services/ipfs.service";
import { getCroppedImageBlob } from "../../../utils/cropImage";
import { sha256 } from "../../../utils/cid";
import { computePrivateMetadataCommit } from "../../../midnight/contract.service";
import { savePrivateEventDraft } from "../../../midnight/private-event-metadata";
import {
  EVENT_CATEGORIES,
  getCategoryConfig,
  isOrganizationProfileApplicable,
  serializeTaxonomyValues,
} from "../../constants/eventCategories";
import eventNormal from "../../../images/svg/event-normal.svg";

// NOTE: createEvent(eventId, maxSupply, expiration, isPublicMint, metadataURI) circuit — the
// metadataURI is a pointer to off-chain JSON (name/description/image/category/…), not stored
// on-chain itself. It's shared by every token minted for this event. Built here from the wizard's
// steps by pinning an (optional) image and the resulting JSON to IPFS via the local server/ proxy
// — never a manually-authored URI, and never a Pinata key in this bundle.
//
// Step 0 picks a category (Event/Subscription/Credential, see
// src/jsx/constants/eventCategories.js) before anything else — see
// docs/event-creation-wizard-design.md for the full design. Every category then walks the SAME
// step sequence (details → image → supply/visibility → channels → taxonomy → org profile
// [conditional] → extra info → POAP image), just with different taxonomy fields and a fixed,
// non-editable isPublicMint derived from the category. `step` is 0 for the category picker, then a
// 1-based index into `steps` (computed below) once a category is chosen.
const STEP_DETAILS = "details";
const STEP_IMAGE = "image";
const STEP_SUPPLY = "supply";
const STEP_CHANNELS = "channels";
const STEP_TAXONOMY = "taxonomy";
const STEP_ORG_PROFILE = "orgProfile";
const STEP_EXTRA_INFO = "extraInfo";
const STEP_POAP_IMAGE = "poapImage";

const CATEGORY_LIST = Object.values(EVENT_CATEGORIES);

export default function CreateEvent() {
  const { midnight: { provider } } = useDrawer();
  const dispatch = useDrawerDispatch();

  const [category, setCategory] = useState(null);
  const [step, setStep] = useState(0);

  const [metadata, setMetadata] = useState({
    name: "",
    description: "",
    imageFile: null,
    croppedAreaPixels: null,
  });
  const [maxSupply, setMaxSupply] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [channels, setChannels] = useState([]);
  const [taxonomyValues, setTaxonomyValues] = useState({});
  const [organizationProfile, setOrganizationProfile] = useState({});
  // Free-text extra info, independent of the category's fixed mint type — its own switch decides
  // whether it's baked into the public metadataURI JSON (extraInfoIsPrivate: false) or uploaded via
  // the private commit/reveal flow (extraInfoIsPrivate: true). See
  // src/midnight/private-event-metadata.ts and docs/privacy-matrix.md.
  const [extraInfo, setExtraInfo] = useState("");
  const [extraInfoIsPrivate, setExtraInfoIsPrivate] = useState(false);
  const [usePoapImage, setUsePoapImage] = useState(false);
  // Separate {imageFile, croppedAreaPixels} pair — EventImageField hardcodes those two field names
  // on whatever `values` object it's given, so this can't share `metadata` above without colliding
  // with the event's own image.
  const [poapImageValues, setPoapImageValues] = useState({ imageFile: null, croppedAreaPixels: null });
  const [loading, setLoading] = useState(false);
  // Cropped once when leaving the image step, reused both for the supply step's preview card and
  // the actual upload at submit — avoids re-running the canvas crop twice.
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [preparedImageBlob, setPreparedImageBlob] = useState(null);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const categoryConfig = getCategoryConfig(category);

  // STEP_ORG_PROFILE is always in the sequence now — it collects an organizer display name (see
  // OrganizationProfileFields.jsx), which is just as relevant for an individual as for a company,
  // so the step itself is never skipped. Only its address sub-fields are conditionally shown,
  // via showOrgAddress below (recomputed on every taxonomy answer) — see
  // isOrganizationProfileApplicable's doc comment for the per-category rule on that part.
  //
  // STEP_POAP_IMAGE only applies to categories where every token shares the event's own image set
  // (Event/Subscription, isPublicMint) — a single image chosen once at event-creation time,
  // inherited by every self-claim. Credential tokens are minted individually afterward (push-mint,
  // see mintPoap.jsx) with their own per-recipient image, so there's nothing for this step to set:
  // asking for one shared "POAP image" here would be misleading, not just redundant.
  const showOrgAddress = isOrganizationProfileApplicable(category, taxonomyValues);
  const steps = useMemo(() => {
    if (!categoryConfig) return [];
    const list = [
      STEP_DETAILS, STEP_IMAGE, STEP_SUPPLY, STEP_CHANNELS, STEP_TAXONOMY, STEP_ORG_PROFILE, STEP_EXTRA_INFO,
    ];
    if (categoryConfig.isPublicMint) {
      list.push(STEP_POAP_IMAGE);
    }
    return list;
  }, [categoryConfig]);

  const currentStepKey = step > 0 ? steps[step - 1] : null;
  const isLastStep = step > 0 && step === steps.length;

  const isDetailsValid = () => metadata.name.trim().length > 0;
  const isSupplyValid = () => Number(maxSupply) >= 0;
  const isPoapImageValid = () => !usePoapImage || Boolean(poapImageValues.imageFile);

  const stepValidators = {
    [STEP_DETAILS]: isDetailsValid,
    [STEP_SUPPLY]: isSupplyValid,
    [STEP_POAP_IMAGE]: isPoapImageValid,
  };
  const isCurrentStepValid = () => {
    if (step === 0) return category !== null;
    const validator = stepValidators[currentStepKey];
    return validator ? validator() : true;
  };

  const closeDrawer = () => {
    dispatch({ type: "CLOSE_DRAWER" });
  };

  // Only called when metadata.imageFile is truthy (see handleNext) — the no-image case is handled
  // inline there, synchronously.
  const prepareImagePreview = async () => {
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
  };

  // Stays synchronous (no `await` reached) whenever there's no image to crop — the common case —
  // so the step change lands in the same React batch as the click, instead of deferring to a
  // microtask. Only the actual crop path needs the extra tick.
  const handleNext = () => {
    if (currentStepKey === STEP_IMAGE && metadata.imageFile) {
      prepareImagePreview().then(() => setStep((s) => s + 1));
      return;
    }
    if (currentStepKey === STEP_IMAGE) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreparedImageBlob(null);
      setPreviewImageUrl(null);
    }
    setStep((s) => s + 1);
  };

  // Going back from the first content step returns to the category picker (step 0) — category and
  // every field already entered stay as-is, only actually replaced if a different category is
  // subsequently chosen.
  const handleBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!provider) {
      errorFunction("Wallet Required", "Please connect your wallet first.", "");
      return;
    }

    if (!categoryConfig) {
      errorFunction("Validation Error", "Choose what you're creating first.", "");
      return;
    }

    if (!isSupplyValid()) {
      errorFunction("Validation Error", "Maximum Supply must be 0 (unlimited) or greater.", "");
      return;
    }

    if (!isPoapImageValid()) {
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

      // Extra info's own switch decides where it goes — independent of the category's fixed mint
      // type. Public: just another key in the same metadataURI JSON everyone already reads (no
      // crypto, no reveal, visible immediately). Private: the commit/reveal flow — value = sha256
      // of the exact JSON that also gets uploaded, so the same 32 bytes double as the IPFS
      // content's own CID digest (verified against the real Pinata API, see
      // private-event-metadata.ts's design notes), no separate URI needs to be stored anywhere,
      // just value/rand.
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

      const taxonomyEntries = serializeTaxonomyValues(category, taxonomyValues);
      const hasOrgProfileField = Object.values(organizationProfile).some(
        (value) => typeof value === "string" && value.trim().length > 0,
      );

      loadingFunction("Creating Event", "Uploading metadata to IPFS…", "");
      const metadataURI = await uploadJSONToIPFS({
        name: metadata.name.trim(),
        ...(metadata.description.trim() ? { description: metadata.description.trim() } : {}),
        ...(imageUri ? { image: imageUri } : {}),
        ...(trimmedExtraInfo && !extraInfoIsPrivate ? { notes: trimmedExtraInfo } : {}),
        ...(poapImageUri ? { poapImage: poapImageUri } : {}),
        category,
        ...taxonomyEntries,
        ...(channels.length ? { channels } : {}),
        ...(hasOrgProfileField ? { organization: organizationProfile } : {}),
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
        categoryConfig.isPublicMint,
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
          {categoryConfig ? categoryConfig.headerTitle : "New POAP Group"}
        </h4>
      </div>

      {categoryConfig && (
        <div className="drawer-modal-steps">
          {steps.map((stepKey, index) => (
            <span key={stepKey} className={`step-dot${step === index + 1 ? ' active' : ''}`} />
          ))}
        </div>
      )}

      <div className="drawer-body">
        <form className="row g-3" onSubmit={handleSubmit}>
          {step === 0 && (
            <CategoryPicker value={category} onChange={setCategory} categories={CATEGORY_LIST} />
          )}

          {currentStepKey === STEP_DETAILS && (
            <EventDetailsFields values={metadata} onChange={setMetadata} />
          )}

          {currentStepKey === STEP_IMAGE && (
            <EventImageField values={metadata} onChange={setMetadata} />
          )}

          {currentStepKey === STEP_SUPPLY && (
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
                <label className="form-label" htmlFor="maxSupply">
                  Maximum Supply <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="0 for unlimited"
                  id="maxSupply"
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
                <label className="form-label" htmlFor="expirationDate">Expiration Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="expirationDate"
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
                    <div>
                      <span className="d-block font-weight-semibold">
                        {categoryConfig.isPublicMint ? "Public Mint" : "Invite-Only Mint"}
                      </span>
                      <small className="form-text text-muted d-block mt-1">
                        {categoryConfig.isPublicMint
                          ? `Anyone can claim a POAP for this without you minting it individually — set by the "${categoryConfig.label}" category.`
                          : `Only you can mint POAPs for this — recipients can't claim on their own. Set by the "${categoryConfig.label}" category.`}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {currentStepKey === STEP_CHANNELS && (
            <ChannelsField values={channels} onChange={setChannels} />
          )}

          {currentStepKey === STEP_TAXONOMY && (
            <TaxonomyStepFields
              taxonomy={categoryConfig.taxonomy}
              values={taxonomyValues}
              onChange={setTaxonomyValues}
            />
          )}

          {currentStepKey === STEP_ORG_PROFILE && (
            <OrganizationProfileFields
              values={organizationProfile}
              onChange={setOrganizationProfile}
              showAddress={showOrgAddress}
            />
          )}

          {currentStepKey === STEP_EXTRA_INFO && (
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
                  Its own public/private setting below, independent of everything else.
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

          {currentStepKey === STEP_POAP_IMAGE && (
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
        {step === 0 ? (
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
            {isLastStep ? (
              <Button
                type="submit"
                className="btn btn-gradient flex-grow-1"
                onClick={handleSubmit}
                disabled={loading || !isCurrentStepValid()}
              >
                {loading ? "Creating…" : "Create"}
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
    </div>
  );
}
