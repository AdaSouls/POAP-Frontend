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
import PrivateAttributesStepFields from "../../components/PrivateAttributesStepFields";
import { uploadImageToIPFS, uploadJSONToIPFS } from "../../../services/ipfs.service";
import { getCroppedImageBlob } from "../../../utils/cropImage";
import { computeEventId, computeAttributeLeaf } from "../../../midnight/contract.service";
import { savePrivateAttributeDraft } from "../../../midnight/private-attribute-drafts";
import { encodeAttributeValue } from "../../../midnight/attribute-value-codec";
import { buildMerkleTree } from "../../../midnight/merkle";
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
// step sequence (details → image → supply → channels → taxonomy → org profile [conditional] →
// private attributes → POAP image), just with different taxonomy fields and a fixed, non-editable
// isPublicMint derived from the category. `step` is 0 for the category picker, then a 1-based
// index into `steps` (computed below) once a category is chosen. The Public Mint/Invite-Only Mint
// explanation used to repeat as its own card on the supply step — moved to a badge on each
// category card in CategoryPicker.jsx instead, since the choice is actually made at step 0 and
// showing it again later (immutably) just confused people.
const STEP_DETAILS = "details";
const STEP_IMAGE = "image";
const STEP_SUPPLY = "supply";
const STEP_CHANNELS = "channels";
const STEP_TAXONOMY = "taxonomy";
const STEP_ORG_PROFILE = "orgProfile";
const STEP_PRIVATE_ATTRIBUTES = "privateAttributes";
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
  // { fieldName, value }[] — selective disclosure. See docs/selective-disclosure-ui-design.md.
  const [privateAttributes, setPrivateAttributes] = useState([]);
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
      STEP_DETAILS, STEP_IMAGE, STEP_SUPPLY, STEP_CHANNELS, STEP_TAXONOMY, STEP_ORG_PROFILE,
      STEP_PRIVATE_ATTRIBUTES,
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
  // A fully-empty row is fine (ignored at submit — see handleSubmit's validAttributeRows filter);
  // a partially-filled row, or a value over the 32-byte encoding limit, blocks Next.
  const isPrivateAttributesValid = () =>
    privateAttributes.every((row) => {
      const hasFieldName = row.fieldName.trim().length > 0;
      const hasValue = row.value.trim().length > 0;
      if (!hasFieldName && !hasValue) return true;
      if (!hasFieldName || !hasValue) return false;
      try {
        encodeAttributeValue(row.value);
        return true;
      } catch {
        return false;
      }
    });

  const stepValidators = {
    [STEP_DETAILS]: isDetailsValid,
    [STEP_SUPPLY]: isSupplyValid,
    [STEP_POAP_IMAGE]: isPoapImageValid,
    [STEP_PRIVATE_ATTRIBUTES]: isPrivateAttributesValid,
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

      // `label` — NOT the on-chain eventId. createEvent used to accept a raw caller-chosen eventId
      // directly, which was a confirmed vulnerability (event-ID squatting: whoever called
      // createEvent first for a given id became its organizer forever, no recovery). The contract
      // now derives the real id as event_key(organizerPk, label) internally; a fresh random 32
      // bytes works fine as a label, same as the old eventId generation did.
      const label = new Uint8Array(32);
      crypto.getRandomValues(label);

      // Computed before the tx (not parsed out of its result — see computeEventId's comment in
      // contract.service.ts) using this wallet's own already-known pk. Needed early now, not just
      // for the Channel A draft key: Channel B's attribute leaves below are keyed by this same
      // eventId, and must be known before privateAttributesRoot is built and passed into
      // createEvent itself.
      const organizerPk = Buffer.from(provider.address, "hex");
      const eventId = computeEventId(organizerPk, label);

      // poap.compact's createEvent still takes a privateMetadataCommit slot (the commit/reveal
      // "Extra Info" feature this UI used to offer) — always pass the all-zero default now that
      // this wizard no longer sets it, per poap.compact's own convention for "no private part".
      const privateMetadataCommit = new Uint8Array(32);

      // Selective disclosure. Each non-empty row becomes its own Merkle leaf
      // (computeAttributeLeaf), committed together as one tree (buildMerkleTree, depth 8 — see
      // poap.compact's proveAttributeMembership); privateAttributesRoot stays the all-zero default
      // when there are none. fieldId is a fresh random id per attribute (not derived from the
      // label) — it's how a later disclosure request names which field it's asking about, and how
      // this browser looks its own draft back up (private-attribute-drafts.ts, keyed by
      // (eventId, fieldId)). The {fieldId, label} pairs (never the value) also go into the public
      // metadataURI JSON below, so a verifier can discover what's askable without any private state.
      const validAttributeRows = privateAttributes.filter(
        (row) => row.fieldName.trim() && row.value.trim(),
      );
      let privateAttributesRoot = new Uint8Array(32);
      const attributeDraftsToSave = [];
      const privateAttributeFieldsForMetadata = [];
      if (validAttributeRows.length > 0) {
        const leaves = validAttributeRows.map((row) => {
          const fieldId = new Uint8Array(32);
          crypto.getRandomValues(fieldId);
          const rand = new Uint8Array(32);
          crypto.getRandomValues(rand);
          const encodedValue = encodeAttributeValue(row.value);
          const leaf = computeAttributeLeaf(eventId, fieldId, encodedValue, rand);
          const fieldIdHex = Buffer.from(fieldId).toString("hex");
          attributeDraftsToSave.push({
            fieldIdHex,
            draft: {
              fieldName: row.fieldName.trim(),
              valueHex: Buffer.from(encodedValue).toString("hex"),
              randHex: Buffer.from(rand).toString("hex"),
            },
          });
          privateAttributeFieldsForMetadata.push({ fieldId: fieldIdHex, label: row.fieldName.trim() });
          return leaf;
        });
        const tree = await buildMerkleTree(leaves, 8);
        privateAttributesRoot = tree.rootBytes;
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
        ...(poapImageUri ? { poapImage: poapImageUri } : {}),
        category,
        ...taxonomyEntries,
        ...(channels.length ? { channels } : {}),
        ...(hasOrgProfileField ? { organization: organizationProfile } : {}),
        ...(privateAttributeFieldsForMetadata.length
          ? { privateAttributeFields: privateAttributeFieldsForMetadata }
          : {}),
      });

      const expiration = expirationDate
        ? BigInt(Math.floor(new Date(expirationDate).getTime() / 1000))
        : 0n;

      loadingFunction("Creating Event", `Please confirm the transaction in your ${provider.wallet} wallet…`, "");

      const { txHash } = await provider.service.createEvent(
        label,
        BigInt(maxSupply || 0),
        expiration,
        categoryConfig.isPublicMint,
        metadataURI,
        privateMetadataCommit,
        privateAttributesRoot,
      );

      const eventIdHex = Buffer.from(eventId).toString("hex");
      attributeDraftsToSave.forEach(({ fieldIdHex, draft }) => {
        savePrivateAttributeDraft(eventIdHex, fieldIdHex, draft);
      });

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
            <EventDetailsFields values={metadata} onChange={setMetadata} category={category} />
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

          {currentStepKey === STEP_PRIVATE_ATTRIBUTES && (
            <PrivateAttributesStepFields values={privateAttributes} onChange={setPrivateAttributes} />
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
