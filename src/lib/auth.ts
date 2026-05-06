/**
 * Auth.
 *
 * Strategy: HTTP-only iron-session cookie. Session payload:
 *   { userId, clinicId, role, email, name, mfaPending? }
 *
 * Login flow today (password-only):
 *   POST /api/cms/auth/login { clinicSlug, email, password }
 *     → loginUser() → session set → redirect to /cms
 *
 * Login flow when MFA is enabled (NOT YET WIRED):
 *   POST /api/cms/auth/login → returns { requiresMfa: true } + sets a
 *     half-session with mfaPending=true. Client prompts for TOTP.
 *   POST /api/cms/auth/mfa/verify { code } → completes the session.
 *
 * Hardening:
 *   - bcrypt cost 12 (up from 10).
 *   - Failed login counter + lockout (in DB so it survives restarts).
 *   - Constant-ish-time response on bad email vs bad password (avoid
 *     leaking whether an email exists).
 *   - Per-IP rate limit applied at the route layer (lib/rate-limit.ts).
 */
import { cookies } from 'next/headers';
import { getIronSession, type SessionOptions } from 'iron-session';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from './db';
import { env } from './env';
import { log } from './log';

export type CmsSession = {
  userId?: number;
  clinicId?: number;
  clinicSlug?: string;
  role?: Role;
  email?: string;
  name?: string;
  // True between password verification and TOTP verification when MFA is on.
  mfaPending?: boolean;
};

export type AuthenticatedSession = {
  userId: number;
  clinicId: number;
  clinicSlug: string;
  role: Role;
  email: string;
  name: string;
};

const SESSION_COOKIE = 'clinic_session';
const BCRYPT_COST = 12;
const MAX_FAILED_LOGINS = 8;
const LOCK_MINUTES = 15;

function sessionOptions(): SessionOptions {
  return {
    password: env.SESSION_SECRET,
    cookieName: SESSION_COOKIE,
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
    },
  };
}

export async function getSession(): Promise<CmsSession> {
  return getIronSession<CmsSession>(cookies(), sessionOptions());
}

/**
 * Throws 'UNAUTHENTICATED' if the session lacks any of the three required
 * fields (userId, clinicId, role) or if MFA is still pending. Routes catch
 * this and return 401.
 */
export async function requireSession(): Promise<AuthenticatedSession> {
  const s = await getSession();
  if (!s.userId || !s.clinicId || !s.role || !s.clinicSlug || s.mfaPending) {
    throw new Error('UNAUTHENTICATED');
  }
  return {
    userId: s.userId,
    clinicId: s.clinicId,
    clinicSlug: s.clinicSlug,
    role: s.role,
    email: s.email!,
    name: s.name!,
  };
}

export type LoginResult =
  | { ok: true; requiresMfa?: false }
  | { ok: true; requiresMfa: true } // half-session set; call mfa/verify next
  | { ok: false; error: 'invalid_credentials' | 'locked' | 'inactive' };

export async function loginUser(opts: {
  clinicSlug: string;
  email: string;
  password: string;
}): Promise<LoginResult> {
  const clinicSlug = opts.clinicSlug.trim().toLowerCase();
  const email = opts.email.trim().toLowerCase();

  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug },
  });
  // Always run bcrypt to keep timing similar even when clinic/user missing.
  const dummyHash = '$2a$12$abcdefghijklmnopqrstuv1234567890ABCDEFGHIJKLMN0123456';

  if (!clinic || !clinic.active) {
    await bcrypt.compare(opts.password, dummyHash);
    return { ok: false, error: 'invalid_credentials' };
  }

  const user = await prisma.user.findUnique({
    where: { clinicId_email: { clinicId: clinic.id, email } },
  });

  if (!user) {
    await bcrypt.compare(opts.password, dummyHash);
    return { ok: false, error: 'invalid_credentials' };
  }

  if (!user.active) return { ok: false, error: 'inactive' };

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: 'locked' };
  }

  const valid = await bcrypt.compare(opts.password, user.passwordHash);
  if (!valid) {
    const newCount = user.failedLoginCount + 1;
    const shouldLock = newCount >= MAX_FAILED_LOGINS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: newCount,
        lockedUntil: shouldLock
          ? new Date(Date.now() + LOCK_MINUTES * 60_000)
          : null,
      },
    });
    if (shouldLock) {
      log.warn('login.locked', { userId: user.id, clinicId: clinic.id });
    }
    return { ok: false, error: 'invalid_credentials' };
  }

  // Success. Reset failure counter.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });

  const session = await getIronSession<CmsSession>(cookies(), sessionOptions());
  session.userId = user.id;
  session.clinicId = clinic.id;
  session.clinicSlug = clinic.slug;
  session.role = user.role;
  session.email = user.email;
  session.name = user.name;

  if (user.mfaEnabled) {
    // Half-session: requires TOTP verification before requireSession() passes.
    session.mfaPending = true;
    await session.save();
    return { ok: true, requiresMfa: true };
  }

  session.mfaPending = false;
  await session.save();
  log.info('login.ok', { userId: user.id, clinicId: clinic.id });
  return { ok: true };
}

export async function logoutUser(): Promise<void> {
  const session = await getIronSession<CmsSession>(cookies(), sessionOptions());
  session.destroy();
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/**
 * Minimal password policy. Tighten as needed.
 */
export function validatePassword(p: string): string | null {
  if (typeof p !== 'string') return 'password_required';
  if (p.length < 10) return 'password_too_short';
  if (p.length > 200) return 'password_too_long';
  return null;
}
