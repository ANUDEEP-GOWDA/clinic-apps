/**
 * Outbox handler for WhatsApp template messages.
 *
 * Payload shape (when enqueued):
 *   {
 *     phone: string,
 *     templateName: string,
 *     bodyParams: string[],
 *     buttonPayload?: string,
 *     language?: string,
 *     patientId?: number,
 *   }
 */
import { sendTemplate } from '../../whatsapp';

type Payload = {
  phone?: unknown;
  templateName?: unknown;
  bodyParams?: unknown;
  buttonPayload?: unknown;
  language?: unknown;
  patientId?: unknown;
};

export async function handleWhatsappTemplate(opts: {
  clinicId: number;
  cardId: number | null;
  payload: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const p = opts.payload as Payload;

  if (typeof p.phone !== 'string' || !p.phone) return { ok: false, error: 'no_phone' };
  if (typeof p.templateName !== 'string' || !p.templateName) {
    return { ok: false, error: 'no_template' };
  }
  const bodyParams = Array.isArray(p.bodyParams) ? p.bodyParams.map(String) : [];

  const r = await sendTemplate({
    clinicId: opts.clinicId,
    phone: p.phone,
    templateName: p.templateName,
    bodyParams,
    buttonPayload: typeof p.buttonPayload === 'string' ? p.buttonPayload : undefined,
    language: typeof p.language === 'string' ? p.language : undefined,
    patientId: typeof p.patientId === 'number' ? p.patientId : undefined,
    cardId: opts.cardId ?? undefined,
  });
  if (r.ok) return { ok: true };
  return { ok: false, error: r.error || 'send_failed' };
}
