import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { ImagePlus, Trash2 } from "lucide-react";
import { errorFunction } from "../toasts/sweetAlerts";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function isValidImageFile(file) {
  if (!file.type.startsWith("image/")) {
    errorFunction("Invalid File", "Please choose an image file.", "");
    return false;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    errorFunction("Image Too Large", "Please choose an image under 8MB.", "");
    return false;
  }
  return true;
}

// Controlled, single-column: drag-and-drop dropzone + crop-to-icon selector — mutually exclusive,
// not shown side by side. No image yet: just the (large) dropzone. Image picked: the dropzone is
// replaced entirely by the crop tool + a remove button; removing clears both imageFile and
// croppedAreaPixels, which brings the dropzone back. Collects { imageFile, croppedAreaPixels } and
// hands them back via onChange — upload-agnostic, the caller decides when (and whether) to
// crop/pin anything to IPFS (see cropImage.js, which also downscales and compresses the final
// crop so IPFS never gets an unnecessarily large file, regardless of how big the original upload
// was).
//
// `id`/`label` default to the original hardcoded values so every existing caller (createEvent.jsx,
// one instance per wizard step, never two on screen at once) is unaffected. Callers that render
// more than one instance on the same page at the same time (mintPoap.jsx) must pass distinct
// `id`s — otherwise both dropzones' hidden file inputs would share id="eventImage", which is
// invalid HTML and breaks label association/testing-library queries for the second instance.
//
// `noCrop`: some images (a credential's document/ticket/diploma — see mintPoap.jsx) must keep
// their original aspect ratio — horizontal, vertical, or square — rather than being forced into
// the fixed square (or circular) crop every other caller wants. When true, the Cropper is skipped
// entirely: the picked file is shown via a plain `object-fit: contain` preview and uploaded
// as-is, `croppedAreaPixels` is never set (stays null forever), which every caller already
// treats as "use the raw file, nothing to crop" (see e.g. mintPoap.jsx's handleSubmit).
export default function EventImageField({
  values,
  onChange,
  circular = false,
  noCrop = false,
  id = "eventImage",
  label = "Image",
  helperText = "Optional. Automatically resized and pinned to IPFS — no need to host it yourself.",
}) {
  const { imageFile } = values;
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const objectUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      objectUrlRef.current = url;
      setPreviewUrl(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } else {
      setPreviewUrl(null);
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [imageFile]);

  const acceptFile = (file) => {
    if (!file || !isValidImageFile(file)) return;
    onChange({ ...values, imageFile: file, croppedAreaPixels: null });
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    acceptFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleCropComplete = (_croppedArea, croppedAreaPixels) => {
    onChange({ ...values, croppedAreaPixels });
  };

  const handleRemoveImage = () => {
    onChange({ ...values, imageFile: null, croppedAreaPixels: null });
  };

  return (
    <div className="col-12 mb-3">
      <label className="form-label" htmlFor={id}>{label}</label>

      {previewUrl ? (
        <div className="event-image-crop-container">
          {noCrop ? (
            <img
              src={previewUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape={circular ? "round" : "rect"}
              style={circular ? undefined : { cropAreaStyle: { borderRadius: 16 } }}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
          <button
            type="button"
            className="event-image-remove-btn"
            onClick={handleRemoveImage}
            aria-label="Remove image"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <div
          className={`event-image-dropzone event-image-dropzone-lg${isDragOver ? " is-dragover" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
        >
          <div className="event-image-dropzone-icon">
            <ImagePlus size={36} />
          </div>
          <p className="small text-muted mb-0">
            Drag an image here, or click to browse
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            id={id}
            name={id}
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />
        </div>
      )}

      <small className="form-text text-muted">{helperText}</small>
    </div>
  );
}
