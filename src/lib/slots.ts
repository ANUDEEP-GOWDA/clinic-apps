/**
 * Free-slot calculator.
 *
 * Algorithm (per spec Part 11):
 *  1. If !doctor.acceptingAppointments -> []
 *  2. Find DoctorSchedule rows for dayOfWeek of the requested date
 *  3. If no schedule rows -> []
 *  4. Find DoctorDayOverride rows for that date. Any fullDayOff -> []
 *  5. For each schedule window, enumerate slots stepping by
 *     doctor.consultationDurationMin
 *  6. Subtract slots that overlap a non-fullDayOff override block
 *  7. Subtract slots already taken (active Cards on that date)
 *  8. Subtract slots strictly in the past
 *  9. Return ISO strings sorted ascending
 *
 * Times-of-day stored as "HH:mm" strings interpreted in the clinic's
 * configured timezone. We compute slot Date objects in UTC by combining
 * the requested date (start-of-day in clinic TZ) with HH:mm offsets.
 */

import { prisma } from './db';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export type SlotResult = { datetime: string; durationMin: number };

function parseHHmm(s: string): { h: number; m: number } | null {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return { h, m: mi };
}

/**
 * Combine a date (any time) with an HH:mm string in a given timezone,
 * returning a UTC Date pointing to that wall-clock instant.
 */
function combineDateAndTime(date: Date, hhmm: string, timezone: string): Date | null {
  const t = parseHHmm(hhmm);
  if (!t) return null;
  // Build a "naive" YYYY-MM-DD HH:mm in the clinic timezone, then convert.
  const zoned = toZonedTime(date, timezone);
  const y = zoned.getFullYear();
  const mo = zoned.getMonth();
  const d = zoned.getDate();
  // Construct the wall time as if local, then interpret in the timezone.
  const wallTime = new Date(Date.UTC(y, mo, d, t.h, t.m, 0, 0));
  // Treat wallTime's components as the zoned wall-time and convert to UTC.
  const isoLike = `${y.toString().padStart(4, '0')}-${(mo + 1).toString().padStart(2, '0')}-${d
    .toString()
    .padStart(2, '0')}T${t.h.toString().padStart(2, '0')}:${t.m.toString().padStart(2, '0')}:00`;
  return fromZonedTime(isoLike, timezone);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function getFreeSlots(opts: {
  clinicId: number;
  doctorId: number;
  date: Date; // any time on the desired date
  timezone: string;
  now?: Date;
}): Promise<SlotResult[]> {
  const { clinicId, doctorId, date, timezone } = opts;
  const now = opts.now ?? new Date();

  // Scope to clinic — defense in depth even though doctor.id is a unique key.
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
    include: {
      schedules: { where: { active: true } },
      dayOverrides: true,
    },
  });
  if (!doctor || !doctor.active) return [];
  if (!doctor.acceptingAppointments) return [];

  // Step 2: pick schedule rows for that day-of-week (in clinic timezone)
  const zoned = toZonedTime(date, timezone);
  const dow = zoned.getDay(); // 0..6, Sun..Sat
  const todaysSchedules = doctor.schedules.filter((s) => s.dayOfWeek === dow);
  if (todaysSchedules.length === 0) return [];

  // Step 4: find overrides for that calendar date (clinic TZ)
  const dayStartUtc = fromZonedTime(
    `${zoned.getFullYear()}-${(zoned.getMonth() + 1).toString().padStart(2, '0')}-${zoned
      .getDate()
      .toString()
      .padStart(2, '0')}T00:00:00`,
    timezone
  );
  const dayEndUtc = addMinutes(dayStartUtc, 24 * 60);

  const overrides = doctor.dayOverrides.filter((o) => {
    const od = new Date(o.date);
    return od >= dayStartUtc && od < dayEndUtc;
  });
  if (overrides.some((o) => o.fullDayOff)) return [];

  const blockRanges: Array<{ start: Date; end: Date }> = [];
  for (const o of overrides) {
    if (!o.blockStart || !o.blockEnd) continue;
    const s = combineDateAndTime(dayStartUtc, o.blockStart, timezone);
    const e = combineDateAndTime(dayStartUtc, o.blockEnd, timezone);
    if (s && e) blockRanges.push({ start: s, end: e });
  }

  // Step 7 prep: existing active cards on that date for this doctor.
  // Scoped to clinic for defense in depth (cardId+clinicId composite index).
  const existingCards = await prisma.card.findMany({
    where: {
      clinicId,
      doctorId,
      slotDatetime: { gte: dayStartUtc, lt: dayEndUtc },
      type: { in: ['request', 'appointment', 'consultation'] },
      state: 'active',
    },
    select: { slotDatetime: true, durationMin: true },
  });
  const taken: Array<{ start: Date; end: Date }> = existingCards
    .filter((c): c is { slotDatetime: Date; durationMin: number } => !!c.slotDatetime)
    .map((c) => ({
      start: c.slotDatetime,
      end: addMinutes(c.slotDatetime, c.durationMin || doctor.consultationDurationMin),
    }));

  // Step 5: enumerate slots from each schedule window
  const duration = doctor.consultationDurationMin || 15;
  const slots: SlotResult[] = [];
  for (const sch of todaysSchedules) {
    const winStart = combineDateAndTime(dayStartUtc, sch.startTime, timezone);
    const winEnd = combineDateAndTime(dayStartUtc, sch.endTime, timezone);
    if (!winStart || !winEnd || winEnd <= winStart) continue;

    let cursor = winStart;
    while (addMinutes(cursor, duration) <= winEnd) {
      const slotStart = cursor;
      const slotEnd = addMinutes(cursor, duration);

      const blocked = blockRanges.some((b) => overlaps(slotStart, slotEnd, b.start, b.end));
      const isTaken = taken.some((t) => overlaps(slotStart, slotEnd, t.start, t.end));
      const inPast = slotStart <= now;

      if (!blocked && !isTaken && !inPast) {
        slots.push({ datetime: slotStart.toISOString(), durationMin: duration });
      }
      cursor = addMinutes(cursor, duration);
    }
  }

  // Sort + de-dup by datetime
  const seen = new Set<string>();
  return slots
    .filter((s) => {
      if (seen.has(s.datetime)) return false;
      seen.add(s.datetime);
      return true;
    })
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

/**
 * Convenience: next-N-days availability for one doctor.
 */
export async function getAvailabilityWindow(opts: {
  clinicId: number;
  doctorId: number;
  days: number;
  timezone: string;
  now?: Date;
}): Promise<Record<string, SlotResult[]>> {
  const out: Record<string, SlotResult[]> = {};
  const start = opts.now ?? new Date();
  for (let i = 0; i < opts.days; i++) {
    const d = addMinutes(startOfDay(start), i * 24 * 60);
    const slots = await getFreeSlots({
      clinicId: opts.clinicId,
      doctorId: opts.doctorId,
      date: d,
      timezone: opts.timezone,
      now: opts.now,
    });
    const zoned = toZonedTime(d, opts.timezone);
    const key = `${zoned.getFullYear()}-${(zoned.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${zoned.getDate().toString().padStart(2, '0')}`;
    out[key] = slots;
  }
  return out;
}

// keep endOfDay import used so esbuild does not strip
void endOfDay;
