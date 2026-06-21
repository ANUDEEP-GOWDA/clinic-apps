import { handler } from '@/lib/route-handler';
import { createPaymentLink, isConfigured, rupeesFromPaise } from '@/lib/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LineItem = { name: string; qty: number; rate: number };

type CreateBody = {
  cardId?: number;
  patientId: number;
  lineItems: LineItem[];
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
  currency?: string;
};

export const GET = handler({ action: 'payment.read' }, async (ctx, req) => {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
  const status = url.searchParams.get('status') ?? '';

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    ctx.tdb.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 30,
      skip: (page - 1) * 30,
      include: {
        patient: { select: { name: true, phone: true } },
        card: { select: { id: true, doctor: { select: { name: true } } } },
      },
    }),
    ctx.tdb.payment.count({ where }),
  ]);

  return ctx.ok({ items, total, page });
});

export const POST = handler({ action: 'payment.create' }, async (ctx, req) => {
  const body = (await req.json().catch(() => ({}))) as CreateBody;

  if (
    !body.patientId ||
    !Array.isArray(body.lineItems) ||
    body.lineItems.length === 0
  ) {
    return ctx.bad('missing_fields');
  }

  const patient = await ctx.tdb.patient.findFirst({ where: { id: body.patientId } });
  if (!patient) return ctx.notFound();

  const lineItems: LineItem[] = body.lineItems.map((item) => ({
    name: String(item.name ?? ''),
    qty: Number(item.qty) || 1,
    rate: Math.round(Number(item.rate) || 0),
  }));

  const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const discountAmount = Math.max(0, Math.round(Number(body.discountAmount) || 0));
  const taxAmount = Math.max(0, Math.round(Number(body.taxAmount) || 0));
  const totalAmount = subtotal - discountAmount + taxAmount;
  const currency = body.currency ?? 'INR';

  if (totalAmount <= 0) return ctx.bad('total_must_be_positive');

  // Create record, then update with final bill number using the auto-generated ID
  const payment = await ctx.tdb.transaction(async (txdb) => {
    const p = await txdb.payment.create({
      data: {
        cardId: body.cardId ?? null,
        patientId: body.patientId,
        billNumber: 'PENDING',
        lineItems: lineItems as unknown as Parameters<typeof txdb.payment.create>[0]['data']['lineItems'],
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        currency,
        notes: body.notes ?? '',
        status: 'pending',
      },
    });
    const billNumber = `INV-${String(p.id).padStart(6, '0')}`;
    return txdb.payment.update({
      where: { id: p.id },
      data: { billNumber },
    });
  });

  // Get doctor name for description
  let doctorName = '';
  if (body.cardId) {
    const card = await ctx.tdb.card.findFirst({
      where: { id: body.cardId },
      include: { doctor: { select: { name: true } } },
    });
    doctorName = (card as any)?.doctor?.name ?? '';
  }

  // Create Razorpay payment link (best-effort — payment record exists either way)
  let razorpayLinkUrl = '';
  let razorpayLinkId = '';

  if (isConfigured()) {
    const amountStr = `₹${rupeesFromPaise(totalAmount * 100)}`;
    const description = doctorName
      ? `Consultation — Dr. ${doctorName}`
      : 'Clinic consultation bill';

    const linkResult = await createPaymentLink({
      amountPaise: totalAmount * 100,
      currency,
      description,
      customerName: patient.name,
      customerPhone: patient.phone,
      notes: {
        billNumber: (payment as any).billNumber,
        clinicId: String(ctx.session.clinicId),
      },
    });

    if (linkResult.ok) {
      razorpayLinkId = linkResult.linkId;
      razorpayLinkUrl = linkResult.shortUrl;
      await ctx.tdb.payment.update({
        where: { id: (payment as any).id },
        data: { razorpayLinkId, razorpayLinkUrl },
      });
    }
  }

  await ctx.audit('payment.created', 'Payment', (payment as any).id, {
    totalAmount,
    billNumber: (payment as any).billNumber,
  });

  return ctx.ok({
    payment: {
      ...(payment as any),
      razorpayLinkUrl,
      razorpayLinkId,
    },
  });
});
