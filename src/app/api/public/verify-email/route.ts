import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/db';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?error=missing_token', req.url));
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid_or_expired', req.url));
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
  ]);

  log.info('email.verified', { userId: record.userId });
  return NextResponse.redirect(new URL('/verify-email?success=1', req.url));
}
