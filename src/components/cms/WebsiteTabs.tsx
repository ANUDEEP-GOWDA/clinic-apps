'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/cms/website/hero', label: 'Content' },
  { href: '/cms/website/about', label: 'Packages' },
  { href: '/cms/website/why-choose-us', label: 'Highlights' },
  { href: '/cms/website/faq', label: 'FAQ' },
  { href: '/cms/website/seo', label: 'Google Search' },
  { href: '/cms/website/theme', label: 'Template' },
];

export default function WebsiteTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 text-sm border-b border-slate-100 pb-2">
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-1.5 rounded-lg ${
              active ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
