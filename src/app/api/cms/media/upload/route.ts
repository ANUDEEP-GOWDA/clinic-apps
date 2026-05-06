import { handler } from '@/lib/route-handler';
import { storage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_PREFIXES = ['image/', 'application/pdf'];

export const POST = handler({ action: 'media.upload' }, async (ctx, req) => {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return ctx.bad('no_file');
  if (file.size > MAX_BYTES) return ctx.bad('file_too_large');

  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED_PREFIXES.some((p) => mime.startsWith(p))) {
    return ctx.bad('mime_not_allowed');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const put = await storage.put({
    clinicId: ctx.session.clinicId,
    folder: 'media',
    filename: file.name,
    body: bytes,
    mimeType: mime,
  });

  const created = await ctx.tdb.media.create({
    data: {
      filename: file.name,
      storageKey: put.storageKey,
      mimeType: mime,
      sizeBytes: bytes.byteLength,
      uploadedBy: ctx.session.userId,
    },
  });

  await ctx.audit('media.uploaded', 'Media', created.id, {
    storageKey: put.storageKey,
  });

  return ctx.ok({
    ok: true,
    media: {
      id: created.id,
      filename: created.filename,
      mimeType: created.mimeType,
      sizeBytes: created.sizeBytes,
      url: put.publicUrl ?? (await storage.getSignedUrl(put.storageKey)),
    },
  });
});
