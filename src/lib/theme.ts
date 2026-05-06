/**
 * Theme helpers.
 *
 * Settings.themeConfig stores brand colors + font. We render CSS custom
 * properties on :root via a server-rendered <style> tag in the public
 * layout. Tailwind references them with arbitrary values, e.g.
 *   className="bg-[var(--color-primary)]"
 */

export type ThemeConfig = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  fontFamily: string;
};

export const DEFAULT_THEME: ThemeConfig = {
  primary: '#2563eb',
  secondary: '#10b981',
  accent: '#f59e0b',
  background: '#ffffff',
  foreground: '#0f172a',
  fontFamily: 'Inter',
};

export function parseTheme(input: unknown): ThemeConfig {
  // Accepts either a JSON object (new schema, JSONB) or a JSON string (legacy).
  let o: Record<string, unknown> = {};
  if (input && typeof input === 'object') {
    o = input as Record<string, unknown>;
  } else if (typeof input === 'string') {
    try { o = JSON.parse(input || '{}'); } catch { o = {}; }
  }
  return { ...DEFAULT_THEME, ...o };
}

export function themeToCssVars(t: ThemeConfig): string {
  return `:root{
  --color-primary:${t.primary};
  --color-secondary:${t.secondary};
  --color-accent:${t.accent};
  --color-background:${t.background};
  --color-foreground:${t.foreground};
}`;
}
