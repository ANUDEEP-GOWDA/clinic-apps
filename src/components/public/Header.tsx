'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { PublicSnapshot } from '@/lib/content';

export default function Header({ snap }: { snap: PublicSnapshot }) {
  const [open, setOpen] = useState(false);
  const phone = snap.settings.phone;
  const name = snap.settings.clinicName || 'Clinic';
  const logo = snap.settings.logoUrl;

  const links = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#services', label: 'Services' },
    { href: '#doctors', label: 'Doctors' },
    { href: '#reviews', label: 'Reviews' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="#home" className="flex items-center gap-2 font-semibold">
          {logo ? (
            <Image src={logo} alt={name} width={36} height={36} className="rounded" />
          ) : null}
          <span className="text-lg">{name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-slate-700 hover:text-slate-900">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="px-3 py-2 rounded-2xl border border-slate-200 text-sm hover:bg-slate-50"
            >
              Call Now
            </a>
          ) : null}
          <Link
            href={`/c/${snap.clinic.slug}/book`}
            className="px-4 py-2 rounded-2xl text-sm text-white bg-[var(--color-primary)] hover:opacity-90"
          >
            Book Appointment
          </Link>
        </div>

        <button
          aria-label="Open menu"
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-semibold">{name}</span>
              <button aria-label="Close" onClick={() => setOpen(false)} className="p-2 -mr-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-2 text-slate-800"
                >
                  {l.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 flex flex-col gap-2">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-center"
                >
                  Call Now
                </a>
              ) : null}
              <Link
                href={`/c/${snap.clinic.slug}/book`}
                className="px-4 py-2 rounded-2xl text-white bg-[var(--color-primary)] text-center"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
