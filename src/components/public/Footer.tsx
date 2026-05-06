import { type PublicSnapshot, siteContentValue } from '@/lib/content';

export default function Footer({ snap }: { snap: PublicSnapshot }) {
  const tagline = siteContentValue<string>(snap, 'footer_tagline', '');
  const services = snap.services.slice(0, 6);
  const { phone, email, address, clinicName } = snap.settings;

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="text-white font-semibold">{clinicName || 'Clinic'}</div>
          {tagline ? <p className="mt-2 text-sm text-slate-400">{tagline}</p> : null}
        </div>
        <div>
          <div className="text-white font-medium">Services</div>
          <ul className="mt-3 space-y-1 text-sm">
            {services.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-white font-medium">Contact</div>
          <ul className="mt-3 space-y-1 text-sm text-slate-400">
            {address ? <li>{address}</li> : null}
            {phone ? (
              <li>
                <a href={`tel:${phone}`} className="hover:text-white">
                  {phone}
                </a>
              </li>
            ) : null}
            {email ? (
              <li>
                <a href={`mailto:${email}`} className="hover:text-white">
                  {email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 px-4 py-4 text-xs text-slate-500 max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div>
          © {new Date().getFullYear()} {clinicName || ''}. All rights reserved.
        </div>
        <div className="opacity-70">Powered by ATS</div>
      </div>
    </footer>
  );
}
