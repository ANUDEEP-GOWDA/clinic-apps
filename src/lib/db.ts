/**
 * Prisma client singleton.
 *
 * Why singleton: Next.js dev hot-reloads modules; without this we'd create
 * a new PrismaClient per HMR cycle and exhaust the connection pool.
 *
 * For tenant-scoped queries, prefer `tenantPrisma(clinicId)` from
 * lib/tenant-prisma.ts — it's a thin wrapper that prevents you from
 * accidentally running unscoped queries.
 *
 * Direct `prisma` should only be used for:
 *   - Auth (looking up user by email + clinic slug)
 *   - Public clinic lookup (resolve slug → clinicId)
 *   - Cross-clinic infrastructure (cron jobs, signup, idempotency)
 */
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
