import { ssrTenant } from '@/lib/ssr-tenant';

export const dynamic = 'force-dynamic';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { tdb } = await ssrTenant();
  const page = Math.max(1, Number(searchParams.page || 1));
  const PAGE_SIZE = 50;
  const [total, rows] = await Promise.all([
    tdb.auditLog.count(),
    tdb.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Audit log</h1>
      <p className="text-xs text-slate-500 mb-3">
        {total} total entries · page {page} of {totalPages}
      </p>
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Payload</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-slate-500">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="p-3 whitespace-nowrap">
                    {r.createdAt.toLocaleString()}
                  </td>
                  <td className="p-3">{r.userId ?? '—'}</td>
                  <td className="p-3 font-mono text-xs">{r.action}</td>
                  <td className="p-3">
                    {r.entityType}
                    {r.entityId ? ` #${r.entityId}` : ''}
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-500 max-w-md truncate">
                    {typeof r.payload === 'string'
                      ? r.payload
                      : JSON.stringify(r.payload)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2 text-sm">
        {page > 1 ? (
          <a className="px-3 py-1.5 rounded-lg border border-slate-200" href={`/cms/audit?page=${page - 1}`}>
            ← Previous
          </a>
        ) : null}
        {page < totalPages ? (
          <a className="px-3 py-1.5 rounded-lg border border-slate-200" href={`/cms/audit?page=${page + 1}`}>
            Next →
          </a>
        ) : null}
      </div>
    </div>
  );
}
