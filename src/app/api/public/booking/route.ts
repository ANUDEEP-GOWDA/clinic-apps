import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveClinicForPublicRequest } from '@/lib/tenant';
import { check, clientKey } from '@/lib/rate-limit';
import { withIdempotency } from '@/lib/idempotency';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BookingPayload = {
  doctorId: number;
  serviceId?: number | null;
  slotDatetime: string;
  durationMin?: number;
  reasonForVisit?: string;
  patient: { name: string; phone: string };
};

/**
 * POST /api/public/booking?clinic=<slug>
 *
 * Public-facing. Creates a Card in `request` state for the named clinic.
 * - Clinic is resolved from URL/header — never trusted from body.
 * - Idempotent via X-Idempotency-Key (Stripe-style).
 * - Rate-limited per IP.
 *
 * Returns: { ok: true, cardPublicId } so the booker can poll/cancel by
 * publicId without exposing the integer id.
 */
export async function POST(req: NextRequest) {
  if (!check(clientKey(req, 'booking'), { capacity: 6, refillPerMinute: 3 })) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const clinic = await resolveClinicForPublicRequest(req);
  if (!clinic) return NextResponse.json({ error: 'clinic_not_found' }, { status: 404 });

  let body: BookingPayload;
  try {
    body = (await req.json()) as BookingPayload;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (!body.doctorId || !body.slotDatetime || !body.patient?.name || !body.patient?.phone) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  const slotDate = new Date(body.slotDatetime);
  if (isNaN(slotDate.getTime())) return NextResponse.json({ error: 'invalid_slot' }, { status: 400 });
  if (slotDate.getTime() < Date.now() - 60_000) {
    return NextResponse.json({ error: 'slot_in_past' }, { status: 400 });
  }

  const { result, replayed } = await withIdempotency(req, 'booking', async () => {
    // Confirm doctor (and optional service) belong to this clinic.
    const doctor = await prisma.doctor.findFirst({
      where: { id: body.doctorId, clinicId: clinic.id, active: true },
    });
    if (!doctor) return { ok: false as const, error: 'doctor_not_found' };

    if (body.serviceId) {
      const svc = await prisma.service.findFirst({
        where: { id: body.serviceId, clinicId: clinic.id, active: true },
      });
      if (!svc) return { ok: false as const, error: 'service_not_found' };
    }

    const phone = body.patient.phone.trim();
    const name = body.patient.name.trim();

    // Patient is unique per (clinic, phone). Upsert.
    const patient = await prisma.patient.upsert({
      where: { clinicId_phone: { clinicId: clinic.id, phone } },
      update: { name },
      create: { clinicId: clinic.id, name, phone },
    });

    const card = await prisma.card.create({
      data: {
        clinicId: clinic.id,
        patientId: patient.id,
        doctorId: body.doctorId,
        serviceId: body.serviceId ?? null,
        type: 'request',
        state: 'active',
        reasonForVisit: (body.reasonForVisit ?? '').slice(0, 1000),
        slotDatetime: slotDate,
        durationMin: body.durationMin || doctor.consultationDurationMin || 15,
        events: {
          create: {
            clinicId: clinic.id,
            fromType: null,
            toType: 'request',
            fromState: null,
            toState: 'active',
            payload: { source: 'public_booking' },
          },
        },
      },
      select: { id: true, publicId: true },
    });

    log.info('booking.created', {
      clinicId: clinic.id,
      cardId: card.id,
      doctorId: body.doctorId,
    });

    return { ok: true as const, cardPublicId: card.publicId };
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, cardPublicId: result.cardPublicId, replayed });
}
