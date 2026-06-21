/**
 * Razorpay client — payment links + webhook verification.
 *
 * All ops short-circuit gracefully if RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
 * are not set, so the app runs normally without payment credentials (feature
 * is disabled, not broken).
 *
 * Required env vars:
 *   RAZORPAY_KEY_ID        — from Razorpay dashboard → Settings → API Keys
 *   RAZORPAY_KEY_SECRET    — same
 *   RAZORPAY_WEBHOOK_SECRET — from Razorpay dashboard → Webhooks → secret
 *
 * WhatsApp templates needed (register in Meta Business Manager):
 *   payment_request   — params: [patient_name, amount_str, doctor_name, payment_link]
 *   payment_receipt   — params: [patient_name, amount_str, bill_number]
 */
import crypto from 'node:crypto';
import { log } from './log';

const RAZORPAY_BASE = 'https://api.razorpay.com/v1';

function credentials(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function basicAuth(keyId: string, keySecret: string): string {
  return 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
}

export function isConfigured(): boolean {
  return !!credentials();
}

export type PaymentLinkResult =
  | { ok: true; linkId: string; shortUrl: string }
  | { ok: false; error: string };

export async function createPaymentLink(opts: {
  amountPaise: number;
  currency?: string;
  description: string;
  customerName: string;
  customerPhone: string;
  notes?: Record<string, string>;
}): Promise<PaymentLinkResult> {
  const creds = credentials();
  if (!creds) return { ok: false, error: 'razorpay_not_configured' };

  try {
    const res = await fetch(`${RAZORPAY_BASE}/payment_links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: basicAuth(creds.keyId, creds.keySecret),
      },
      body: JSON.stringify({
        amount: opts.amountPaise,
        currency: opts.currency ?? 'INR',
        description: opts.description,
        customer: {
          name: opts.customerName,
          contact: opts.customerPhone,
        },
        notify: { sms: false, email: false },
        reminder_enable: false,
        notes: opts.notes ?? {},
      }),
    });

    const json = (await res.json()) as {
      id?: string;
      short_url?: string;
      error?: { description?: string };
    };

    if (!res.ok || !json.id) {
      const errMsg = json.error?.description || `http_${res.status}`;
      log.error('razorpay.create_link_failed', { status: res.status, err: errMsg });
      return { ok: false, error: errMsg };
    }

    return { ok: true, linkId: json.id, shortUrl: json.short_url ?? '' };
  } catch (e) {
    log.error('razorpay.create_link_exception', { err: String(e) });
    return { ok: false, error: (e as Error).message };
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

export function rupeesFromPaise(paise: number): string {
  return (paise / 100).toFixed(2);
}

export function paiseFromRupees(rupees: number): number {
  return Math.round(rupees * 100);
}
