/**
 * Date-times from the api (docs/CONTRACTS.md section 1, "Time"): `LIVE` fields such as a scan's
 * `createdAt` are ISO date-times **without a zone, in UTC** (`2026-11-14T12:03:11.769`). JavaScript reads
 * a zone-less date-time as device-local time, which put every scan an hour off on a phone in France and
 * moved late-evening meals to the wrong day. Every api date-time goes through `parseApiDate`.
 *
 * Numbers are epoch milliseconds (the chat's `timestamp`) and are already absolute.
 */

const ZONELESS = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2})?)(?:\.(\d+))?$/;
const HAS_ZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** The instant an api date-time stands for. An unreadable value gives an invalid Date (NaN time). */
export function parseApiDate(value: string | number | Date | null | undefined): Date {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === 'number') return new Date(value);
  if (typeof value !== 'string' || value.trim() === '') return new Date(NaN);
  const text = value.trim();
  const zoneless = ZONELESS.exec(text);
  if (zoneless) {
    const [, day, time, fraction] = zoneless;
    // Java may send up to nine fraction digits; Date (and Hermes in particular) wants at most three.
    const millis = fraction ? `.${fraction.slice(0, 3).padEnd(3, '0')}` : '';
    const seconds = time.length === 5 ? `${time}:00` : time;
    return new Date(`${day}T${seconds}${millis}Z`);
  }
  if (HAS_ZONE.test(text)) return new Date(text);
  // A date without a time ("2026-11-14") is a calendar day; Date already reads that form as UTC.
  return new Date(text);
}

/** Epoch milliseconds of an api date-time, or NaN. */
export function apiTime(value: string | number | Date | null | undefined): number {
  return parseApiDate(value).getTime();
}

/** `YYYY-MM-DD` of the day an instant falls on in the phone's own time zone. */
export function localDayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True when an api date-time falls on the same local calendar day as `now`. */
export function isSameLocalDay(
  value: string | number | Date | null | undefined,
  now: Date = new Date()
): boolean {
  const date = parseApiDate(value);
  return !Number.isNaN(date.getTime()) && localDayKey(date) === localDayKey(now);
}
