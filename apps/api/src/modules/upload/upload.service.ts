import type { AdminUploadInput } from '@slicing-edge/shared';
import crypto from 'node:crypto';
import { AppError } from '../../middleware/error-handler';

interface CloudinaryUploadResponse {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: { message?: string };
}

export class UploadService {
  /**
   * Uploads an image to Cloudinary using signed server-side upload.
   */
  async uploadImage(input: AdminUploadInput) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new AppError('Cloudinary is not configured. Missing CLOUDINARY_* variables.', 500);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string | number> = { timestamp };

    if (input.folder) {
      paramsToSign.folder = input.folder;
    }

    if (input.publicId) {
      paramsToSign.public_id = input.publicId;
    }

    const signature = this.createCloudinarySignature(paramsToSign, apiSecret);

    const body = new URLSearchParams({
      file: input.file,
      api_key: apiKey,
      timestamp: String(timestamp),
      signature,
      ...(input.folder ? { folder: input.folder } : {}),
      ...(input.publicId ? { public_id: input.publicId } : {}),
    });

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const data = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse;

    if (!response.ok || !data.secure_url || !data.public_id) {
      throw new AppError(data.error?.message || 'Cloudinary upload failed', 502);
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
    };
  }

  private createCloudinarySignature(params: Record<string, string | number>, apiSecret: string) {
    const serialized = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return crypto.createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
  }
}
