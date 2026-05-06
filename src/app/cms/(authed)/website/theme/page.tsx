import { ssrTenant } from '@/lib/ssr-tenant';
import ThemeEditor from '@/components/cms/ThemeEditor';
import WebsiteTabs from '@/components/cms/WebsiteTabs';
import { parseTheme } from '@/lib/theme';

export const dynamic = 'force-dynamic';

export default async function ThemePage() {
  const { tdb } = await ssrTenant();
  const s = await tdb.settings.findFirst();
  const theme = parseTheme(s?.themeConfig ?? '{}');
  return (
    <div>
      <WebsiteTabs />
      <h1 className="text-xl font-semibold mt-6 mb-1">Theme</h1>
      <p className="text-sm text-slate-500 mb-4">
        Brand colors and font for the public site. Changes take effect immediately on save.
      </p>
      <ThemeEditor initial={theme} />
    </div>
  );
}
