/**
 * POST /api/public/razorpay-webhook
 *
 * Razorpay sends a POST here when a payment link is paid.
 * Configure the URL in Razorpay Dashboard → Webhooks.
 * Enable event: payment_link.paid
 *
 * Security: verified via HMAC-SHA256 signature header.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  if (!verifyWebhookSignature(rawBody, signature)) {
    log.warn('razorpay_webhook.invalid_signature');
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment_link?: { entity?: { id?: string } };
      payment?: {
        entity?: { id?: string; amount?: number; status?: string };
      };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (event.event !== 'payment_link.paid') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const linkId = event.payload?.payment_link?.entity?.id;
  const razorpayPaymentId = event.payload?.payment?.entity?.id;

  if (!linkId) {
    return NextResponse.json({ error: 'missing_link_id' }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { razorpayLinkId: linkId },
  });

  if (!payment) {
    log.warn('razorpay_webhook.payment_not_found', { linkId });
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (payment.status === 'paid') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'paid',
      paidAt: new Date(),
      razorpayPaymentId: razorpayPaymentId ?? null,
    },
  });

  log.info('razorpay_webhook.payment_marked_paid', {
    paymentId: payment.id,
    billNumber: payment.billNumber,
    razorpayPaymentId,
  });

  return NextResponse.json({ ok: true });
}
