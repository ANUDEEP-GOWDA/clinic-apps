import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge middleware. Two responsibilities:
 *
 *   1. Force HTTPS in production (Railway/Vercel give us X-Forwarded-Proto).
 *   2. Gate /cms/* and /api/cms/* on session cookie presence.
 *      Real session validation happens server-side in lib/auth.ts; here we
 *      only short-circuit obviously-unauthenticated traffic.
 *
 * Public site (/c/<slug>/...), public APIs (/api/public/...), signup
 * (/signup, /api/public/signup), and cron endpoints (/api/cron/* — they're
 * gated by CRON_SECRET in the route itself) are not touched here.
 */

const SESSION_COOKIE = 'clinic_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isCmsPage = pathname.startsWith('/cms');
  const isCmsApi = pathname.startsWith('/api/cms');

  if (isCmsPage || isCmsApi) {
    const isLoginPage = pathname === '/cms/login';
    const isLoginApi = pathname === '/api/cms/auth/login';
    if (isLoginPage || isLoginApi) return NextResponse.next();

    const cookie = req.cookies.get(SESSION_COOKIE);
    if (!cookie) {
      if (isCmsApi) {
        return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = '/cms/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cms/:path*', '/api/cms/:path*'],
};
