// Returns a TOTP secret + QR code data URL for enrollment (does NOT enable MFA yet).
import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  let session: Awaited<ReturnType<typeof requireSession>>;
  try { session = await requireSession(); } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Generate a fresh secret every time setup is called (not yet saved to DB).
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, 'ClinicCMS', secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ secret, qrDataUrl });
}
