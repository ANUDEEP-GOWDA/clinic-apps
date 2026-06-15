import { ssrTenant } from '@/lib/ssr-tenant';
import TemplateSelector from '@/components/cms/TemplateSelector';
import WebsiteTabs from '@/components/cms/WebsiteTabs';

export const dynamic = 'force-dynamic';

export default async function ThemePage() {
  const { tdb } = await ssrTenant();
  const s = await tdb.settings.findFirst();
  const currentTemplate = (s as any)?.selectedTemplate || 'classic';

  return (
    <div>
      <WebsiteTabs />

      <h1 className="text-xl font-semibold mt-6 mb-1">Website Template</h1>
      <p className="text-sm text-slate-500 mb-4">
        Choose a design for your public website. The change is instant.
      </p>
      <TemplateSelector current={currentTemplate} />
    </div>
  );
}
