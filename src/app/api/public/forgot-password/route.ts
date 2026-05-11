import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { env } from '@/lib/env';
import { check, clientKey } from '@/lib/rate-limit';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOKEN_TTL_HOURS = 1;

export async function POST(req: NextRequest) {
  if (!check(clientKey(req, 'forgot'), { capacity: 5, refillPerMinute: 2 })) {
    return NextResponse.json({ ok: true }); // generic OK even when limited
  }
  let body: { email?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: true }); }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { clinic: true },
  });
  // Always respond OK; never leak whether email exists.
  if (!user || !user.active) return NextResponse.json({ ok: true });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60_000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const link = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${rawToken}`;
  const subj = `Reset your password — ${user.clinic.name}`;
  const html = `
    <p>Hi ${user.name},</p>
    <p>Someone (hopefully you) asked to reset the password for your account on <b>${user.clinic.name}</b>.</p>
    <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#0f172a;color:white;border-radius:8px;text-decoration:none">Reset password</a></p>
    <p>This link expires in 1 hour. If you didn't ask for this, ignore this email.</p>
  `;
  const r = await sendEmail({ to: user.email, subject: subj, html });
  if (!r.ok) log.error('forgot_password.email_failed', { userId: user.id, err: r.error });

  return NextResponse.json({ ok: true });
}
