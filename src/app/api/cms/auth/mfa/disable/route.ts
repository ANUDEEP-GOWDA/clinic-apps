// Disables MFA for the currently logged-in user. Requires current TOTP code as confirmation.
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

  let body: { code?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  if (typeof body.code !== 'string') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.mfaEnabled || !user.mfaSecret) {
    return NextResponse.json({ error: 'mfa_not_enabled' }, { status: 400 });
  }

  const valid = authenticator.verify({ token: body.code, secret: user.mfaSecret });
  if (!valid) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { mfaEnabled: false, mfaSecret: null },
  });

  log.info('mfa.disabled', { userId: session.userId });
  return NextResponse.json({ ok: true });
}
