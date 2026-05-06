import { handler } from '@/lib/route-handler';
import { sendText } from '@/lib/whatsapp';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  notes?: string;
  sentMessage?: string;
  sendToPatient?: boolean;
  finalize?: boolean;
};

export const POST = handler<{ id: string }>(
  { action: 'card.consultation.edit' },
  async (ctx, req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');
    const body = (await req.json().catch(() => ({}))) as Body;

    const card = await ctx.tdb.card.findFirst({
      where: { id },
      include: { patient: true, consultationDetails: true },
    });
    if (!card) return ctx.notFound();
    if (card.type !== 'consultation') return ctx.bad('not_a_consultation');

    const notes = body.notes ?? card.consultationDetails?.notes ?? '';
    const sentMessage = body.sentMessage ?? card.consultationDetails?.sentMessage ?? '';

    // Upsert consultation details. ConsultationDetails has a unique cardId,
    // so we use raw prisma and inject clinicId on create.
    await prisma.consultationDetails.upsert({
      where: { cardId: id },
      update: { notes, sentMessage },
      create: {
        cardId: id,
        clinicId: ctx.session.clinicId,
        notes,
        sentMessage,
      },
    });

    let sent = false;
    let sendError: string | null = null;
    if (body.sendToPatient && sentMessage.trim()) {
      const r = await sendText({
        clinicId: ctx.session.clinicId,
        phone: card.patient.phone,
        text: sentMessage,
        patientId: card.patientId,
        cardId: id,
      });
      sent = r.ok;
      if (!r.ok) sendError = r.error ?? 'send_failed';
    }

    if (body.finalize && card.state === 'active') {
      await ctx.tdb.transaction(async (tx:any) => {
        await tx.card.update({
          where: { id },
          data: { state: 'completed', actualEndAt: new Date() },
        });
        await tx.cardEvent.create({
          data: {
            cardId: id,
            fromType: 'consultation', toType: 'consultation',
            fromState: 'active', toState: 'completed',
            actorUserId: ctx.session.userId,
          },
        });
      });
      await ctx.audit('card.completed', 'Card', id);
    }

    return ctx.ok({ ok: true, sent, sendError });
  }
);
