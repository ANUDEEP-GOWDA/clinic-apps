import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { validatePassword } from '@/lib/password-policy';
import { check, clientKey } from '@/lib/rate-limit';
import { withIdempotency } from '@/lib/idempotency';
import { env } from '@/lib/env';
import { log } from '@/lib/log';
import { Role } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  clinicName?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  inviteCode?: string;
};

const RESERVED_SLUGS = new Set([
  'cms', 'api', 'app', 'admin', 'login', 'signup', 'public',
  'dashboard', 'static', '_next', 'c',
]);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'clinic';
}

async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let n = 0;
  while (true) {
    if (!RESERVED_SLUGS.has(candidate)) {
      const existing = await prisma.clinic.findUnique({
        where: { slug: candidate },
      });
      if (!existing) return candidate;
    }
    n++;
    const suffix = Math.random().toString(36).slice(2, 6);
    candidate = `${base}-${suffix}`.slice(0, 32);
    if (n > 10) {
      candidate = `clinic-${Date.now().toString(36)}`;
      break;
    }
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  if (!check(clientKey(req, 'signup'), { capacity: 4, refillPerMinute: 1 })) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (env.SIGNUP_INVITE_CODE && body.inviteCode !== env.SIGNUP_INVITE_CODE) {
    return NextResponse.json({ error: 'invalid_invite' }, { status: 403 });
  }

  const clinicName = (body.clinicName ?? '').trim();
  const ownerName = (body.ownerName ?? '').trim();
  const ownerEmail = (body.ownerEmail ?? '').trim().toLowerCase();
  const ownerPassword = body.ownerPassword ?? '';

  if (!clinicName) return NextResponse.json({ error: 'clinic_name_required' }, { status: 400 });
  if (!ownerName) return NextResponse.json({ error: 'owner_name_required' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  const pwErr = validatePassword(ownerPassword);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  const { result } = await withIdempotency(req, 'signup', async () => {
    // Email is globally unique now.
    const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
    if (existingUser) return { ok: false as const, error: 'email_taken' };

    const slug = await uniqueSlug(slugify(clinicName));
    const passwordHash = await hashPassword(ownerPassword);

    const clinic = await prisma.$transaction(async (tx) => {
      const c = await tx.clinic.create({ data: { slug, name: clinicName } });
      await tx.user.create({
        data: {
          clinicId: c.id,
          name: ownerName,
          email: ownerEmail,
          passwordHash,
          role: Role.OWNER,
        },
      });
      await tx.settings.create({ data: { clinicId: c.id, clinicName } });
      await tx.auditLog.create({
        data: {
          clinicId: c.id,
          action: 'clinic.created',
          entityType: 'Clinic',
          entityId: c.id,
        },
      });
      return c;
    });

    log.info('signup.clinic_created', { clinicId: clinic.id, slug: clinic.slug });
    return { ok: true as const, clinicSlug: clinic.slug };
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    publicSiteUrl: `/c/${result.clinicSlug}`,
    loginAt: '/cms/login',
  });
}
