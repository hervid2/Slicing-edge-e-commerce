import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { AppError } from '../../middleware/error-handler';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

export class UploadService {
  /**
   * Saves an uploaded image buffer to the local uploads directory and returns its public URL.
   */
  async saveFile(buffer: Buffer, originalName: string, folder = 'products') {
    const ext = path.extname(originalName).toLowerCase() || '.jpg';

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new AppError('Unsupported image format. Allowed: jpg, jpeg, png, webp, gif, avif', 400);
    }

    const dir = path.join(UPLOADS_DIR, folder);
    await fs.mkdir(dir, { recursive: true });

    const filename = `${crypto.randomUUID()}${ext}`;
    await fs.writeFile(path.join(dir, filename), buffer);

    return {
      url: `/uploads/${folder}/${filename}`,
      publicId: `${folder}/${filename}`,
    };
  }
}
