// Called during login when mfaPending=true. Verifies TOTP and clears the pending flag.
import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId || !session.mfaPending) {
    return NextResponse.json({ error: 'no_pending_mfa' }, { status: 400 });
  }

  let body: { code?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  if (typeof body.code !== 'string') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.mfaSecret) {
    return NextResponse.json({ error: 'mfa_not_configured' }, { status: 400 });
  }

  const valid = authenticator.verify({ token: body.code, secret: user.mfaSecret });
  if (!valid) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 422 });
  }

  session.mfaPending = false;
  await session.save();

  log.info('mfa.verified', { userId: user.id });
  return NextResponse.json({ ok: true });
}
