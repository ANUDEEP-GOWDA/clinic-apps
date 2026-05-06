/**
 * Meta WhatsApp Cloud API client.
 *
 * All sends go through here. Each send writes a WhatsappMessage row scoped
 * to the clinic. If WHATSAPP env vars are missing, sends short-circuit with
 * `whatsapp_not_configured` — the route layer treats this as "best-effort,
 * keep going" rather than failing the whole transaction.
 *
 * Templates required (register in Meta Business Manager):
 *   appointment_confirm_request    (with Quick Reply button → payload "CONFIRM_CARD_<publicId>")
 *   appointment_reminder_3d
 *   appointment_reminder_4h
 *   appointment_reminder_30m
 */
import { prisma } from './db';
import { env } from './env';
import { log } from './log';

type SendResult = { ok: true; waMessageId?: string } | { ok: false; error: string };

function endpoint(): { url: string; token: string } | null {
  if (!env.META_WHATSAPP_TOKEN || !env.META_WHATSAPP_PHONE_NUMBER_ID) return null;
  return {
    url: `https://graph.facebook.com/v20.0/${env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
    token: env.META_WHATSAPP_TOKEN,
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

async function rawSend(body: Record<string, unknown>): Promise<SendResult> {
  const ep = endpoint();
  if (!ep) return { ok: false, error: 'whatsapp_not_configured' };
  try {
    const res = await fetch(ep.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ep.token}`,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };
    if (!res.ok || json.error) {
      return { ok: false, error: json.error?.message || `http_${res.status}` };
    }
    return { ok: true, waMessageId: json.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function sendTemplate(opts: {
  clinicId: number;
  phone: string;
  templateName: string;
  bodyParams: string[];
  buttonPayload?: string;
  language?: string;
  patientId?: number;
  cardId?: number;
}): Promise<SendResult> {
  const lang = opts.language ?? 'en_US';
  const components: Array<Record<string, unknown>> = [];

  if (opts.bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: opts.bodyParams.map((t) => ({ type: 'text', text: t })),
    });
  }
  if (opts.buttonPayload) {
    components.push({
      type: 'button',
      sub_type: 'quick_reply',
      index: '0',
      parameters: [{ type: 'payload', payload: opts.buttonPayload }],
    });
  }

  const result = await rawSend({
    messaging_product: 'whatsapp',
    to: normalizePhone(opts.phone),
    type: 'template',
    template: {
      name: opts.templateName,
      language: { code: lang },
      components,
    },
  });

  await prisma.whatsappMessage.create({
    data: {
      clinicId: opts.clinicId,
      direction: 'out',
      patientId: opts.patientId,
      cardId: opts.cardId,
      waMessageId: result.ok ? result.waMessageId : null,
      templateName: opts.templateName,
      body: `[template:${opts.templateName}] ${opts.bodyParams.join(' | ')}`,
      status: result.ok ? 'sent' : 'failed',
      rawPayload: result as object,
    },
  }).catch((e) => log.error('wa.log_failed', { err: String(e) }));

  return result;
}

export async function sendText(opts: {
  clinicId: number;
  phone: string;
  text: string;
  patientId?: number;
  cardId?: number;
}): Promise<SendResult> {
  const result = await rawSend({
    messaging_product: 'whatsapp',
    to: normalizePhone(opts.phone),
    type: 'text',
    text: { body: opts.text },
  });

  await prisma.whatsappMessage.create({
    data: {
      clinicId: opts.clinicId,
      direction: 'out',
      patientId: opts.patientId,
      cardId: opts.cardId,
      waMessageId: result.ok ? result.waMessageId : null,
      templateName: null,
      body: opts.text,
      status: result.ok ? 'sent' : 'failed',
      rawPayload: result as object,
    },
  }).catch((e) => log.error('wa.log_failed', { err: String(e) }));

  return result;
}

export function formatSlotForMessage(d: Date, _timezone: string): string {
  return d.toLocaleString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
