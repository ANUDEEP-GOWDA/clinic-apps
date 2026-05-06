import type { PublicSnapshot } from '@/lib/content';
import { parseWorkingHours, formatWorkingHoursHuman } from '@/lib/working-hours';

export default function Location({ snap }: { snap: PublicSnapshot }) {
  const { address, phone, email, googleMapsUrl, latitude, longitude, googlePlaceId } =
    snap.settings;
  const hasContact = address || phone || email;
  if (!hasContact && !googleMapsUrl && !latitude) return null;

  const wh = parseWorkingHours(snap.settings.workingHours);
  const hoursText = formatWorkingHoursHuman(wh);

  // Build embed URL: prefer place id, fall back to lat/lng, then address.
  let embedSrc: string | null = null;
  if (googlePlaceId) {
    embedSrc = `https://www.google.com/maps/embed/v1/place?key=&q=place_id:${googlePlaceId}`;
  } else if (latitude && longitude) {
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
    <section id="contact" className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Visit Us</h2>
          <div className="mt-6 space-y-3 text-slate-700">
            {address ? (
              <p>
                <span className="font-medium">Address: </span>
                {address}
              </p>
            ) : null}
            {phone ? (
              <p>
                <span className="font-medium">Phone: </span>
                <a href={`tel:${phone}`} className="text-[var(--color-primary)]">
                  {phone}
                </a>
              </p>
            ) : null}
            {email ? (
              <p>
                <span className="font-medium">Email: </span>
                <a href={`mailto:${email}`} className="text-[var(--color-primary)]">
                  {email}
                </a>
              </p>
            ) : null}
            <p>
              <span className="font-medium">Hours: </span>
              <span className="text-sm">{hoursText}</span>
            </p>
          </div>
          {directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener"
              className="mt-6 inline-block px-4 py-2 rounded-2xl bg-[var(--color-primary)] text-white text-sm"
            >
              Get Directions
            </a>
          ) : null}
        </div>
        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-slate-100">
          {embedSrc ? (
            <iframe
              src={embedSrc}
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Clinic location"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              Map unavailable
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
