// Canvas-based crop, matching react-easy-crop's onCropComplete pixel-rect output shape
// ({x, y, width, height} in source-image pixel coordinates). Computed lazily/once at submit time,
// not on every crop drag.

// Icons render at ~48-64px everywhere in this app (eventCard/poapCard/mintPoap avatars) — 512px
// is generous headroom for high-DPI displays while keeping every pinned image small regardless of
// how large the original upload was, per the explicit "don't bloat IPFS" ask.
const MAX_OUTPUT_DIMENSION = 512;
const JPEG_QUALITY = 0.85;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function getCroppedImageBlob(imageFile, croppedAreaPixels) {
  const image = await loadImage(imageFile);
  try {
    // Crop is always square (aspect={1} in the Cropper), so width === height — downscale to the
    // cap if the selected region is bigger, otherwise keep it as-is (never upscale).
    const outputSize = Math.min(croppedAreaPixels.width, MAX_OUTPUT_DIMENSION);
    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      outputSize,
      outputSize,
    );

    // PNG in -> PNG out (icons/logos may rely on a transparent background, which JPEG can't
    // represent). Anything else (photos, the common case) -> compressed JPEG, much smaller than
    // PNG for photographic content.
    const outputType = imageFile.type === "image/png" ? "image/png" : "image/jpeg";
    const quality = outputType === "image/jpeg" ? JPEG_QUALITY : undefined;

    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to crop image"));
      }, outputType, quality);
    });
  } finally {
    URL.revokeObjectURL(image.src);
  }
}
