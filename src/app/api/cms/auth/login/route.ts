import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { check, clientKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/cms/auth/login
 *
 * Body: { clinicSlug, email, password }
 *
 * Response on success:
 *   { ok: true }                          — fully signed in
 *   { ok: true, requiresMfa: true }       — half-session set, prompt for TOTP
 *
 * Response on failure (always status 401, generic message — don't leak whether
 * email exists):
 *   { ok: false, error: 'invalid_credentials' | 'locked' | 'inactive' }
 */
export async function POST(req: NextRequest) {
  // Rate-limit: 5 attempts/min per IP, burst 10. Tighter than other routes
  // because login is the obvious target for credential-stuffing.
  if (!check(clientKey(req, 'login'), { capacity: 10, refillPerMinute: 5 })) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429 }
    );
  }

  let body: { clinicSlug?: unknown; email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_request' },
      { status: 400 }
    );
  }
  if (
    typeof body.clinicSlug !== 'string' ||
    typeof body.email !== 'string' ||
    typeof body.password !== 'string'
  ) {
    return NextResponse.json(
      { ok: false, error: 'invalid_request' },
      { status: 400 }
    );
  }

  const result = await loginUser({
    clinicSlug: body.clinicSlug,
    email: body.email,
    password: body.password,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }
  return NextResponse.json(result, { status: 200 });
}
