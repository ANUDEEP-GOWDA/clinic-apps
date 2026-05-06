import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveClinicForPublicRequest } from '@/lib/tenant';
import { getFreeSlots } from '@/lib/slots';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/public/slots?clinic=<slug>&doctorId=<id>&date=YYYY-MM-DD
 *
 * Free slots for one doctor on one date, scoped to the clinic from the URL.
 * Reads Postgres directly — no snapshot layer anymore.
 */
export async function GET(req: NextRequest) {
  const clinic = await resolveClinicForPublicRequest(req);
  if (!clinic) return NextResponse.json({ error: 'clinic_not_found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const doctorId = Number(searchParams.get('doctorId'));
  const date = searchParams.get('date');
  if (!doctorId || !date) {
    return NextResponse.json({ error: 'doctorId and date required' }, { status: 400 });
  }

  const settings = await prisma.settings.findUnique({
    where: { clinicId: clinic.id },
  });
  const tz = settings?.timezone || 'Asia/Kolkata';

  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) {
    return NextResponse.json({ error: 'invalid_date' }, { status: 400 });
  }
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  const slots = await getFreeSlots({
    clinicId: clinic.id,
    doctorId,
    date: anchor,
    timezone: tz,
  });
  return NextResponse.json({ slots });
}
