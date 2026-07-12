/** Resize a user-selected image before it enters JSON, local storage, or an AI request. */
export function optimizeImageFileToDataUrl(
  file,
  { maxWidth = 1280, maxHeight = 1280, quality = 0.72, maxBytes = 350_000 } = {},
) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type || "")) {
      reject(new Error("Choose a JPG, PNG, or WebP image."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not decode this image."));
      image.onload = () => {
        const ratio = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        let width = Math.max(1, Math.round(image.width * ratio));
        let height = Math.max(1, Math.round(image.height * ratio));
        let currentQuality = quality;
        let result = "";

        for (let attempt = 0; attempt < 6; attempt += 1) {
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Image processing is not available on this device."));
            return;
          }
          context.drawImage(image, 0, 0, width, height);
          result = canvas.toDataURL("image/jpeg", currentQuality);
          const estimatedBytes = Math.ceil((result.split(",")[1]?.length || 0) * 0.75);
          if (estimatedBytes <= maxBytes) {
            resolve(result);
            return;
          }
          currentQuality = Math.max(0.48, currentQuality - 0.08);
          width = Math.max(320, Math.round(width * 0.82));
          height = Math.max(320, Math.round(height * 0.82));
        }

        reject(new Error("This image is still too large after optimization. Choose a smaller image."));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
