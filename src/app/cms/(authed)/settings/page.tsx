import { ssrTenant } from '@/lib/ssr-tenant';
import SettingsEditor from '@/components/cms/SettingsEditor';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const { tdb, session } = await ssrTenant();
  const [s, clinic] = await Promise.all([
    tdb.settings.findFirst(),
    tdb.raw.clinic.findUnique({
      where: { id: session.clinicId },
      select: { slug: true, customDomain: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Settings</h1>
      <SettingsEditor
        initial={{
          clinicName: s?.clinicName ?? '',
          tagline: s?.tagline ?? '',
          about: s?.about ?? '',
          address: s?.address ?? '',
          phone: s?.phone ?? '',
          email: s?.email ?? '',
          googlePlaceId: s?.googlePlaceId ?? '',
          googleMapsUrl: s?.googleMapsUrl ?? '',
          latitude: s?.latitude ?? null,
          longitude: s?.longitude ?? null,
          timezone: s?.timezone ?? 'Asia/Kolkata',
          workingHours:
            s?.workingHours
              ? typeof s.workingHours === 'string'
                ? s.workingHours
                : JSON.stringify(s.workingHours)
              : '{}',
          logoUrl: s?.logoUrl ?? '',
          faviconUrl: s?.faviconUrl ?? '',
          heroImageUrl: s?.heroImageUrl ?? '',
          heroHeadline: s?.heroHeadline ?? '',
          heroSubheadline: s?.heroSubheadline ?? '',
          customDomain: clinic?.customDomain ?? null,
          clinicSlug: clinic?.slug ?? '',
        }}
      />
    </div>
  );
}
