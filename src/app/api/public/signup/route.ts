import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth';
import { check, clientKey } from '@/lib/rate-limit';
import { withIdempotency } from '@/lib/idempotency';
import { env } from '@/lib/env';
import { log } from '@/lib/log';
import { Role } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  clinicName?: string;
  clinicSlug?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  inviteCode?: string;
};

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;
const RESERVED_SLUGS = new Set([
  'cms', 'api', 'app', 'admin', 'login', 'signup',
  'dashboard', 'static', 'public', '_next',
]);

/**
 * POST /api/public/signup
 *
 * Creates a new Clinic + the first OWNER user. This is the SaaS front door.
 *
 * Body: { clinicName, clinicSlug, ownerName, ownerEmail, ownerPassword,
 *         inviteCode? }
 *
 * If SIGNUP_INVITE_CODE env var is set, the request must include a matching
 * inviteCode. Useful for closed beta. Leave the env unset for open signup.
 *
 * On success, sets a session for the new owner and returns the clinic slug
 * so the client redirects into /cms.
 */
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

  // Invite code gate (closed beta).
  if (env.SIGNUP_INVITE_CODE && body.inviteCode !== env.SIGNUP_INVITE_CODE) {
    return NextResponse.json({ error: 'invalid_invite' }, { status: 403 });
  }

  const clinicName = (body.clinicName ?? '').trim();
  const clinicSlug = (body.clinicSlug ?? '').trim().toLowerCase();
  const ownerName = (body.ownerName ?? '').trim();
  const ownerEmail = (body.ownerEmail ?? '').trim().toLowerCase();
  const ownerPassword = body.ownerPassword ?? '';

  if (!clinicName) return NextResponse.json({ error: 'clinic_name_required' }, { status: 400 });
  if (!SLUG_RE.test(clinicSlug)) {
    return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });
  }
  if (RESERVED_SLUGS.has(clinicSlug)) {
    return NextResponse.json({ error: 'reserved_slug' }, { status: 400 });
  }
  if (!ownerName) return NextResponse.json({ error: 'owner_name_required' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  const pwErr = validatePassword(ownerPassword);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  const { result } = await withIdempotency(req, 'signup', async () => {
    // Slug uniqueness is enforced by the DB unique constraint, but check
    // first to give a clean error.
    const existing = await prisma.clinic.findUnique({ where: { slug: clinicSlug } });
    if (existing) return { ok: false as const, error: 'slug_taken' };

    const passwordHash = await hashPassword(ownerPassword);

    // Create clinic + owner + default settings in one transaction.
    const clinic = await prisma.$transaction(async (tx:any) => {
      const c = await tx.clinic.create({
        data: { slug: clinicSlug, name: clinicName },
      });
      await tx.user.create({
        data: {
          clinicId: c.id,
          name: ownerName,
          email: ownerEmail,
          passwordHash,
          role: Role.OWNER,
        },
      });
      await tx.settings.create({
        data: {
          clinicId: c.id,
          clinicName,
        },
      });
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
    clinicSlug: result.clinicSlug,
    loginAt: `/cms/login?clinic=${encodeURIComponent(result.clinicSlug)}`,
  });
}
