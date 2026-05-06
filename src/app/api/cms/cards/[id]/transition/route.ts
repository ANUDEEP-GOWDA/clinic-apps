import { addMinutes } from 'date-fns';
import { handler } from '@/lib/route-handler';
import {
  planApprove,
  planStartConsultation,
  planStateChange,
} from '@/lib/cards/state-machine';
import { enqueue, cancelForCard } from '@/lib/outbox';
import { formatSlotForMessage } from '@/lib/whatsapp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  to?: string;          // type transition target: 'appointment' | 'consultation'
  stateTo?: string;     // 'rejected' | 'cancelled' | 'no_show' | 'completed'
  newSlotDatetime?: string; // optional override during approve
  note?: string;
  followUp?: { slotDatetime: string; reasonForVisit?: string };
};

/**
 * POST /api/cms/cards/[id]/transition
 *
 * The route is a thin wrapper:
 *   1. Pull the card (clinic-scoped)
 *   2. Pick the right state-machine planner
 *   3. Apply the patch + write CardEvent inside a transaction
 *   4. Enqueue side effects (WhatsApp templates, reminders) to the outbox
 *
 * All transitions audit-log themselves. Permission gating per-action:
 * approve / start / cancel / consultation-edit are distinct rights.
 */
export const POST = handler<{ id: string }>(
  {
    // Generic precheck — finer per-branch checks below.
    action: 'card.read',
  },
  async (ctx, req, params) => {
    const id = Number(params.id);
    if (!Number.isInteger(id)) return ctx.bad('bad_id');

    const body = (await req.json().catch(() => ({}))) as Body;

    const card = await ctx.tdb.card.findFirst({
      where: { id },
      include: { patient: true, doctor: true },
    });
    if (!card) return ctx.notFound();

    // -------------------------------------------------------------------
    // Follow-up: NEW row, type=request, parentCardId=this consultation
    // -------------------------------------------------------------------
    if (body.followUp) {
      // Permission: only DOCTOR/OWNER can create follow-ups.
      if (ctx.session.role === 'STAFF') return ctx.forbid();
      if (card.type !== 'consultation') {
        return ctx.bad('follow_up_only_on_consultation');
      }
      const slot = new Date(body.followUp.slotDatetime);
      if (isNaN(slot.getTime())) return ctx.bad('bad_slot');

      const created = await ctx.tdb.card.create({
        data: {
          patientId: card.patientId,
          doctorId: card.doctorId,
          type: 'request',
          state: 'active',
          appointmentType: 'follow_up',
          reasonForVisit: body.followUp.reasonForVisit ?? '',
          slotDatetime: slot,
          durationMin: card.doctor.consultationDurationMin || 15,
          parentCardId: card.id,
          events: {
            create: {
              clinicId: ctx.session.clinicId,
              fromType: null, toType: 'request',
              fromState: null, toState: 'active',
              actorUserId: ctx.session.userId,
              payload: { source: 'follow_up', parentCardId: card.id },
            },
          },
        },
      });
      await ctx.audit('card.follow_up_created', 'Card', created.id, {
        parentCardId: card.id,
      });
      return ctx.ok({ ok: true, cardId: created.id });
    }

    // -------------------------------------------------------------------
    // Type transitions
    // -------------------------------------------------------------------
    if (body.to === 'appointment') {
      if (!ctx.session.role || !['OWNER', 'STAFF'].includes(ctx.session.role)) {
        // DOCTOR can also approve their own; allow.
        if (ctx.session.role !== 'DOCTOR') return ctx.forbid();
      }
      const newSlot = body.newSlotDatetime ? new Date(body.newSlotDatetime) : null;
      const plan = planApprove(card, { newSlot });
      if (!plan.ok) return ctx.bad(plan.reason);

      const updated = await ctx.tdb.transaction(async (tx) => {
        const u = await tx.card.update({
          where: { id },
          data: plan.patch,
        });
        await tx.cardEvent.create({
          data: {
            cardId: id,
            ...plan.event,
            actorUserId: ctx.session.userId,
            payload: { note: body.note ?? null },
          },
        });
        return u;
      });

      // Side effects via the outbox: confirm + 3 reminders. Each is durable
      // and survives the app/restart/provider outage.
      const slot = updated.slotDatetime ?? new Date();
      const settings = await ctx.tdb.settings.findFirst();
      const tz = settings?.timezone || 'Asia/Kolkata';
      const slotLabel = formatSlotForMessage(slot, tz);

      await enqueue({
        clinicId: ctx.session.clinicId,
        kind: 'whatsapp_template',
        cardId: updated.id,
        payload: {
          phone: card.patient.phone,
          templateName: 'appointment_confirm_request',
          bodyParams: [card.patient.name, card.doctor.name, slotLabel, updated.publicId],
          buttonPayload: `CONFIRM_CARD_${updated.publicId}`,
          patientId: card.patientId,
        },
      });

      const reminders: Array<{ minBefore: number; templateName: string }> = [
        { minBefore: 3 * 24 * 60, templateName: 'appointment_reminder_3d' },
        { minBefore: 4 * 60,      templateName: 'appointment_reminder_4h' },
        { minBefore: 30,          templateName: 'appointment_reminder_30m' },
      ];
      const now = Date.now();
      for (const r of reminders) {
        const sendAt = addMinutes(slot, -r.minBefore);
        if (sendAt.getTime() <= now) continue;
        await enqueue({
          clinicId: ctx.session.clinicId,
          kind: 'whatsapp_template',
          cardId: updated.id,
          scheduledAt: sendAt,
          payload: {
            phone: card.patient.phone,
            templateName: r.templateName,
            bodyParams: [card.patient.name, card.doctor.name, slotLabel],
            patientId: card.patientId,
          },
        });
      }

      await ctx.audit('card.approved', 'Card', id, { newSlot: !!newSlot });
      return ctx.ok({ ok: true });
    }

    if (body.to === 'consultation') {
      if (ctx.session.role === 'STAFF') return ctx.forbid();
      const plan = planStartConsultation(card);
      if (!plan.ok) return ctx.bad(plan.reason);

      await ctx.tdb.transaction(async (tx) => {
        await tx.card.update({ where: { id }, data: plan.patch });
        await tx.consultationDetails.create({ data: { cardId: id } });
        await tx.cardEvent.create({
          data: {
            cardId: id,
            ...plan.event,
            actorUserId: ctx.session.userId,
          },
        });
      });

      await ctx.audit('card.consult_started', 'Card', id);
      return ctx.ok({ ok: true });
    }

    // -------------------------------------------------------------------
    // State transitions (cancel / no_show / rejected / completed)
    // -------------------------------------------------------------------
    if (body.stateTo) {
      const plan = planStateChange(card, body.stateTo);
      if (!plan.ok) return ctx.bad(plan.reason);

      await ctx.tdb.transaction(async (tx) => {
        await tx.card.update({ where: { id }, data: plan.patch });
        await tx.cardEvent.create({
          data: {
            cardId: id,
            ...plan.event,
            actorUserId: ctx.session.userId,
            payload: { note: body.note ?? null },
          },
        });
      });

      // Cancel queued reminders for terminal states.
      if (['cancelled', 'rejected', 'no_show', 'completed'].includes(body.stateTo)) {
        await cancelForCard(ctx.session.clinicId, id);
      }

      await ctx.audit(`card.state_${body.stateTo}`, 'Card', id, {
        note: body.note ?? null,
      });
      return ctx.ok({ ok: true });
    }

    return ctx.bad('no_action');
  }
);
