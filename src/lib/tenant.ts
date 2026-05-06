/**
 * Resolve clinic from URL/query for PUBLIC routes (no session).
 *
 * Public surfaces use the slug in the URL path: /c/<slug>/...
 * Public APIs accept either:
 *   - a `clinic` query param (?clinic=acme)
 *   - or extract it from the Referer if it points at /c/<slug>/...
 *
 * Resolution caches per process (clinics rarely change). At 30k clinics
 * we want this to be free in steady state — one DB hit per slug, then
 * served from memory.
 */
import { prisma } from './db';

type ClinicLite = {
  id: number;
  slug: string;
  name: string;
  active: boolean;
};

const cache = new Map<string, { data: ClinicLite | null; expiresAt: number }>();
const TTL_MS = 60_000; // 1 minute. Short enough that "deactivate clinic"
                      // takes effect quickly; long enough to absorb traffic.

export async function getClinicBySlug(slug: string): Promise<ClinicLite | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.data;

  const c = await prisma.clinic.findUnique({
    where: { slug: key },
    select: { id: true, slug: true, name: true, active: true },
  });
  cache.set(key, { data: c, expiresAt: now + TTL_MS });
  return c;
}

/**
 * Manually evict a slug from the cache. Call after rename/deactivation.
 */
export function evictClinicCache(slug: string) {
  cache.delete(slug.trim().toLowerCase());
}

/**
 * Convenience: extract slug from a request and resolve. Returns null if
 * not found or clinic inactive.
 */
export async function resolveClinicForPublicRequest(
  req: Request
): Promise<ClinicLite | null> {
  const url = new URL(req.url);
  let slug = url.searchParams.get('clinic')?.trim().toLowerCase() || null;

  if (!slug) {
    // Try Referer (e.g. browser-side fetches from /c/<slug>/...)
    const ref = req.headers.get('referer');
    if (ref) {
      try {
        const r = new URL(ref);
        const m = /^\/c\/([a-z0-9_-]+)/i.exec(r.pathname);
        if (m) slug = m[1].toLowerCase();
      } catch { /* ignore */ }
    }
  }

  if (!slug) {
    // Fallback: a custom header (handy for reschedule links etc.)
    slug = req.headers.get('x-clinic-slug')?.trim().toLowerCase() || null;
  }

  if (!slug) return null;
  const clinic = await getClinicBySlug(slug);
  if (!clinic || !clinic.active) return null;
  return clinic;
}
