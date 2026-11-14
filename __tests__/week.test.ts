import { dayKey, weekDays } from '../src/scan/week';

const scan = (createdAt: Date, calories = 100, status = 'COMPLETED') =>
  ({
    createdAt: createdAt.toISOString(),
    status,
    nutritionSummary: { totalCalories: calories },
  }) as never;

// Local time on purpose: the strip is about the user's own days.
const NOW = new Date(2026, 10, 13, 15, 0, 0); // 13 Nov 2026, 15:00

describe('weekDays', () => {
  it('is seven days, oldest first, ending today', () => {
    const days = weekDays([], NOW);
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.key)).toEqual([
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
    ]);
    expect(days.filter((d) => d.isToday).map((d) => d.key)).toEqual(['2026-11-13']);
  });

  it('counts completed scans per local day and adds their calories', () => {
    const days = weekDays(
      [
        scan(new Date(2026, 10, 13, 8, 0), 300),
        scan(new Date(2026, 10, 13, 12, 30), 450.4),
        scan(new Date(2026, 10, 11, 20, 0), 500),
      ],
      NOW
    );
    expect(days.find((d) => d.key === '2026-11-13')).toMatchObject({ scans: 2, calories: 750 });
    expect(days.find((d) => d.key === '2026-11-11')).toMatchObject({ scans: 1, calories: 500 });
    expect(days.find((d) => d.key === '2026-11-12')).toMatchObject({ scans: 0, calories: 0 });
  });

  it('puts a late-evening scan on its own day and a just-after-midnight scan on the next', () => {
    const days = weekDays(
      [scan(new Date(2026, 10, 12, 23, 59), 100), scan(new Date(2026, 10, 13, 0, 1), 200)],
      NOW
    );
    expect(days.find((d) => d.key === '2026-11-12')?.scans).toBe(1);
    expect(days.find((d) => d.key === '2026-11-13')?.scans).toBe(1);
  });

  it('ignores scans that failed or are still running, older than a week, in the future, or undated', () => {
    const days = weekDays(
      [
        scan(new Date(2026, 10, 13, 9, 0), 100, 'FAILED'),
        scan(new Date(2026, 10, 13, 9, 0), 100, 'PENDING'),
        scan(new Date(2026, 10, 6, 9, 0), 100),
        scan(new Date(2026, 10, 14, 9, 0), 100),
        { createdAt: 'not a date', status: 'COMPLETED' } as never,
      ],
      NOW
    );
    expect(days.reduce((n, d) => n + d.scans, 0)).toBe(0);
  });

  it('crosses a month boundary correctly', () => {
    const days = weekDays([], new Date(2026, 2, 2, 10, 0)); // 2 March 2026
    expect(days[0].key).toBe('2026-02-24');
    expect(dayKey(days[6].date)).toBe('2026-03-02');
  });
});
