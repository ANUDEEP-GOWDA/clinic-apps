'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LastStatus = { action: string; createdAt: string; payload: string } | null;

export default function BackupPanel({ lastStatus }: { lastStatus: LastStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function runNow() {
    setBusy(true);
    setStatus('Running backup…');
    try {
      const res = await fetch('/api/cms/backup/run', { method: 'POST' });
      const j = (await res.json()) as { ok?: boolean; fileId?: string; error?: string };
      if (j.ok) {
        setStatus(`Backup uploaded${j.fileId ? ` (id ${j.fileId})` : ''}.`);
        router.refresh();
      } else {
        setStatus(`Backup failed: ${j.error || 'unknown'}`);
      }
    } catch {
      setStatus('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <h2 className="font-medium mb-2">Last backup</h2>
        {lastStatus ? (
          <div className="text-sm">
            <div>
              Status:{' '}
              <span
                className={
                  lastStatus.action === 'backup_success' ? 'text-emerald-700' : 'text-red-700'
                }
              >
                {lastStatus.action}
              </span>
            </div>
            <div className="text-slate-500">{new Date(lastStatus.createdAt).toLocaleString()}</div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No backups have run yet.</p>
        )}
        <button
          disabled={busy}
          onClick={runNow}
          className="mt-3 px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm disabled:opacity-50"
        >
          {busy ? 'Running…' : 'Backup Now'}
        </button>
        {status ? <p className="mt-2 text-sm text-slate-600">{status}</p> : null}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <h2 className="font-medium mb-2">Restore</h2>
        <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
          <li>Download the most recent <code>backup-*.zip.enc</code> from your Drive folder.</li>
          <li>Decrypt with the same <code>BACKUP_ENCRYPTION_KEY</code> using the helper script.</li>
          <li>Stop the CMS, replace <code>prisma/dev.db</code> and <code>public/uploads/</code>, restart.</li>
        </ol>
        <p className="mt-2 text-xs text-slate-500">
          Detailed steps are in DEPLOYMENT.md.
        </p>
      </div>
    </div>
  );
}
