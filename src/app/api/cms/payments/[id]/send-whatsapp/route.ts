import { handler } from '@/lib/route-handler';
import { sendTemplate } from '@/lib/whatsapp';
import { rupeesFromPaise } from '@/lib/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = handler<{ id: string }>(
  { action: 'payment.update' },
  async (ctx, req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');

    const body = (await req.json().catch(() => ({}))) as { type?: 'request' | 'receipt' };
    const msgType = body.type === 'receipt' ? 'receipt' : 'request';

    const payment = await ctx.tdb.payment.findFirst({
      where: { id },
      include: {
        patient: { select: { name: true, phone: true } },
        card: { select: { doctor: { select: { name: true } } } },
      },
    });
    if (!payment) return ctx.notFound();

    const p = payment as any;
    const amountStr = `₹${rupeesFromPaise(p.totalAmount * 100)}`;

    let result;
    if (msgType === 'request') {
      if (!p.razorpayLinkUrl) return ctx.bad('no_payment_link');

      result = await sendTemplate({
        clinicId: ctx.session.clinicId,
        phone: p.patient.phone,
        templateName: 'payment_request',
        bodyParams: [
          p.patient.name,
          amountStr,
          p.card?.doctor?.name ?? 'the doctor',
          p.razorpayLinkUrl,
        ],
        patientId: p.patientId,
        cardId: p.cardId ?? undefined,
      });
    } else {
      if (p.status !== 'paid') return ctx.bad('payment_not_yet_paid');

      result = await sendTemplate({
        clinicId: ctx.session.clinicId,
        phone: p.patient.phone,
        templateName: 'payment_receipt',
        bodyParams: [p.patient.name, amountStr, p.billNumber],
        patientId: p.patientId,
        cardId: p.cardId ?? undefined,
      });
    }

    if (!result.ok) return ctx.bad(result.error ?? 'whatsapp_send_failed');

    await ctx.audit(`payment.whatsapp_${msgType}_sent`, 'Payment', id);
    return ctx.ok({ ok: true });
  }
);
