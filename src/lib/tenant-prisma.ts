/**
 * Tenant-scoped Prisma wrapper.
 *
 * The single most important file for multi-tenant safety. Every CMS route
 * gets a `tdb` from this module instead of using `prisma` directly.
 *
 * It does TWO things:
 *
 *   1. Wraps each tenant-owned model so reads are filtered by clinicId and
 *      writes inject clinicId. Forgetting clinicId becomes impossible —
 *      the wrapper doesn't even accept it as a parameter, so client input
 *      can never override the session value.
 *
 *   2. Provides a transaction helper that propagates the same scoping.
 *
 * Models that are NOT clinic-owned (Clinic, PasswordResetToken,
 * IdempotencyKey, CronRun) stay on the raw `prisma` client.
 *
 * If you find yourself wanting to bypass this, stop and ask whether the
 * route is really cross-tenant. 99% of the time the answer is no.
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from './db';

// The set of models that carry clinicId. Keep in sync with schema.prisma.
const TENANT_MODELS = [
  'user',
  'settings',
  'doctor',
  'doctorSchedule',
  'doctorDayOverride',
  'service',
  'patient',
  'card',
  'cardEvent',
  'consultationDetails',
  'consultationAttachment',
  'callRequest',
  'review',
  'siteContent',
  'media',
  'outboxJob',
  'whatsappMessage',
  'auditLog',
] as const;

type TenantModel = (typeof TENANT_MODELS)[number];

/**
 * Returns a tenant-scoped facade over the Prisma client.
 *
 * Usage:
 *   const tdb = tenantPrisma(session.clinicId);
 *   const patients = await tdb.patient.findMany();          // scoped
 *   const card = await tdb.card.create({ data: { ... } }); // clinicId injected
 *
 * Notes:
 *   - `where` clauses are merged with `{ clinicId }` via AND.
 *   - `data` on create/createMany has clinicId set automatically. If the
 *     caller passes one, it's overridden — never trust client input.
 *   - For nested writes, the parent's clinicId applies via the outer
 *     model. If your nested write needs clinicId on a child of a different
 *     model, set it explicitly in the nested data.
 */
export function tenantPrisma(clinicId: number) {
  if (!Number.isInteger(clinicId) || clinicId <= 0) {
    throw new Error('tenantPrisma: invalid clinicId');
  }

  const facade = {} as Record<TenantModel, ScopedDelegate>;
  for (const model of TENANT_MODELS) {
    facade[model] = wrapDelegate(prisma[model] as unknown as PrismaDelegate, clinicId);
  }

  return {
    ...facade,
    // Escape hatch for the rare case you need raw prisma inside a scoped
    // route (e.g. you're reading from a non-tenant table). Use sparingly.
    raw: prisma,
    clinicId,
    /**
     * Transaction wrapper. The callback receives a tenant-scoped client
     * bound to the same transaction so all writes inside the tx share the
     * same connection.
     */
    async transaction<T>(
      fn: (txdb: ReturnType<typeof tenantPrisma>) => Promise<T>
    ): Promise<T> {
      return prisma.$transaction(async (tx:any) => {
        const txFacade = {} as Record<TenantModel, ScopedDelegate>;
        for (const model of TENANT_MODELS) {
          txFacade[model] = wrapDelegate(
            tx[model] as unknown as PrismaDelegate,
            clinicId
          );
        }
        return fn({
          ...txFacade,
          raw: tx as unknown as PrismaClient,
          clinicId,
          transaction: () => {
            throw new Error('Nested transactions not supported');
          },
        } as ReturnType<typeof tenantPrisma>);
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Internals — generic delegate wrapper
// ---------------------------------------------------------------------------

type PrismaDelegate = {
  findMany: (args?: any) => Promise<any>;
  findFirst: (args?: any) => Promise<any>;
  findUnique: (args: any) => Promise<any>;
  count: (args?: any) => Promise<any>;
  aggregate: (args?: any) => Promise<any>;
  groupBy: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  createMany: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  updateMany: (args: any) => Promise<any>;
  upsert: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
  deleteMany: (args?: any) => Promise<any>;
};

type ScopedDelegate = PrismaDelegate;

function withClinic(where: any, clinicId: number) {
  if (!where) return { clinicId };
  // Compose: existing where AND clinicId. Don't let callers pass their own
  // clinicId — strip it.
  const { clinicId: _drop, ...rest } = where;
  return { AND: [rest, { clinicId }] };
}

function wrapDelegate(delegate: PrismaDelegate, clinicId: number): ScopedDelegate {
  return {
    findMany: (args = {}) =>
      delegate.findMany({ ...args, where: withClinic(args.where, clinicId) }),
    findFirst: (args = {}) =>
      delegate.findFirst({ ...args, where: withClinic(args.where, clinicId) }),
    findUnique: (args) => {
      // findUnique only accepts unique selectors. We can't safely add a
      // clinicId AND, so we re-route through findFirst with the original
      // selector + clinicId. Cost: marginal (still uses an index).
      const where = args?.where ?? {};
      return delegate.findFirst({
        ...args,
        where: withClinic(where, clinicId),
      });
    },
    count: (args = {}) =>
      delegate.count({ ...args, where: withClinic(args.where, clinicId) }),
    aggregate: (args = {}) =>
      delegate.aggregate({ ...args, where: withClinic(args.where, clinicId) }),
    groupBy: (args) =>
      delegate.groupBy({ ...args, where: withClinic(args.where, clinicId) }),

    create: (args) => {
      const data = { ...(args.data ?? {}), clinicId };
      return delegate.create({ ...args, data });
    },
    createMany: (args) => {
      const incoming = Array.isArray(args.data) ? args.data : [args.data];
      const data = incoming.map((d: any) => ({ ...d, clinicId }));
      return delegate.createMany({ ...args, data });
    },
    update: (args) =>
      delegate.update({ ...args, where: withClinic(args.where, clinicId) }),
    updateMany: (args) =>
      delegate.updateMany({ ...args, where: withClinic(args.where, clinicId) }),
    upsert: (args) =>
      delegate.upsert({
        ...args,
        where: withClinic(args.where, clinicId),
        create: { ...(args.create ?? {}), clinicId },
      }),
    delete: (args) =>
      delegate.delete({ ...args, where: withClinic(args.where, clinicId) }),
    deleteMany: (args = {}) =>
      delegate.deleteMany({ ...args, where: withClinic(args.where, clinicId) }),
  };
}

// Re-export for type convenience.
export type { Prisma };
