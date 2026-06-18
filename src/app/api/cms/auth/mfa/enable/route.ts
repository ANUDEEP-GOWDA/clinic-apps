// Confirms the TOTP code and saves the secret, turning MFA on for this user.
import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let session: Awaited<ReturnType<typeof requireSession>>;
  try { session = await requireSession(); } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let body: { secret?: unknown; code?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  if (typeof body.secret !== 'string' || typeof body.code !== 'string') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const valid = authenticator.verify({ token: body.code, secret: body.secret });
  if (!valid) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { mfaEnabled: true, mfaSecret: body.secret },
  });

  log.info('mfa.enabled', { userId: session.userId });
  return NextResponse.json({ ok: true });
}
