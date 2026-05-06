import { ssrTenant } from '@/lib/ssr-tenant';
import SeoEditor from '@/components/cms/SeoEditor';
import WebsiteTabs from '@/components/cms/WebsiteTabs';

export const dynamic = 'force-dynamic';

export default async function SeoPage() {
  const { tdb } = await ssrTenant();

  async function getString(key: string): Promise<string> {
    const row = await tdb.siteContent.findFirst({ where: { key } });
    if (!row) return '';
    const v = row.value;
    return typeof v === 'string' ? v : '';
  }

  const [title, desc, keywords, settings, services] = await Promise.all([
    getString('seo_default_title'),
    getString('seo_default_description'),
    getString('seo_keywords'),
    tdb.settings.findFirst(),
    tdb.service.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' } }),
  ]);

  const suggestedTitle = settings?.tagline
    ? `${settings.clinicName} — ${settings.tagline}`
    : settings?.clinicName ?? '';
  const firstAddress = settings?.address?.split(',')[0]?.trim() ?? '';
  const svc = services.slice(0, 4).map((s) => s.name).join(', ');
  const suggestedDesc =
    settings?.clinicName && (svc || firstAddress)
      ? `${settings.clinicName}${firstAddress ? ` in ${firstAddress}` : ''} — ${svc || 'professional medical care'}. Book online.`
      : '';
  const suggestedKeywords = [
    settings?.clinicName,
    firstAddress,
    ...services.map((s) => s.name),
  ].filter(Boolean).join(', ');

  return (
    <div>
      <WebsiteTabs />
      <h1 className="text-xl font-semibold mt-6 mb-1">SEO</h1>
      <p className="text-sm text-slate-500 mb-4">
        Empty fields fall back to the suggestions on the live site. Keep title under 60 chars and
        description under 160 chars.
      </p>
      <SeoEditor
        initial={{ title, description: desc, keywords }}
        suggestions={{
          title: suggestedTitle,
          description: suggestedDesc,
          keywords: suggestedKeywords,
        }}
      />
    </div>
  );
}
