import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Meta WhatsApp webhook.
 *
 *  GET:  Verification challenge. Meta sends ?hub.mode=subscribe&hub.verify_token=...
 *        We echo hub.challenge if the token matches META_WHATSAPP_VERIFY_TOKEN.
 *
 *  POST: Incoming message events. Tenant resolution:
 *        - Confirm-button payloads carry the card's publicId → look up the
 *          card → use its clinicId.
 *        - Inbound text from a phone we know → look up the patient → its
 *          clinicId.
 *        - Anything we can't resolve to a clinic is logged and dropped.
 *
 *        We do NOT trust any clinicId hint from the payload — Meta doesn't
 *        send one anyway, so this is naturally safe.
 *
 * In a multi-tenant world with one Meta WhatsApp number, all clinics share
 * the same inbox. To get per-clinic numbers, each clinic needs its own
 * Meta WABA — that's a future feature; for now the single-number setup
 * resolves tenant by card/patient.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  if (
    mode === 'subscribe' &&
    token &&
    env.META_WHATSAPP_VERIFY_TOKEN &&
    token === env.META_WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return new NextResponse('forbidden', { status: 403 });
}

type WaMessage = {
  from?: string;
  id?: string;
  type?: string;
  text?: { body?: string };
  button?: { payload?: string; text?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string };
  };
};

type WaWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: WaMessage[];
        contacts?: Array<{ wa_id?: string }>;
      };
    }>;
  }>;
};

export async function POST(req: NextRequest) {
  let payload: WaWebhookPayload;
  try {
    payload = (await req.json()) as WaWebhookPayload;
  } catch {
    return NextResponse.json({ ok: true }); // Meta wants 200 always
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        try {
          await handleMessage(m);
        } catch (e) {
          log.error('wa.webhook.handle_failed', { err: String(e) });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

async function handleMessage(m: WaMessage) {
  const phone = m.from ?? '';
  const buttonPayload =
    m.button?.payload ?? m.interactive?.button_reply?.id ?? null;

  // Confirm button → look up card by publicId.
  if (buttonPayload && buttonPayload.startsWith('CONFIRM_CARD_')) {
    const publicId = buttonPayload.slice('CONFIRM_CARD_'.length);
    const card = await prisma.card.findUnique({ where: { publicId } });
    if (!card) {
      log.warn('wa.confirm.card_not_found', { publicId });
      return;
    }
    await prisma.card.update({
      where: { id: card.id },
      data: { patientConfirmedAt: new Date() },
    });
    await prisma.whatsappMessage.create({
      data: {
        clinicId: card.clinicId,
        direction: 'in',
        cardId: card.id,
        body: '[confirm button]',
        rawPayload: m as unknown as object,
      },
    });
    return;
  }

  if (m.type === 'text' && m.text?.body && phone) {
    // Find a patient with this phone. If multiple clinics share a patient
    // phone (rare but possible), log against ALL — each clinic should see it.
    const patients = await prisma.patient.findMany({
      where: { phone },
      select: { id: true, clinicId: true },
    });

    if (patients.length === 0) {
      log.info('wa.inbound.unknown_phone', { phone });
      return;
    }

    for (const p of patients) {
      await prisma.whatsappMessage.create({
        data: {
          clinicId: p.clinicId,
          direction: 'in',
          patientId: p.id,
          body: m.text.body,
          rawPayload: m as unknown as object,
        },
      });
    }
  }
}
