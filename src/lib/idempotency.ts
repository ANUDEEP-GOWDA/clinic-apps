/**
 * Idempotency key handling for public POST endpoints.
 *
 * Pattern:
 *   1. Client generates a UUID and sends it in `X-Idempotency-Key` header.
 *   2. Before doing the real work, we check if we've seen this key + scope.
 *      If yes, return the stored response. If no, run the work and store.
 *   3. On flaky networks the client retries the same request safely.
 *
 * Storage: IdempotencyKey table. Cleaned up after 24h by the daily cron.
 *
 * This is the pattern Stripe et al. use. It's how you make POST safe to retry.
 */
import { prisma } from './db';

const KEY_HEADER = 'x-idempotency-key';

export function getIdempotencyKey(req: Request): string | null {
  const k = req.headers.get(KEY_HEADER);
  if (!k) return null;
  // Only accept reasonable-looking keys (UUID-ish or similar).
  if (!/^[A-Za-z0-9_\-]{8,128}$/.test(k)) return null;
  return k;
}

/**
 * If we've seen this key before in this scope, return the cached response.
 * Otherwise run `fn`, store its result, and return it.
 *
 * `fn` should return a JSON-serializable object — that's what gets stored.
 */
export async function withIdempotency<T extends Record<string, unknown>>(
  req: Request,
  scope: string,
  fn: () => Promise<T>
): Promise<{ result: T; replayed: boolean }> {
  const key = getIdempotencyKey(req);
  if (!key) {
    // No key supplied → just run. Caller is opting out of idempotency.
    return { result: await fn(), replayed: false };
  }

  const existing = await prisma.idempotencyKey.findUnique({ where: { key } });
  if (existing && existing.scope === scope) {
    return { result: existing.responseJson as T, replayed: true };
  }

  const result = await fn();
  await prisma.idempotencyKey
    .create({ data: { key, scope, responseJson: result } })
    .catch(() => {
      // Another concurrent request beat us. Read theirs and return that.
      // This is the rare race-window case.
    });
  return { result, replayed: false };
}
