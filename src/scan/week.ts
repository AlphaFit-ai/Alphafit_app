import { localDayKey, parseApiDate } from '../../services/apiTime';
import type { FoodScanDto } from '../../services/foodScanService';

export interface WeekDay {
  /** Local calendar day, `YYYY-MM-DD`. */
  key: string;
  date: Date;
  isToday: boolean;
  /** Completed scans made on that day. */
  scans: number;
  /** Calories of those scans, rounded. */
  calories: number;
}

/** `YYYY-MM-DD` of a date in the phone's own time zone (a scan at 23:30 belongs to that day). */
export const dayKey = localDayKey;

/**
 * The last seven days, oldest first, ending today, each with the completed scans of that day. Only the
 * scans Home has loaded are counted (the latest 50), which covers a week for anyone who scans fewer
 * than seven meals a day.
 */
export function weekDays(
  scans: Pick<FoodScanDto, 'createdAt' | 'status' | 'nutritionSummary'>[],
  now: Date = new Date()
): WeekDay[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days: WeekDay[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    days.push({ key: dayKey(date), date, isToday: back === 0, scans: 0, calories: 0 });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const scan of scans) {
    if (scan.status !== 'COMPLETED') continue;
    // The api's createdAt is UTC without a zone; read as local time it moved late meals a day.
    const created = parseApiDate(scan.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const day = byKey.get(dayKey(created));
    if (!day) continue;
    day.scans += 1;
    day.calories += scan.nutritionSummary?.totalCalories || 0;
  }
  for (const day of days) day.calories = Math.round(day.calories);
  return days;
}
