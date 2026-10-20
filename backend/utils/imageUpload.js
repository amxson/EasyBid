import { open } from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";
import ErrorHandler from "../middlewares/error.js";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export async function validateImage(file) {
  if (!file || Array.isArray(file)) throw new ErrorHandler("Choose one image.", 400);
  if (file.truncated || file.size > MAX_IMAGE_BYTES)
    throw new ErrorHandler("Choose an image no larger than 4 MB.", 413);
  if (!file.size || !["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
    throw new ErrorHandler("Choose a JPEG, PNG, or WebP image. Videos are not supported.", 400);
  const handle = await open(file.tempFilePath, "r");
  const header = Buffer.alloc(12);
  let bytesRead;
  try { ({ bytesRead } = await handle.read(header, 0, header.length, 0)); }
  finally { await handle.close(); }
  const type = bytesRead >= 8 && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? "image/png"
    : bytesRead >= 3 && header[0] === 255 && header[1] === 216 && header[2] === 255
      ? "image/jpeg"
      : bytesRead === 12 && header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP"
        ? "image/webp" : null;
  if (type !== file.mimetype)
    throw new ErrorHandler("This file is not a valid JPEG, PNG, or WebP image.", 400);
}

export async function uploadImage(file, folder) {
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder, resource_type: "image", timeout: 30000,
    });
    if (!result?.public_id || !result?.secure_url || result.error) throw new Error("Image service returned no image.");
    return result;
  } catch (error) {
    if (error.http_code === 400)
      throw new ErrorHandler("This image could not be read. Choose another JPEG, PNG, or WebP image.", 400);
    throw new ErrorHandler("Image upload is temporarily unavailable. Please try again.", 503);
  }
}
