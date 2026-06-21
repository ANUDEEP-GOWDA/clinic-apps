import QRCode from 'qrcode';
import { handler } from '@/lib/route-handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = handler<{ id: string }>(
  { action: 'payment.read' },
  async (ctx, _req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');

    const payment = await ctx.tdb.payment.findFirst({
      where: { id },
      include: {
        patient: { select: { name: true, phone: true } },
        card: {
          select: {
            id: true,
            type: true,
            doctor: { select: { name: true } },
          },
        },
      },
    });
    if (!payment) return ctx.notFound();

    // Generate QR code for the payment link (returns data URL PNG)
    let qrDataUrl: string | null = null;
    const linkUrl = (payment as any).razorpayLinkUrl;
    if (linkUrl) {
      try {
        qrDataUrl = await QRCode.toDataURL(linkUrl, { width: 300, margin: 2 });
      } catch {
        // QR generation is best-effort
      }
    }

    return ctx.ok({ payment, qrDataUrl });
  }
);

export const PATCH = handler<{ id: string }>(
  { action: 'payment.update' },
  async (ctx, req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');

    const body = (await req.json().catch(() => ({}))) as { status?: string; notes?: string };
    const allowed = ['pending', 'paid', 'failed', 'refunded'];
    if (body.status && !allowed.includes(body.status)) return ctx.bad('invalid_status');

    const data: Record<string, unknown> = {};
    if (body.status) {
      data.status = body.status;
      if (body.status === 'paid') data.paidAt = new Date();
    }
    if (typeof body.notes === 'string') data.notes = body.notes;

    const updated = await ctx.tdb.payment.update({ where: { id }, data });
    await ctx.audit('payment.updated', 'Payment', id, { status: body.status });
    return ctx.ok({ payment: updated });
  }
);
