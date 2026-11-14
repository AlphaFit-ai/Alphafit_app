import {
  BIRTH_YEAR_COUNT,
  calculateAge,
  getBirthYearRange,
  MIN_AGE_YEARS,
  normalizeStoredMonth,
  toStoredMonth,
} from '../services/dateOfBirth';

describe('month', () => {
  it('is stored as 1 to 12 from the picker position 0 to 11', () => {
    expect(toStoredMonth(0)).toBe(1); // January
    expect(toStoredMonth(11)).toBe(12); // December
  });

  it('reads a legacy 0 as January and keeps 1 to 12', () => {
    expect(normalizeStoredMonth(0)).toBe(1);
    expect(normalizeStoredMonth(1)).toBe(1);
    expect(normalizeStoredMonth(12)).toBe(12);
    expect(normalizeStoredMonth(99)).toBe(12);
    expect(normalizeStoredMonth(Number.NaN)).toBe(1);
  });
});

describe('calculateAge', () => {
  const today = new Date(2026, 10, 13); // 13 November 2026

  it('counts whole years', () => {
    expect(calculateAge({ month: 11, day: 13, year: 2000 }, today)).toBe(26); // birthday today
    expect(calculateAge({ month: 11, day: 14, year: 2000 }, today)).toBe(25); // tomorrow
    expect(calculateAge({ month: 12, day: 1, year: 2000 }, today)).toBe(25);
    expect(calculateAge({ month: 1, day: 1, year: 2000 }, today)).toBe(26);
  });

  it('treats the month as 1 to 12, the same way the age screen now stores it', () => {
    // Picking "March" (index 2) must give a March birthday, not an April one.
    const dob = { month: toStoredMonth(2), day: 31, year: 2000 };
    expect(calculateAge(dob, new Date(2026, 2, 30))).toBe(25); // 30 March: birthday not yet
    expect(calculateAge(dob, new Date(2026, 2, 31))).toBe(26); // 31 March: birthday
  });

  it('reads a January stored by an old build as 0', () => {
    expect(calculateAge({ month: 0, day: 5, year: 2000 }, today)).toBe(26);
  });

  it('is null without a date of birth', () => {
    expect(calculateAge(undefined, today)).toBeNull();
    expect(calculateAge(null, today)).toBeNull();
  });
});

describe('getBirthYearRange', () => {
  it('follows the current year instead of a fixed 2015', () => {
    const a = getBirthYearRange(new Date(2026, 5, 1));
    const b = getBirthYearRange(new Date(2031, 5, 1));
    expect(a.maxYear).toBe(2026 - MIN_AGE_YEARS);
    expect(b.maxYear).toBe(a.maxYear + 5);
    expect(a.maxYear - a.minYear + 1).toBe(BIRTH_YEAR_COUNT);
    expect(a.defaultYear).toBeLessThanOrEqual(a.maxYear);
    expect(a.defaultYear).toBeGreaterThanOrEqual(a.minYear);
  });
});
