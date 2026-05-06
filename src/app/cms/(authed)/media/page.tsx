import { ssrTenant } from '@/lib/ssr-tenant';
import { storage } from '@/lib/storage';
import { env } from '@/lib/env';
import MediaUploader from '@/components/cms/MediaUploader';

export const dynamic = 'force-dynamic';

export default async function MediaPage() {
  const { tdb } = await ssrTenant();
  const media = await tdb.media.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // Resolve a viewable URL per item. For local driver, it's a static path.
  // For S3 with a public bucket, it's the public URL base + key. For
  // private S3 we'd issue a signed URL — kept short here for cost reasons.
  const items = await Promise.all(
    media.map(async (m) => {
      let url: string;
      if (env.STORAGE_DRIVER === 's3' && env.STORAGE_S3_PUBLIC_URL_BASE) {
        url = `${env.STORAGE_S3_PUBLIC_URL_BASE.replace(/\/$/, '')}/${m.storageKey}`;
      } else if (env.STORAGE_DRIVER === 'local') {
        url = `/uploads/${m.storageKey}`;
      } else {
        url = await storage.getSignedUrl(m.storageKey, 3600);
      }
      return {
        id: m.id,
        filename: m.filename,
        path: url,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes,
      };
    })
  );

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Media</h1>
      <MediaUploader media={items} />
    </div>
  );
}
