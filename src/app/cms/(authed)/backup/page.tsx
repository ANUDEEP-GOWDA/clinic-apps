import { ssrTenant } from '@/lib/ssr-tenant';
import BackupPanel from '@/components/cms/BackupPanel';

export const dynamic = 'force-dynamic';

export default async function BackupPage() {
  const { tdb } = await ssrTenant();
  const last = await tdb.auditLog.findFirst({
    where: { action: 'backup.run' },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Backup</h1>
      <BackupPanel
        lastStatus={
          last
            ? {
                action: last.action,
                createdAt: last.createdAt.toISOString(),
                payload:
                  typeof last.payload === 'string'
                    ? last.payload
                    : JSON.stringify(last.payload),
              }
            : null
        }
      />
    </div>
  );
}
