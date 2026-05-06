import Link from 'next/link';
import { ssrTenant } from '@/lib/ssr-tenant';
import StringListEditor from '@/components/cms/StringListEditor';
import AboutImageEditor from '@/components/cms/AboutImageEditor';
import WebsiteTabs from '@/components/cms/WebsiteTabs';

export const dynamic = 'force-dynamic';

async function getJson<T>(
  tdb: Awaited<ReturnType<typeof ssrTenant>>['tdb'],
  key: string,
  fb: T
): Promise<T> {
  const row = await tdb.siteContent.findFirst({ where: { key } });
  if (!row) return fb;
  return (row.value as T) ?? fb;
}

export default async function AboutEditorPage() {
  const { tdb } = await ssrTenant();
  const bullets = await getJson<string[]>(tdb, 'about_bullets', []);
  const aboutImage = await getJson<string>(tdb, 'about_image_url', '');
  return (
    <div>
      <WebsiteTabs />
      <h1 className="text-xl font-semibold mt-6 mb-1">About</h1>
      <p className="text-sm text-slate-500 mb-4">
        Main paragraph is in{' '}
        <Link href="/cms/settings" className="underline">Settings → About</Link>. Below: image and
        bullet highlights for the About section.
      </p>
      <div className="space-y-8">
        <AboutImageEditor initial={aboutImage} />
        <StringListEditor storageKey="about_bullets" initial={bullets} label="Bullets / highlights" />
      </div>
    </div>
  );
}
