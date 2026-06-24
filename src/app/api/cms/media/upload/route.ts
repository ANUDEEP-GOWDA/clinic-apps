import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export const POST = handler({ action: 'media.upload' }, async (ctx, req) => {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return ctx.bad('no_file');
  if (file.size > MAX_BYTES) return ctx.bad('file_too_large');

  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED_TYPES.includes(mime)) return ctx.bad('mime_not_allowed');

  const bytes = Buffer.from(await file.arrayBuffer());

  const created = await ctx.tdb.media.create({
    data: {
      filename: file.name,
      storageKey: '',
      mimeType: mime,
      sizeBytes: bytes.byteLength,
      bytes,
      uploadedBy: ctx.session.userId,
    },
  });

  await ctx.audit('media.uploaded', 'Media', created.id, { filename: file.name });

  return ctx.ok({
    media: {
      id: created.id,
      filename: created.filename,
      mimeType: created.mimeType,
      sizeBytes: created.sizeBytes,
      url: `/api/media/${created.id}`,
    },
  });
});
