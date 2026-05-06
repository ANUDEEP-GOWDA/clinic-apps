'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AtsBadge from './AtsBadge';

type Props = {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
};

const NAV: Array<{ href: string; label: string }> = [
  { href: '/cms/dashboard', label: 'Dashboard' },
  { href: '/cms/calendar', label: 'Calendar' },
  { href: '/cms/patients', label: 'Patients' },
  { href: '/cms/doctors', label: 'Doctors' },
  { href: '/cms/services', label: 'Services' },
  { href: '/cms/reviews', label: 'Reviews' },
  { href: '/cms/website/hero', label: 'Website' },
  { href: '/cms/settings', label: 'Settings' },
  { href: '/cms/media', label: 'Media' },
  { href: '/cms/audit', label: 'Audit' },
  { href: '/cms/backup', label: 'Backup' },
];

export default function CmsShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/cms/auth/logout', { method: 'POST' });
    router.push('/cms/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-56 bg-white border-r border-slate-100 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="text-[10px] tracking-widest text-slate-400">ATS</div>
          <div className="font-semibold">Clinic CMS</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => {
            const active =
              pathname === n.href || (n.href === '/cms/website/hero' && pathname?.startsWith('/cms/website'));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block px-3 py-2 rounded-lg text-sm ${
                  active ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-100 text-xs text-slate-400">
          <AtsBadge />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-100 flex items-center px-4 gap-4">
          <PatientSearchBar />
          <div className="ml-auto flex items-center gap-3">
            <div className="text-sm">
              <div className="font-medium leading-tight">{user.name || user.email}</div>
              <div className="text-xs text-slate-500 leading-tight">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

// Inline patient search — debounced fetch, dropdown of matches
function PatientSearchBar() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setItems([]);
        return;
      }
      try {
        const r = await fetch(`/api/cms/patients/search?q=${encodeURIComponent(q.trim())}`);
        const j = (await r.json()) as { items?: typeof items };
        setItems(j.items ?? []);
      } catch {
        setItems([]);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search patients (name or phone)…"
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      {open && items.length > 0 ? (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden">
          {items.map((it) => (
            <Link
              key={it.id}
              href={`/cms/patients?id=${it.id}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm hover:bg-slate-50"
            >
              <div className="font-medium">{it.name}</div>
              <div className="text-xs text-slate-500">{it.phone}</div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
