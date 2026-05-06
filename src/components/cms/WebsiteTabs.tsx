'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/cms/website/hero', label: 'Hero' },
  { href: '/cms/website/about', label: 'About' },
  { href: '/cms/website/why-choose-us', label: 'Why Us' },
  { href: '/cms/website/faq', label: 'FAQ' },
  { href: '/cms/website/extras', label: 'Extras' },
  { href: '/cms/website/seo', label: 'SEO' },
  { href: '/cms/website/theme', label: 'Theme' },
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
