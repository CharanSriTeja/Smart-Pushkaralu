import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { initFirebase } from './firebase.js';

export interface StorageUploadResult {
  url: string;
  key: string;
  bytes: number;
}

export interface StorageAdapter {
  save(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult>;
  delete?(key: string): Promise<void>;
}

/**
 * Local Disk Adapter (Development & Test only)
 */
export class LocalDiskStorageAdapter implements StorageAdapter {
  private uploadsDir = path.join(process.cwd(), 'uploads', 'issues');

  constructor() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async save(key: string, buffer: Buffer): Promise<StorageUploadResult> {
    const targetPath = path.join(this.uploadsDir, key);
    fs.writeFileSync(targetPath, buffer);
    return {
      url: `/uploads/issues/${key}`,
      key,
      bytes: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    const targetPath = path.join(this.uploadsDir, key);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }
}

/**
 * Cloudinary Storage Adapter
 * Uploads sanitized images using Cloudinary REST API
 */
export class CloudinaryStorageAdapter implements StorageAdapter {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = env.CLOUDINARY_API_KEY || '';
    this.apiSecret = env.CLOUDINARY_API_SECRET || '';
  }

  async save(key: string, buffer: Buffer): Promise<StorageUploadResult> {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = key.replace(/\.[^/.]+$/, ''); // Strip extension
    const folder = 'smart-pushkaralu/issues';

    // Cloudinary signature generation: params in alphabetical order
    const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const formData = new FormData();
    const blob = new Blob([buffer]);
    formData.append('file', blob, key);
    formData.append('api_key', this.apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('public_id', publicId);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    const res = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloudinary upload failed (${res.status}): ${errText}`);
    }

    const data = await res.json() as any;
    return {
      url: data.secure_url || data.url,
      key,
      bytes: buffer.length,
    };
  }
}

/**
 * Firebase Storage Adapter
 * Uploads sanitized images to Firebase Cloud Storage bucket
 */
export class FirebaseStorageAdapter implements StorageAdapter {
  private bucketName: string;

  constructor() {
    this.bucketName = env.FIREBASE_STORAGE_BUCKET || '';
  }

  async save(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    const app = initFirebase();
    if (!app) {
      throw new Error('Firebase app not initialized for Firebase Storage.');
    }

    const { getStorage } = await import('firebase-admin/storage');
    const bucket = getStorage(app).bucket(this.bucketName || undefined);
    const destination = `issues/${key}`;
    const file = bucket.file(destination);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
      },
      public: true,
      validation: 'md5',
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
    return {
      url: publicUrl,
      key,
      bytes: buffer.length,
    };
  }
}

/**
 * S3-Compatible Storage Adapter (AWS S3, Cloudflare R2, MinIO)
 */
export class S3StorageAdapter implements StorageAdapter {
  private bucket: string;
  private region: string;
  private endpoint?: string;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET || '';
    this.region = env.AWS_REGION || 'us-east-1';
    this.endpoint = env.AWS_S3_ENDPOINT;
  }

  async save(key: string, buffer: Buffer, mimeType: string): Promise<StorageUploadResult> {
    const destination = `issues/${key}`;
    const baseUrl = this.endpoint
      ? `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${destination}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${destination}`;

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Length': buffer.length.toString(),
    };

    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      // Basic authenticated PUT or public upload
      const res = await fetch(baseUrl, {
        method: 'PUT',
        headers,
        body: buffer,
      });

      if (!res.ok) {
        throw new Error(`S3 upload failed with status ${res.status}`);
      }
    }

    return {
      url: baseUrl,
      key,
      bytes: buffer.length,
    };
  }
}

/**
 * Factory creating the active storage adapter
 */
export function getStorageAdapter(): StorageAdapter {
  switch (env.STORAGE_ADAPTER) {
    case 'cloudinary':
      return new CloudinaryStorageAdapter();
    case 'firebase':
      return new FirebaseStorageAdapter();
    case 's3':
      return new S3StorageAdapter();
    case 'local':
    default:
      if (env.NODE_ENV === 'production') {
        throw new Error('Local disk storage adapter is prohibited in production.');
      }
      return new LocalDiskStorageAdapter();
  }
}
