import { DateTime } from 'luxon';

export interface LocalBirth {
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm (24 hour), or null if unknown. */
  time: string | null;
  /** IANA zone, such as America/Toronto */
  zone: string;
}

/** Converts local birth time to UTC using historical zone rules. Unknown time uses 12:00. */
export function toUtc(b: LocalBirth): Date {
  const [h, m] = (b.time ?? '12:00').split(':').map(Number);
  const [y, mo, d] = b.date.split('-').map(Number);
  const dt = DateTime.fromObject({ year: y, month: mo, day: d, hour: h, minute: m }, { zone: b.zone });
  if (!dt.isValid) throw new Error(`Invalid birth date/time or zone: ${dt.invalidExplanation}`);
  return dt.toUTC().toJSDate();
}

/** UTC instants for the start and end of the local calendar day (for Moon sign-change checks). */
export function localDayBounds(date: string, zone: string): [Date, Date] {
  const start = DateTime.fromISO(date, { zone }).startOf('day');
  return [start.toUTC().toJSDate(), start.plus({ days: 1 }).toUTC().toJSDate()];
}
