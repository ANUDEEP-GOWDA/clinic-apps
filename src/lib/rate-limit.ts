/**
 * Simple in-memory token-bucket rate limiter.
 *
 * Scope: per process. On a single Railway instance this is correct. If you
 * scale horizontally, swap this for a Redis-backed implementation — the
 * interface (`check`) stays the same, callers don't change.
 *
 * Used on:
 *   - public booking, signup, call-request endpoints (per IP)
 *   - login (per email)
 */

type Bucket = {
  tokens: number;
  refilledAt: number;
};

const buckets = new Map<string, Bucket>();

// Tunable per call. Defaults are conservative — adjust for your traffic.
export type LimitOpts = {
  capacity: number;     // max burst
  refillPerMinute: number; // refill rate
};

const DEFAULTS: LimitOpts = { capacity: 10, refillPerMinute: 5 };

/**
 * Returns true if request is allowed, false if rate limit exceeded.
 * Key it by whatever you want — IP, email, IP+route, etc.
 */
export function check(key: string, opts: Partial<LimitOpts> = {}): boolean {
  const { capacity, refillPerMinute } = { ...DEFAULTS, ...opts };
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: capacity, refilledAt: now };
    buckets.set(key, b);
  }
  // Refill since last check.
  const elapsedMin = (now - b.refilledAt) / 60_000;
  const refill = elapsedMin * refillPerMinute;
  if (refill > 0) {
    b.tokens = Math.min(capacity, b.tokens + refill);
    b.refilledAt = now;
  }
  if (b.tokens >= 1) {
    b.tokens -= 1;
    return true;
  }
  return false;
}

/**
 * Extract a stable client identifier from the request.
 * Cloudflare/Railway send X-Forwarded-For; fall back to a constant if missing
 * (don't crash, but the limit becomes process-wide which is still useful).
 */
export function clientKey(req: Request, suffix?: string): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  const ip = xff.split(',')[0]?.trim() || 'unknown';
  return suffix ? `${ip}:${suffix}` : ip;
}

/**
 * Periodic cleanup so the Map doesn't grow forever. Runs lazily.
 */
let lastSweep = Date.now();
function sweep() {
  const now = Date.now();
  if (now - lastSweep < 5 * 60_000) return;
  lastSweep = now;
  // Drop buckets idle > 30min.
  for (const [k, b] of buckets) {
    if (now - b.refilledAt > 30 * 60_000) buckets.delete(k);
  }
}
setInterval(sweep, 5 * 60_000).unref?.();
