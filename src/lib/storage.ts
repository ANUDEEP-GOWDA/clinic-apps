/**
 * File storage abstraction.
 *
 * Two drivers: 'local' (dev) and 's3' (production; works with R2, Backblaze
 * B2, MinIO, AWS S3 — anything S3-compatible). Picked by env STORAGE_DRIVER.
 *
 * Why the abstraction:
 *   - Local-disk uploads silently break on serverless hosts (filesystem is
 *     ephemeral). Forcing every upload through this interface means we
 *     never accidentally write to disk in prod.
 *   - Swapping providers (R2 → S3 → Backblaze) is one env var change.
 *
 * What's stored:
 *   - Consultation attachments (patient files)
 *   - Media library (clinic-uploaded images for their public site)
 *
 * Each clinic gets its own key prefix (`c<clinicId>/`) so listing/cleanup
 * per tenant is straightforward.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import crypto from 'node:crypto';
import { env } from './env';

export type PutResult = {
  storageKey: string;     // canonical key, store this in DB
  publicUrl: string | null; // direct URL if bucket is public; else null
  sizeBytes: number;
  mimeType: string;
};

export interface Storage {
  put(opts: {
    clinicId: number;
    folder: string;       // 'media' | 'attachments' | 'backups' | ...
    filename: string;
    body: Buffer | Uint8Array;
    mimeType: string;
  }): Promise<PutResult>;

  getReadable(storageKey: string): Promise<NodeJS.ReadableStream>;

  /** Signed URL for direct-from-browser downloads. */
  getSignedUrl(storageKey: string, expiresInSec?: number): Promise<string>;

  delete(storageKey: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeFilename(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 200) || 'file';
}

function buildKey(clinicId: number, folder: string, filename: string): string {
  const cleanFolder = folder.replace(/[^\w\-]/g, '');
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const rand = crypto.randomBytes(8).toString('hex');
  return `c${clinicId}/${cleanFolder}/${date}/${rand}_${sanitizeFilename(filename)}`;
}

// ---------------------------------------------------------------------------
// Local driver (dev)
// ---------------------------------------------------------------------------

class LocalStorage implements Storage {
  private root: string;
  constructor(root: string) {
    this.root = path.resolve(root);
  }

  async put(opts: {
    clinicId: number;
    folder: string;
    filename: string;
    body: Buffer | Uint8Array;
    mimeType: string;
  }): Promise<PutResult> {
    const key = buildKey(opts.clinicId, opts.folder, opts.filename);
    const fullPath = path.join(this.root, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, opts.body);
    return {
      storageKey: key,
      publicUrl: `/uploads/${key}`,
      sizeBytes: opts.body.byteLength,
      mimeType: opts.mimeType,
    };
  }

  async getReadable(storageKey: string): Promise<NodeJS.ReadableStream> {
    return createReadStream(path.join(this.root, storageKey));
  }

  async getSignedUrl(storageKey: string): Promise<string> {
    // Local has no concept of signing; just serve via /uploads/<key>.
    return `/uploads/${storageKey}`;
  }

  async delete(storageKey: string): Promise<void> {
    await fs.unlink(path.join(this.root, storageKey)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// S3 driver (prod) — lazy-loaded so dev installs don't need aws-sdk.
// ---------------------------------------------------------------------------

class S3Storage implements Storage {
  // We type these loosely to avoid a hard import of the AWS SDK at module
  // load. The real types come from @aws-sdk/client-s3 / s3-request-presigner.
  private clientPromise: Promise<any> | null = null;
  private getSignedUrlFn: ((c: any, cmd: any, o: any) => Promise<string>) | null = null;

  private async client(): Promise<any> {
    if (this.clientPromise) return this.clientPromise;
    this.clientPromise = (async () => {
      const mod = await import('@aws-sdk/client-s3');
      const presigner = await import('@aws-sdk/s3-request-presigner');
      this.getSignedUrlFn = presigner.getSignedUrl;
      return new mod.S3Client({
        endpoint: env.STORAGE_S3_ENDPOINT,
        region: env.STORAGE_S3_REGION ?? 'auto',
        credentials: {
          accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID!,
          secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY!,
        },
        // Cloudflare R2 needs path-style addressing.
        forcePathStyle: true,
      });
    })();
    return this.clientPromise;
  }

  async put(opts: {
    clinicId: number;
    folder: string;
    filename: string;
    body: Buffer | Uint8Array;
    mimeType: string;
  }): Promise<PutResult> {
    const key = buildKey(opts.clinicId, opts.folder, opts.filename);
    const c = await this.client();
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    await c.send(
      new PutObjectCommand({
        Bucket: env.STORAGE_S3_BUCKET,
        Key: key,
        Body: opts.body,
        ContentType: opts.mimeType,
      })
    );
    const publicUrl = env.STORAGE_S3_PUBLIC_URL_BASE
      ? `${env.STORAGE_S3_PUBLIC_URL_BASE.replace(/\/$/, '')}/${key}`
      : null;
    return {
      storageKey: key,
      publicUrl,
      sizeBytes: opts.body.byteLength,
      mimeType: opts.mimeType,
    };
  }

  async getReadable(storageKey: string): Promise<NodeJS.ReadableStream> {
    const c = await this.client();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const out = await c.send(
      new GetObjectCommand({ Bucket: env.STORAGE_S3_BUCKET, Key: storageKey })
    );
    return out.Body as NodeJS.ReadableStream;
  }

  async getSignedUrl(storageKey: string, expiresInSec = 3600): Promise<string> {
    const c = await this.client();
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const cmd = new GetObjectCommand({
      Bucket: env.STORAGE_S3_BUCKET,
      Key: storageKey,
    });
    return this.getSignedUrlFn!(c, cmd, { expiresIn: expiresInSec });
  }

  async delete(storageKey: string): Promise<void> {
    const c = await this.client();
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await c.send(
      new DeleteObjectCommand({ Bucket: env.STORAGE_S3_BUCKET, Key: storageKey })
    );
  }
}

// ---------------------------------------------------------------------------

export const storage: Storage =
  env.STORAGE_DRIVER === 's3'
    ? new S3Storage()
    : new LocalStorage(env.STORAGE_LOCAL_DIR ?? './uploads');
