import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../middleware/error-handler';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadService {
  /**
   * Uploads an image buffer to Cloudinary and returns the secure URL and public ID.
   */
  async saveFile(buffer: Buffer, originalName: string, folder = 'products') {
    const ext = path.extname(originalName).toLowerCase() || '.jpg';

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new AppError('Unsupported image format. Allowed: jpg, jpeg, png, webp, gif, avif', 400);
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new AppError('Image storage is not configured. Set CLOUDINARY_* environment variables.', 503);
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder, resource_type: 'image' }, (error, res) => {
            if (error || !res) {
              reject(error ?? new Error('Cloudinary upload returned no result'));
            } else {
              resolve(res);
            }
          })
          .end(buffer);
      },
    );

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}
