'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AtsBadge from './AtsBadge';

type Props = {
  user: { name: string; email: string; role: string };
  clinicSlug: string;
  customDomain: string | null;
  emailVerified: boolean;
  children: React.ReactNode;
};

const NAV: Array<{ href: string; label: string }> = [
  { href: '/cms/dashboard', label: 'Dashboard' },
  { href: '/cms/calendar', label: 'Calendar' },
  { href: '/cms/patients', label: 'Patients' },
  { href: '/cms/payments', label: 'Payments' },
  { href: '/cms/doctors', label: 'Doctors' },
  { href: '/cms/services', label: 'Services' },
  { href: '/cms/reviews', label: 'Reviews' },
  { href: '/cms/website', label: 'Website' },
  { href: '/cms/settings', label: 'Settings' },
  { href: '/cms/media', label: 'Media' },
  { href: '/cms/audit', label: 'Audit' },
  { href: '/cms/backup', label: 'Backup' },
  { href: '/cms/account', label: 'Account' },
];

export default function CmsShell({ user, clinicSlug, customDomain, emailVerified, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile nav tap)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  async function logout() {
    await fetch('/api/cms/auth/logout', { method: 'POST' });
    router.push('/cms/login');
    router.refresh();
  }

  const publicSiteUrl = `/c/${clinicSlug}`;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col
          transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:w-56
        `}
      >
        <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] tracking-widest text-slate-400">ATS</div>
            <div className="font-semibold">Clinic CMS</div>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-50"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname?.startsWith(n.href + '/');
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block px-3 py-2.5 rounded-lg text-sm ${
                  active ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User info in sidebar on mobile */}
        <div className="md:hidden px-4 py-3 border-t border-slate-100">
          <div className="text-sm font-medium">{user.name || user.email}</div>
          <div className="text-xs text-slate-500">{user.role}</div>
          <div className="flex gap-2 mt-2">
            {clinicSlug && (
              <a
                href={publicSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs px-2 py-1.5 rounded-lg bg-emerald-600 text-white"
              >
                View Site ↗
              </a>
            )}
            <button
              onClick={logout}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="hidden md:block p-3 border-t border-slate-100 text-xs text-slate-400">
          <AtsBadge />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center px-3 gap-3 sticky top-0 z-20">
          {/* Hamburger - mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50 flex-shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search bar - desktop only */}
          <div className="hidden md:flex flex-1 max-w-md">
            <PatientSearchBar />
          </div>

          {/* Spacer on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Desktop: View Public Site + user info + logout */}
          <div className="hidden md:flex items-center gap-3">
            {clinicSlug ? (
              <a
                href={publicSiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5"
                title={customDomain ? `Custom domain set: ${customDomain}` : 'View your public website'}
              >
                <span>View Public Site</span>
                <span className="text-xs">↗</span>
              </a>
            ) : null}
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

        {/* Mobile search bar row */}
        <div className="md:hidden px-3 py-2 bg-white border-b border-slate-100">
          <PatientSearchBar />
        </div>

        {!emailVerified && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 text-sm text-amber-800">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
            <span>Please verify your email address to keep your account secure.</span>
            <Link href="/cms/account" className="ml-auto underline whitespace-nowrap">Verify now</Link>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function PatientSearchBar() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setItems([]); return; }
      try {
        const r = await fetch(`/api/cms/patients/search?q=${encodeURIComponent(q.trim())}`);
        const j = (await r.json()) as { items?: typeof items };
        setItems(j.items ?? []);
      } catch { setItems([]); }
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
    <div ref={ref} className="relative w-full">
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
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
