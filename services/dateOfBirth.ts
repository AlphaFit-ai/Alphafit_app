/**
 * Date of birth as the api stores it: `{ month, day, year }` with `month` from 1 (January) to 12.
 *
 * Until 2026-11 the age screen stored the picker index, 0 (January) to 11, while the Home screen and
 * the api (`LocalDate.of(year, month, day)`) read 1 to 12. New builds store 1 to 12. A saved value of
 * 0 can only be an old January, so it reads as January; other old values are off by one month,
 * which changes an age by at most a month and cannot be corrected.
 */

export interface DateOfBirth {
  month: number;
  day: number;
  year: number;
}

/** The youngest age the year picker offers, and how many years it lists (unchanged from before). */
export const MIN_AGE_YEARS = 10;
export const BIRTH_YEAR_COUNT = 70;
const DEFAULT_AGE_YEARS = 19;

/** Years the picker lists, newest first, derived from today's date instead of a fixed 2015. */
export function getBirthYearRange(now: Date = new Date()): {
  maxYear: number;
  minYear: number;
  defaultYear: number;
} {
  const maxYear = now.getFullYear() - MIN_AGE_YEARS;
  return {
    maxYear,
    minYear: maxYear - (BIRTH_YEAR_COUNT - 1),
    defaultYear: now.getFullYear() - DEFAULT_AGE_YEARS,
  };
}

/** Picker position (0 = January) to the stored month (1 = January). */
export function toStoredMonth(monthIndex: number): number {
  return monthIndex + 1;
}

/** Stored month to a 1 to 12 month; a legacy 0 means January. */
export function normalizeStoredMonth(month: number): number {
  if (!Number.isFinite(month)) return 1;
  return Math.min(12, Math.max(1, Math.trunc(month)));
}

/** Age in whole years, or null when there is no date of birth. */
export function calculateAge(
  dob: DateOfBirth | undefined | null,
  today: Date = new Date()
): number | null {
  if (!dob) return null;
  const month = normalizeStoredMonth(dob.month);
  let age = today.getFullYear() - dob.year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.day)) {
    age -= 1;
  }
  return age;
}
