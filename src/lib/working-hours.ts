/**
 * Working hours JSON helpers.
 *
 * Stored shape on Settings.workingHours:
 * {
 *   "mon": [{"start":"10:00","end":"13:00"}, ...],
 *   "tue": [...], ..., "sun": []
 * }
 *
 * NOTE: Settings.workingHours describes the CLINIC's general opening hours
 * (used for SEO / public site display). Individual doctor availability is
 * stored in DoctorSchedule rows, which is what the slot calculator uses.
 */

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type Window = { start: string; end: string };
export type WorkingHours = Record<DayKey, Window[]>;

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// JS Date.getDay() returns 0=Sun..6=Sat. Map to our key order.
export const JS_DAY_TO_KEY: Record<number, DayKey> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

export const EMPTY_WORKING_HOURS: WorkingHours = {
  mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [],
};

export function parseWorkingHours(input: unknown): WorkingHours {
  let obj: Record<string, unknown> = {};
  if (input && typeof input === 'object') {
    obj = input as Record<string, unknown>;
  } else if (typeof input === 'string') {
    try { obj = JSON.parse(input || '{}'); } catch { obj = {}; }
  }
  const result: WorkingHours = { ...EMPTY_WORKING_HOURS };
  for (const k of DAY_KEYS) {
    const arr = obj[k];
    if (Array.isArray(arr)) {
      result[k] = arr.filter(
        (w: unknown): w is Window =>
          !!w && typeof w === 'object' && 'start' in w! && 'end' in w!
      );
    }
  }
  return result;
}

export function stringifyWorkingHours(wh: WorkingHours): string {
  return JSON.stringify(wh);
}

/**
 * Convert WorkingHours to schema.org openingHoursSpecification entries.
 */
export function toOpeningHoursSpec(wh: WorkingHours) {
  const dayName: Record<DayKey, string> = {
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
    fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
  };
  const out: Array<{ '@type': 'OpeningHoursSpecification'; dayOfWeek: string; opens: string; closes: string }> = [];
  for (const k of DAY_KEYS) {
    for (const w of wh[k]) {
      out.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayName[k],
        opens: w.start,
        closes: w.end,
      });
    }
  }
  return out;
}

/**
 * Format working hours for human display, e.g.:
 *   "Mon–Sat: 10:00–13:00, 17:00–20:00; Sun: Closed"
 */
export function formatWorkingHoursHuman(wh: WorkingHours): string {
  const dayLabel: Record<DayKey, string> = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
    fri: 'Fri', sat: 'Sat', sun: 'Sun',
  };
  return DAY_KEYS.map((k) => {
    const wins = wh[k];
    const label = dayLabel[k];
    if (!wins.length) return `${label}: Closed`;
    const inner = wins.map((w) => `${w.start}–${w.end}`).join(', ');
    return `${label}: ${inner}`;
  }).join(' · ');
}
