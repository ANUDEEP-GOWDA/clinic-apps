import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/password-policy';
import { check, clientKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!check(clientKey(req, 'reset'), { capacity: 5, refillPerMinute: 2 })) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }
  let body: { token?: unknown; password?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 }); }
  if (typeof body.token !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid_request' }, { status: 400 });
  }
  const pwErr = validatePassword(body.password);
  if (pwErr) return NextResponse.json({ ok: false, error: pwErr }, { status: 400 });

  const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ ok: false, error: 'invalid_token' }, { status: 400 });
  }

  const hash = await hashPassword(body.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: hash, failedLoginCount: 0, lockedUntil: null },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
