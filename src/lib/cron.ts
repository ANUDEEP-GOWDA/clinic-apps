/**
 * Shared cron authentication.
 *
 * Cron endpoints are protected by a shared secret in the Authorization
 * header (`Bearer <CRON_SECRET>`). Vercel Cron, Railway cron, GitHub
 * Actions — anything that can hit a URL with a header — works.
 *
 * Don't accept the secret as a query param: query strings get logged
 * far more often than headers.
 */
import { NextRequest, NextResponse } from 'next/server';
import { env } from './env';
import { prisma } from './db';
import { log } from './log';

export function requireCronAuth(req: NextRequest): NextResponse | null {
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${env.CRON_SECRET}`;
  // Constant-time compare. Don't help timing attackers.
  if (auth.length !== expected.length) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  let diff = 0;
  for (let i = 0; i < auth.length; i++) {
    diff |= auth.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (diff !== 0) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * Wrap a cron handler with run-tracking + auth.
 */
export function cronHandler(
  job: string,
  fn: () => Promise<Record<string, unknown>>
) {
  return async (req: NextRequest) => {
    const denied = requireCronAuth(req);
    if (denied) return denied;

    const run = await prisma.cronRun.create({ data: { job } });
    try {
      const details = await fn();
      await prisma.cronRun.update({
        where: { id: run.id },
        data: { finishedAt: new Date(), ok: true, details },
      });
      return NextResponse.json({ ok: true, ...details });
    } catch (e) {
      log.error('cron.failed', { job, err: String(e) });
      await prisma.cronRun.update({
        where: { id: run.id },
        data: {
          finishedAt: new Date(),
          ok: false,
          details: { error: String(e) },
        },
      });
      return NextResponse.json(
        { ok: false, error: String(e) },
        { status: 500 }
      );
    }
  };
}
