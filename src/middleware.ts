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
 * Lookup results are cached in-memory per Edge isolate for 5 minutes so the
 * internal API call only happens on cold first-visit per domain.
 *
 * Railway setup required (one-time per clinic domain):
 *   1. Clinic owner adds their domain to Railway → Settings → Networking → Custom Domain
 *   2. Railway provisions the SSL cert automatically
 *   3. Clinic owner sets CNAME from their DNS provider: @ CNAME cname.railway.app
 *   4. Clinic owner enters the domain in CMS → Settings → Custom Domain → Save
 */
import { NextRequest, NextResponse } from 'next/server';

// System hostnames that are never custom clinic domains
const SYSTEM_SUFFIXES = ['railway.app', 'vercel.app', 'localhost', '127.0.0.1'];

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
    // On lookup failure, let the request fall through unchanged
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase().split(':')[0];

  // Skip system hostnames — they serve the normal SaaS app
  if (!host || SYSTEM_SUFFIXES.some((s) => host.endsWith(s))) {
    return NextResponse.next();
  }

  // Determine the internal app origin for the lookup call.
  // APP_URL must be the railway.app URL, NOT the custom domain.
  const appOrigin =
    process.env.APP_URL?.replace(/\/$/, '') ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

  const slug = await resolveSlug(host, appOrigin);
  if (!slug) return NextResponse.next();

  // Rewrite the path: / → /c/slug/, /book → /c/slug/book, etc.
  const { pathname, search } = req.nextUrl;

  // Don't rewrite internal/api paths that may be called from this domain
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Build the internal path: preserve trailing slash, append search
  const clinicPath = `/c/${slug}${pathname === '/' ? '' : pathname}`;
  const url = req.nextUrl.clone();
  url.pathname = clinicPath;
  url.search = search;

  return NextResponse.rewrite(url);
}

export const config = {
  // Run on all paths except static assets and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
