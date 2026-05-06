import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveClinicForPublicRequest } from '@/lib/tenant';
import { check, clientKey } from '@/lib/rate-limit';
import { withIdempotency } from '@/lib/idempotency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { name: string; phone: string; preferredTime?: string; message?: string };

export async function POST(req: NextRequest) {
  if (!check(clientKey(req, 'call_request'), { capacity: 5, refillPerMinute: 2 })) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const clinic = await resolveClinicForPublicRequest(req);
  if (!clinic) return NextResponse.json({ error: 'clinic_not_found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.name || !body.phone) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const { result } = await withIdempotency(req, 'call_request', async () => {
    await prisma.callRequest.create({
      data: {
        clinicId: clinic.id,
        name: String(body.name).slice(0, 200),
        phone: String(body.phone).slice(0, 50),
        preferredTime: String(body.preferredTime ?? '').slice(0, 200),
        message: String(body.message ?? '').slice(0, 1000),
        state: 'pending',
      },
    });
    return { ok: true as const };
  });

  return NextResponse.json(result);
}
