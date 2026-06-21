/**
 * Custom domain rewriting middleware.
 *
 * When a request arrives on a custom clinic domain (e.g. littleheartclinic.com),
 * this middleware rewrites it internally to /c/[clinicSlug]/... so the patient
 * sees their clinic's branded URL — the railway.app origin is never exposed.
 *
 * Rewrite (not redirect) means:
 *   littleheartclinic.com/        → served as /c/littleheart/
 *   littleheartclinic.com/book    → served as /c/littleheart/book
 *   (browser URL stays as littleheartclinic.com throughout)
 *
 * SECURITY: custom domains are locked to public paths only. The CMS
 * (/cms/...) and all CMS APIs (/api/cms/...) are completely unreachable
 * via a clinic's custom domain. Any path not on the whitelist returns 404.
 * This prevents session-cookie hijacking through the branded domain.
 *
 * Lookup results are cached in-memory per Edge isolate for 5 minutes.
 *
 * Railway setup required (one-time per clinic domain):
 *   1. Clinic owner adds domain in Railway → Settings → Networking → Custom Domain
 *   2. Railway provisions the SSL cert automatically
 *   3. Clinic owner sets CNAME at their DNS provider: @ CNAME cname.railway.app
 *   4. Clinic owner enters domain in CMS → Settings → Custom Domain → Save
 */
import { NextRequest, NextResponse } from 'next/server';

// System hostnames — never treated as custom clinic domains
const SYSTEM_SUFFIXES = ['railway.app', 'vercel.app', 'localhost', '127.0.0.1'];

// Public API paths the booking page legitimately calls.
// ONLY these /api/ paths are reachable from a custom domain.
const ALLOWED_API_PREFIXES = [
  '/api/public/slots',
  '/api/public/booking',
  '/api/public/call-request',
];

// Public page paths that get rewritten to /c/[slug]/...
// Every other non-asset path is blocked with 404.
const REWRITEABLE_PATHS = new Set(['/', '/book']);

// In-memory slug cache keyed by custom domain. Entries expire after 5 min.
const cache = new Map<string, { slug: string | null; exp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function resolveSlug(host: string, appOrigin: string): Promise<string | null> {
  const now = Date.now();
  const cached = cache.get(host);
  if (cached && cached.exp > now) return cached.slug;

  try {
    const res = await fetch(
      `${appOrigin}/api/internal/domain-to-slug?host=${encodeURIComponent(host)}`,
      { next: { revalidate: 0 } }
    );
    const json = (await res.json()) as { slug?: string | null };
    const slug = json.slug ?? null;
    cache.set(host, { slug, exp: now + CACHE_TTL_MS });
    return slug;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase().split(':')[0];

  // Not a custom domain — serve the SaaS app normally
  if (!host || SYSTEM_SUFFIXES.some((s) => host.endsWith(s))) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // Always pass through Next.js internals and favicon
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Resolve the clinic for this custom domain
  const appOrigin =
    process.env.APP_URL?.replace(/\/$/, '') ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const slug = await resolveSlug(host, appOrigin);

  // Unknown domain — let Next.js serve a 404 naturally
  if (!slug) return NextResponse.next();

  // Allowed API paths pass through unchanged (booking, slots, call-request)
  if (ALLOWED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Rewriteable public pages → /c/[slug]/...
  if (REWRITEABLE_PATHS.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === '/' ? `/c/${slug}` : `/c/${slug}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Everything else on a custom domain is blocked — CMS, auth, signup, etc.
  return new NextResponse(null, { status: 404 });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

