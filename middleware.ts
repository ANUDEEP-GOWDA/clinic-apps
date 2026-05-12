import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'clinic_session';

// Domains we never treat as custom clinic domains.
const SYSTEM_HOST_SUFFIXES = [
  '.railway.app',
  '.up.railway.app',
  'localhost',
  '.localhost',
  '.vercel.app',
];

function isSystemHost(host: string): boolean {
  const h = host.toLowerCase().split(':')[0];
  return SYSTEM_HOST_SUFFIXES.some((s) =>
    s.startsWith('.') ? h.endsWith(s) || h === s.slice(1) : h === s
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = (req.headers.get('host') || '').toLowerCase().split(':')[0];

  // ---------- Custom-domain rewrite (for public site only) ----------
  // If the request host is not our system host AND the path is the root or
  // an unscoped public path, rewrite to /c/<slug>/... by looking up the
  // domain. We use a header to signal the rewrite so the page can resolve
  // the clinic via that header (lib/tenant.ts already supports x-clinic-slug).
  if (
    host && !isSystemHost(host) &&
    !pathname.startsWith('/cms') &&
    !pathname.startsWith('/api/cms') &&
    !pathname.startsWith('/api/cron') &&
    !pathname.startsWith('/api/public/signup') &&
    !pathname.startsWith('/api/public/forgot-password') &&
    !pathname.startsWith('/api/public/reset-password') &&
    !pathname.startsWith('/signup') &&
    !pathname.startsWith('/forgot-password') &&
    !pathname.startsWith('/reset-password') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/c/')
  ) {
    // We can't do a DB lookup in edge middleware easily, so we just pass
    // the host through; the page-level resolver (tenant.ts) handles it.
    const res = NextResponse.next();
    res.headers.set('x-host-domain', host);
    return res;
  }

  // ---------- CMS auth gate ----------
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
