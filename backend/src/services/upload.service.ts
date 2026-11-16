import crypto from 'crypto';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { getStorageAdapter } from './storage.adapter.js';

const UPLOAD_SECRET = env.UPLOAD_SECRET || env.JWT_SECRET;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface SignedUploadTokenPayload {
  key: string;
  mimeType: string;
  maxSize: number;
  expiresAt: number;
}

export class UploadService {
  /**
   * Generates a signed URL token for client-side direct upload
   */
  static generateSignedUploadUrl(params: {
    filename: string;
    mimeType: string;
    fileSize: number;
  }): { uploadUrl: string; token: string; key: string; expiresAt: number; maxSizeBytes: number } {
    if (!ALLOWED_MIME_TYPES.includes(params.mimeType.toLowerCase())) {
      throw new Error(`Unsupported image type "${params.mimeType}". Allowed types: JPEG, PNG, WEBP.`);
    }

    if (params.fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size ${params.fileSize} bytes exceeds maximum limit of 5MB.`);
    }

    const ext = this.getExtensionFromMime(params.mimeType);
    const uniqueKey = `issue_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    const payload: SignedUploadTokenPayload = {
      key: uniqueKey,
      mimeType: params.mimeType,
      maxSize: Math.max(params.fileSize, 1024),
      expiresAt,
    };

    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', UPLOAD_SECRET).update(payloadStr).digest('base64url');
    const token = `${payloadStr}.${signature}`;

    return {
      uploadUrl: `/v1/issues/upload/storage/${token}`,
      token,
      key: uniqueKey,
      expiresAt,
      maxSizeBytes: MAX_FILE_SIZE,
    };
  }

  /**
   * Verifies signed token
   */
  static verifyUploadToken(token: string): SignedUploadTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new Error('Invalid upload token format.');
    }

    const [payloadStr, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', UPLOAD_SECRET).update(payloadStr).digest('base64url');

    if (signature !== expectedSig) {
      throw new Error('Upload token signature mismatch.');
    }

    const payload: SignedUploadTokenPayload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));

    if (Date.now() > payload.expiresAt) {
      throw new Error('Upload token has expired.');
    }

    return payload;
  }

  /**
   * Processes image buffer:
   * 1. Validates real image format & dimensions
   * 2. Checks size limit
   * 3. Strips EXIF metadata to protect reporter privacy
   * 4. Persists sanitized image to active storage adapter (Cloudinary / Firebase / S3 / local)
   */
  static async processAndSaveImage(
    buffer: Buffer,
    preferredKey?: string,
    enforceMime?: string
  ): Promise<{ photoUrl: string; key: string; size: number; format: string }> {
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size (${buffer.length} bytes) exceeds 5MB limit.`);
    }

    // Inspect image with sharp to verify actual binary type
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format)) {
      throw new Error(`Invalid image content. Format detected: ${metadata.format || 'unknown'}. Only JPEG, PNG, and WEBP are supported.`);
    }

    if (enforceMime) {
      const expectedFormat = this.getFormatFromMime(enforceMime);
      if (expectedFormat && metadata.format !== expectedFormat && !(expectedFormat === 'jpeg' && (metadata.format as string) === 'jpg')) {
        throw new Error(`File content format (${metadata.format}) does not match declared MIME (${enforceMime}).`);
      }
    }

    const format = metadata.format;
    const ext = format === 'jpeg' ? '.jpg' : `.${format}`;
    const key = preferredKey || `issue_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;

    // Strips EXIF by not calling .withMetadata(), and auto-rotates based on original orientation tag
    let sanitizedBuffer: Buffer;
    let mimeType = 'image/jpeg';
    if (format === 'png') {
      sanitizedBuffer = await image.rotate().png({ compressionLevel: 8 }).toBuffer();
      mimeType = 'image/png';
    } else if (format === 'webp') {
      sanitizedBuffer = await image.rotate().webp({ quality: 80 }).toBuffer();
      mimeType = 'image/webp';
    } else {
      sanitizedBuffer = await image.rotate().jpeg({ quality: 80 }).toBuffer();
      mimeType = 'image/jpeg';
    }

    // Delegate persistence to configured storage adapter
    const adapter = getStorageAdapter();
    const result = await adapter.save(key, sanitizedBuffer, mimeType);

    return {
      photoUrl: result.url,
      key,
      size: sanitizedBuffer.length,
      format,
    };
  }

  private static getExtensionFromMime(mimeType: string): string {
    switch (mimeType.toLowerCase()) {
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/jpeg':
      default:
        return '.jpg';
    }
  }

  private static getFormatFromMime(mimeType: string): string | null {
    switch (mimeType.toLowerCase()) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/jpeg':
        return 'jpeg';
      default:
        return null;
    }
  }
}
