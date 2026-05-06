/**
 * Route handler helper — DRY pattern for every CMS endpoint.
 *
 * Every CMS route does the same dance: authenticate, check permission,
 * scope to clinic, run logic, log audit on failure. This module wraps it.
 *
 * Usage:
 *   export const POST = handler({ action: 'doctor.create' }, async (ctx, req) => {
 *     const body = await req.json();
 *     const created = await ctx.tdb.doctor.create({ data: { name: body.name, slug: body.slug } });
 *     await ctx.audit('doctor.created', 'Doctor', created.id);
 *     return ctx.ok({ id: created.id });
 *   });
 *
 * `ctx` gives you: session, tdb (tenant-scoped Prisma), audit helper,
 * response helpers (ok / bad / forbid / notFound).
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSession, type AuthenticatedSession } from './auth';
import { tenantPrisma } from './tenant-prisma';
import { audit as writeAudit } from './audit';
import { ForbiddenError, requirePermission, type Action } from './permissions';
import { log } from './log';

export type HandlerCtx = {
  session: AuthenticatedSession;
  tdb: ReturnType<typeof tenantPrisma>;
  audit: (
    action: string,
    entityType: string,
    entityId?: number | null,
    payload?: Record<string, unknown>
  ) => Promise<void>;
  ok: <T>(body: T, init?: ResponseInit) => NextResponse;
  bad: (msg: string, status?: number) => NextResponse;
  forbid: (msg?: string) => NextResponse;
  notFound: (msg?: string) => NextResponse;
};

type HandlerOpts = {
  /** Required permission for this route. Omit only for ambient routes. */
  action?: Action;
};

type Handler<TParams> = (
  ctx: HandlerCtx,
  req: NextRequest,
  params: TParams
) => Promise<NextResponse> | NextResponse;

export function handler<TParams = Record<string, string>>(
  opts: HandlerOpts,
  fn: Handler<TParams>
) {
  return async (req: NextRequest, route: { params: TParams }) => {
    let session: AuthenticatedSession;
    try {
      session = await requireSession();
    } catch {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    if (opts.action) {
      try {
        requirePermission(session.role, opts.action);
      } catch (e) {
        if (e instanceof ForbiddenError) {
          return NextResponse.json(
            { error: 'forbidden', action: e.action },
            { status: 403 }
          );
        }
        throw e;
      }
    }

    const tdb = tenantPrisma(session.clinicId);

    const ctx: HandlerCtx = {
      session,
      tdb,
      audit: (action, entityType, entityId, payload) =>
        writeAudit({
          clinicId: session.clinicId,
          userId: session.userId,
          action,
          entityType,
          entityId: entityId ?? null,
          payload,
        }),
      ok: (body, init) => NextResponse.json(body, init),
      bad: (msg, status = 400) => NextResponse.json({ error: msg }, { status }),
      forbid: (msg = 'forbidden') =>
        NextResponse.json({ error: msg }, { status: 403 }),
      notFound: (msg = 'not_found') =>
        NextResponse.json({ error: msg }, { status: 404 }),
    };

    try {
      return await fn(ctx, req, route.params);
    } catch (e) {
      log.error('handler.exception', {
        err: String(e),
        clinicId: session.clinicId,
        userId: session.userId,
        url: req.url,
      });
      return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    }
  };
}
