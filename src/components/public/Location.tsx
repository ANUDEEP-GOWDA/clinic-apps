import type { PublicSnapshot } from '@/lib/content';
import { parseWorkingHours, formatWorkingHoursHuman } from '@/lib/working-hours';

export default function Location({ snap }: { snap: PublicSnapshot }) {
  const { address, phone, email, googleMapsUrl, latitude, longitude } = snap.settings;
  const hasContact = address || phone || email;
  if (!hasContact && !googleMapsUrl && !latitude) return null;

  const wh = parseWorkingHours(snap.settings.workingHours);
  const hoursText = formatWorkingHoursHuman(wh);

  let embedSrc: string | null = null;
  if (latitude && longitude) {
    embedSrc = `https://www.google.com/maps?q=${latitude},${longitude}&output=embed`;
  } else if (address) {
    embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  }

  const directionsUrl =
    googleMapsUrl ||
    (latitude && longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      : address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
      : null);

  return (
    <section id="contact" className="bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-sm font-medium text-[var(--color-primary)]">
            Find Us
          </div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Visit Us</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Contact info */}
          <div className="space-y-4">
            {address ? (
              <InfoRow icon="📍" label="Address" value={address} />
            ) : null}
            {phone ? (
              <InfoRow
                icon="📞"
                label="Phone"
                value={<a href={`tel:${phone}`} className="text-[var(--color-primary)] hover:underline">{phone}</a>}
              />
            ) : null}
            {email ? (
              <InfoRow
                icon="✉️"
                label="Email"
                value={<a href={`mailto:${email}`} className="text-[var(--color-primary)] hover:underline">{email}</a>}
              />
            ) : null}
            {hoursText ? (
              <InfoRow icon="🕐" label="Hours" value={<span className="text-sm">{hoursText}</span>} />
            ) : null}

            {directionsUrl ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                Get Directions
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            ) : null}
          </div>

          {/* Map */}
          <div className="min-h-[240px] overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            {embedSrc ? (
              <iframe
                src={embedSrc}
                className="h-full min-h-[240px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Clinic location"
              />
            ) : (
              <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-400">
                Map unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="mt-0.5 text-xl">{icon}</span>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-0.5 text-slate-700">{value}</div>
      </div>
    </div>
  );
}
