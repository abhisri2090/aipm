const MAX_DIMENSION = 1600;
const MIN_DIMENSION = 320;
const TARGET_BYTES = 600 * 1024;
const SCALE_STEP = 0.8;
const QUALITIES = [0.78, 0.6, 0.45, 0.3, 0.18, 0.1];

type DecodedImage = ImageBitmap | HTMLImageElement;

function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the image"));
    };
    image.src = objectUrl;
  });
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });
}

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= TARGET_BYTES) return file;

  let image: DecodedImage | null = null;
  try {
    image = await decodeImage(file);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not compress the sample image in this browser.");

    const largestDimension = Math.max(image.width, image.height);
    let dimension = Math.min(MAX_DIMENSION, largestDimension);

    while (true) {
      const scale = dimension / largestDimension;
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of QUALITIES) {
        const blob = await canvasBlob(canvas, quality);
        if (!blob) continue;
        if (blob.size <= TARGET_BYTES) {
          return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
            type: "image/webp",
            lastModified: file.lastModified,
          });
        }
      }

      if (dimension <= MIN_DIMENSION) break;
      dimension = Math.max(MIN_DIMENSION, Math.floor(dimension * SCALE_STEP));
    }

  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Could not compress")) {
      throw error;
    }
    throw new Error("Could not compress the sample image in this browser.");
  } finally {
    if (image && "close" in image) image.close();
  }

  throw new Error("Please compress the sample image to under 600 KB and try again.");
}
