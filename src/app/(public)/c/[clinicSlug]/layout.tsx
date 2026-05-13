import type { Metadata } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { getPublicSnapshot } from '@/lib/content';
import { buildMetadata, buildJsonLd } from '@/lib/seo';
import { parseTheme, themeToCssVars } from '@/lib/theme';

export async function generateMetadata({
  params,
}: {
  params: { clinicSlug: string };
}): Promise<Metadata> {
  const snap = await getPublicSnapshot(params.clinicSlug);
  if (!snap) return { title: 'Not found' };
  return buildMetadata(snap);
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { clinicSlug: string };
}) {
  const snap = await getPublicSnapshot(params.clinicSlug);
  if (!snap) notFound();

  const theme = parseTheme(snap.settings.themeConfig);
  const jsonLd = buildJsonLd(snap);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeToCssVars(theme) }} />
      <Script
        id="ld-json"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
