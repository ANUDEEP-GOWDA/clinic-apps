/**
 * Email sender via Resend.
 *
 * Free tier: 3,000 emails/month, no card needed.
 * Set RESEND_API_KEY and EMAIL_FROM in env. If unset, sending is a no-op
 * that logs — useful for local/dev where you don't want to spam.
 */
import { log } from './log';

const RESEND_URL = 'https://api.resend.com/emails';

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    log.warn('email.not_configured', { to: opts.to, subject: opts.subject });
    return { ok: false, error: 'email_not_configured' };
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text ?? opts.html.replace(/<[^>]+>/g, ''),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      log.error('email.send_failed', { status: res.status, body });
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
