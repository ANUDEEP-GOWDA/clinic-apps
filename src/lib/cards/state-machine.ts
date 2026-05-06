/**
 * Card state machine.
 *
 * THE central business-logic module. Every card transition goes through here.
 * Routes are thin wrappers: auth → call this → persist.
 *
 * The Card has two orthogonal axes:
 *
 *   type:  request | appointment | consultation
 *   state: active  | cancelled   | no_show | completed | rejected
 *
 * Type transitions (in place — same row):
 *
 *     request ──[approve]──► appointment ──[start]──► consultation
 *
 *   Patient confirming an appointment does NOT change type — it sets
 *   `patientConfirmedAt` (a separate flag).
 *
 * State transitions (within a type):
 *
 *     request:      active ─► rejected | cancelled
 *     appointment:  active ─► cancelled | no_show
 *     consultation: active ─► completed
 *
 * Follow-ups are NEW Card rows with parentCardId set to the consultation row.
 * That keeps the state machine simple and the lineage queryable.
 *
 * Why a state machine module instead of inline code:
 *   - One place to read the rules. Adding "no_show on requests" or "lost
 *     contact" later means editing this file, not 12 routes.
 *   - Pure functions: easy to unit-test.
 *   - Routes shrink dramatically — the transition route is ~50 lines, not 220.
 */

export const CardType = {
  REQUEST: 'request',
  APPOINTMENT: 'appointment',
  CONSULTATION: 'consultation',
} as const;
export type CardTypeValue = (typeof CardType)[keyof typeof CardType];

export const CardState = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
} as const;
export type CardStateValue = (typeof CardState)[keyof typeof CardState];

const TYPE_TRANSITIONS: Record<string, string[]> = {
  request: ['appointment'],
  appointment: ['consultation'],
  consultation: [],
};

const STATE_TRANSITIONS: Record<string, Record<string, string[]>> = {
  request: { active: ['rejected', 'cancelled'] },
  appointment: { active: ['cancelled', 'no_show'] },
  consultation: { active: ['completed'] },
};

export function canTransitionType(from: string, to: string): boolean {
  return (TYPE_TRANSITIONS[from] ?? []).includes(to);
}

export function canTransitionState(type: string, from: string, to: string): boolean {
  return (STATE_TRANSITIONS[type]?.[from] ?? []).includes(to);
}

export function isTerminalState(state: string): boolean {
  return state !== 'active';
}

// ---------------------------------------------------------------------------
// Pure planners — given a card + a desired action, return the change set.
// These don't touch the DB; the route handler applies the result inside
// a transaction and writes the CardEvent.
// ---------------------------------------------------------------------------

export type CardLike = {
  id: number;
  type: string;
  state: string;
  slotDatetime: Date | null;
};

export type Plan = {
  ok: true;
  patch: {
    type?: string;
    state?: string;
    slotDatetime?: Date | null;
    originalSlotDatetime?: Date | null;
    actualStartAt?: Date | null;
  };
  event: {
    fromType: string | null;
    toType: string | null;
    fromState: string | null;
    toState: string | null;
  };
} | { ok: false; reason: string };

export function planApprove(card: CardLike, opts?: { newSlot?: Date | null }): Plan {
  if (!canTransitionType(card.type, 'appointment')) {
    return { ok: false, reason: 'invalid_type_transition' };
  }
  const patch: Plan extends { ok: true; patch: infer P } ? P : never = {
    type: 'appointment',
  };
  if (
    opts?.newSlot &&
    card.slotDatetime &&
    opts.newSlot.getTime() !== card.slotDatetime.getTime()
  ) {
    patch.slotDatetime = opts.newSlot;
    patch.originalSlotDatetime = card.slotDatetime;
  }
  return {
    ok: true,
    patch,
    event: {
      fromType: 'request',
      toType: 'appointment',
      fromState: card.state,
      toState: card.state,
    },
  };
}

export function planStartConsultation(card: CardLike): Plan {
  if (!canTransitionType(card.type, 'consultation')) {
    return { ok: false, reason: 'invalid_type_transition' };
  }
  return {
    ok: true,
    patch: { type: 'consultation', actualStartAt: new Date() },
    event: {
      fromType: 'appointment',
      toType: 'consultation',
      fromState: card.state,
      toState: card.state,
    },
  };
}

export function planStateChange(card: CardLike, toState: string): Plan {
  if (!canTransitionState(card.type, card.state, toState)) {
    return { ok: false, reason: 'invalid_state_transition' };
  }
  return {
    ok: true,
    patch: { state: toState },
    event: {
      fromType: card.type,
      toType: card.type,
      fromState: card.state,
      toState,
    },
  };
}
