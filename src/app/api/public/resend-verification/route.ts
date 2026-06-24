import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email-verification';
import { check, clientKey } from '@/lib/rate-limit';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!check(clientKey(req, 'resend-verify'), { capacity: 3, refillPerMinute: 1 })) {
    return NextResponse.json({ ok: true }); // silent rate limit
  }

  let body: { email?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email }, include: { clinic: true } });
  if (!user || !user.active || user.emailVerified) return NextResponse.json({ ok: true });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);

  await prisma.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('host') ?? req.nextUrl.host;
  const origin = `${proto}://${host}`;
  const r = await sendVerificationEmail({ user, rawToken, requestOrigin: origin });
  if (!r.ok) log.error('resend_verification.email_failed', { userId: user.id });

  return NextResponse.json({ ok: true });
}
