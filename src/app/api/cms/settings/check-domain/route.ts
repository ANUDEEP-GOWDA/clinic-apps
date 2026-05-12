import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { promises as dns } from 'node:dns';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.[a-z0-9-]{1,63})+$/i;

/**
 * GET /api/cms/settings/check-domain?d=myclinic.com
 *
 * Resolves the CNAME and A records for the domain and tells the user
 * whether it appears to point at this app. We compare against the
 * hostname of APP_URL (Railway's default URL) since that's our canonical
 * target.
 */
export async function GET(req: NextRequest) {
  try { await requireSession(); }
  catch { return NextResponse.json({ ok: false, detail: 'unauthenticated' }, { status: 401 }); }

  const domain = (new URL(req.url).searchParams.get('d') || '').trim().toLowerCase();
  if (!domain || !DOMAIN_RE.test(domain)) {
    return NextResponse.json({ ok: false, detail: 'Invalid domain format.' });
  }

  // Our app's canonical hostname (from APP_URL env var).
  const appHost = (() => {
    try { return new URL(env.APP_URL).hostname.toLowerCase(); }
    catch { return ''; }
  })();

  try {
    // Try CNAME first (preferred for custom domains on Railway/Vercel).
    let cnames: string[] = [];
    try { cnames = (await dns.resolveCname(domain)).map((c) => c.toLowerCase()); }
    catch { /* no CNAME, fall through */ }

    if (cnames.length > 0) {
      const matchesApp = appHost && cnames.some((c) => c.includes('railway.app') || c === appHost);
      return NextResponse.json({
        ok: matchesApp,
        detail: matchesApp
          ? `CNAME → ${cnames[0]}`
          : `CNAME points to ${cnames[0]}, but should point to your app (railway.app).`,
      });
    }

    // No CNAME — try A records (less ideal but valid).
    const aRecords = await dns.resolve4(domain).catch(() => []);
    if (aRecords.length === 0) {
      return NextResponse.json({
        ok: false,
        detail: 'No DNS records found yet. CNAME usually takes a few minutes to propagate.',
      });
    }
    return NextResponse.json({
      ok: false,
      detail: `A record found (${aRecords[0]}). A CNAME pointing at railway.app is recommended.`,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      detail: `DNS lookup failed: ${(e as Error).message}`,
    });
  }
}
