import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export const MAX_IMAGE_SIZE = 800 * 1024; // 800 KB
export const ALLOWED_TYPES  = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export interface ProductImage {
  id:        string;
  type:      "upload" | "url";
  src:       string;
  isPrimary: boolean;
  order:     number;
  publicId?: string;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  userId: string,
  mimeType: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const folder = `bizilcore/products/${userId}`;
    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: "image", quality: "auto", fetch_format: "auto" },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      )
      .end(buffer);
  });
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, resource_type: "image", quality: "auto", fetch_format: "auto" },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      )
      .end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // non-blocking
  }
}
