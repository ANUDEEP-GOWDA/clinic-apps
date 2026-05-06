import { handler } from '@/lib/route-handler';
import { storage } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export const POST = handler<{ id: string }>(
  { action: 'card.consultation.edit' },
  async (ctx, req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');

    const card = await ctx.tdb.card.findFirst({ where: { id } });
    if (!card) return ctx.notFound();

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return ctx.bad('no_file');
    if (file.size > MAX_BYTES) return ctx.bad('file_too_large');

    const bytes = Buffer.from(await file.arrayBuffer());
    const put = await storage.put({
      clinicId: ctx.session.clinicId,
      folder: 'attachments',
      filename: file.name,
      body: bytes,
      mimeType: file.type || 'application/octet-stream',
    });

    const created = await ctx.tdb.consultationAttachment.create({
      data: {
        cardId: id,
        filename: file.name,
        storageKey: put.storageKey,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: bytes.byteLength,
      },
    });

    await ctx.audit('card.attachment_added', 'ConsultationAttachment', created.id, {
      cardId: id,
    });

    return ctx.ok({
      ok: true,
      attachment: {
        id: created.id,
        filename: created.filename,
        mimeType: created.mimeType,
        sizeBytes: created.sizeBytes,
        url: put.publicUrl ?? (await storage.getSignedUrl(put.storageKey)),
      },
    });
  }
);
