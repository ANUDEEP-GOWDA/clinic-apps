import { ssrTenant } from '@/lib/ssr-tenant';
import WebsiteEditor from '@/components/cms/WebsiteEditor';

export const dynamic = 'force-dynamic';

type FAQ = { question: string; answer: string };
type Pkg = { name: string; label: string; price: string; img: string };
type HL = { title: string; description: string };

async function getJson<T>(
  tdb: Awaited<ReturnType<typeof ssrTenant>>['tdb'],
  key: string,
  fb: T
): Promise<T> {
  const row = await tdb.siteContent.findFirst({ where: { key } });
  if (!row) return fb;
  return (row.value as T) ?? fb;
}

async function getString(
  tdb: Awaited<ReturnType<typeof ssrTenant>>['tdb'],
  key: string
): Promise<string> {
  const row = await tdb.siteContent.findFirst({ where: { key } });
  if (!row) return '';
  const v = row.value;
  return typeof v === 'string' ? v : '';
}

export default async function WebsitePage() {
  const { tdb } = await ssrTenant();

  const [settings, packages, highlights, faqs, seoTitle, seoDesc, galleryImages, services, doctors, reviews] =
    await Promise.all([
      tdb.settings.findFirst(),
      getJson<Pkg[]>(tdb, 'packages', []),
      getJson<HL[]>(tdb, 'why_choose_us', []),
      getJson<FAQ[]>(tdb, 'faq', []),
      getString(tdb, 'seo_default_title'),
      getString(tdb, 'seo_default_description'),
      getJson<string[]>(tdb, 'gallery_images', []),
      tdb.service.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' }, select: { name: true } }),
      tdb.doctor.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' }, select: { name: true } }),
      tdb.review.count(),
    ]);

  const s = settings;

  return (
    <WebsiteEditor
      settings={{
        clinicName: s?.clinicName ?? '',
        tagline: s?.tagline ?? '',
        about: s?.about ?? '',
        phone: s?.phone ?? '',
        email: s?.email ?? '',
        address: s?.address ?? '',
        googleMapsUrl: s?.googleMapsUrl ?? '',
        latitude: s?.latitude ?? null,
        longitude: s?.longitude ?? null,
      }}
      packages={packages}
      highlights={highlights}
      faqs={faqs}
      seo={{ title: seoTitle, description: seoDesc }}
      gallery={galleryImages}
      currentTemplate={(s as any)?.selectedTemplate || 'classic'}
      serviceSummary={services}
      doctorSummary={doctors}
      reviewCount={reviews}
    />
  );
}
