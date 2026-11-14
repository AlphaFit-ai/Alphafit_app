import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { apiTime, isSameLocalDay, localDayKey, parseApiDate } from '../services/apiTime';

/**
 * The api sends date-times in UTC without a zone (docs/CONTRACTS.md section 1). JavaScript reads such a
 * value as device-local time, so on a phone in France every scan was an hour off and a meal at 23:30 UTC
 * landed on the wrong day. `parseApiDate` reads them as UTC; the phone shows them in its own zone.
 */
describe('parseApiDate', () => {
  it('reads a zone-less api date-time as UTC', () => {
    expect(parseApiDate('2026-11-14T12:03:11.769').toISOString()).toBe('2026-11-14T12:03:11.769Z');
    expect(parseApiDate('2026-11-14T12:03:11').toISOString()).toBe('2026-11-14T12:03:11.000Z');
    expect(parseApiDate('2026-11-14T12:03').toISOString()).toBe('2026-11-14T12:03:00.000Z');
    expect(parseApiDate('2026-11-14 12:03:11').toISOString()).toBe('2026-11-14T12:03:11.000Z');
  });

  it('keeps Java nano-second fractions to milliseconds', () => {
    expect(parseApiDate('2026-11-14T23:59:59.123456789').toISOString()).toBe(
      '2026-11-14T23:59:59.123Z'
    );
    expect(parseApiDate('2026-11-14T23:59:59.5').toISOString()).toBe('2026-11-14T23:59:59.500Z');
  });

  it('keeps a value that already says its zone', () => {
    expect(parseApiDate('2026-11-14T23:30:00Z').toISOString()).toBe('2026-11-14T23:30:00.000Z');
    expect(parseApiDate('2026-11-15T00:30:00+01:00').toISOString()).toBe(
      '2026-11-14T23:30:00.000Z'
    );
    expect(parseApiDate('2026-11-14T18:30:00-0500').toISOString()).toBe('2026-11-14T23:30:00.000Z');
  });

  it('reads numbers as epoch milliseconds (chat timestamps)', () => {
    const ms = Date.UTC(2026, 10, 14, 23, 30);
    expect(parseApiDate(ms).getTime()).toBe(ms);
    expect(apiTime(ms)).toBe(ms);
  });

  it('gives an invalid date, not "now", for a missing or unreadable value', () => {
    for (const value of [undefined, null, '', '   ', 'yesterday']) {
      expect(Number.isNaN(apiTime(value))).toBe(true);
    }
    expect(isSameLocalDay(undefined)).toBe(false);
  });

  it('runs this suite in a UTC+1 zone, so a value read as local time would fail here', () => {
    // jest.globalSetup.js pins Europe/Paris; without it a UTC machine hides the bug.
    expect(new Date(Date.UTC(2026, 10, 14, 12)).getTimezoneOffset()).toBe(-60);
    expect(localDayKey(parseApiDate('2026-11-14T23:30:00'))).toBe('2026-11-15');
  });
});

/**
 * The same helpers in two real device zones. The test process cannot change its own zone, so each zone
 * runs in a child `node` with `TZ` set, on the helpers compiled from the source.
 */
describe('on a phone in another time zone', () => {
  let dir: string;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- the compiler, only in this test
    const ts = require('typescript') as typeof import('typescript');
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'alphafit-apitime-'));
    for (const file of ['services/apiTime.ts', 'src/scan/week.ts']) {
      const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
      });
      const out = path.join(dir, file.replace(/\.ts$/, '.js'));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, outputText);
    }
  });

  afterAll(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  /** Runs `body` in a child process in `zone`; it gets `t` (apiTime) and `w` (week), returns JSON. */
  function inZone(zone: string, body: string) {
    const script = `
      const t = require(${JSON.stringify(path.join(dir, 'services/apiTime.js'))});
      const w = require(${JSON.stringify(path.join(dir, 'src/scan/week.js'))});
      const result = (() => { ${body} })();
      process.stdout.write(JSON.stringify(result));`;
    const run = spawnSync(process.execPath, ['-e', script], {
      env: { ...process.env, TZ: zone },
      encoding: 'utf8',
    });
    if (run.status !== 0) throw new Error(run.stderr);
    return JSON.parse(run.stdout);
  }

  const DAYS = `
    const day = (v) => t.localDayKey(t.parseApiDate(v));
    const hour = (v) => t.parseApiDate(v).getHours();
    return {
      offset: new Date(Date.UTC(2026, 10, 14, 12)).getTimezoneOffset(),
      beforeUtcMidnight: [day('2026-11-14T23:59:00'), hour('2026-11-14T23:59:00')],
      afterUtcMidnight: [day('2026-11-15T00:01:00'), hour('2026-11-15T00:01:00')],
    };`;

  it('UTC+1 (Paris): just before and just after midnight UTC are both the 15th, after midnight', () => {
    expect(inZone('Europe/Paris', DAYS)).toEqual({
      offset: -60,
      beforeUtcMidnight: ['2026-11-15', 0],
      afterUtcMidnight: ['2026-11-15', 1],
    });
  });

  it('UTC-5 (New York): just before and just after midnight UTC are both the 14th, in the evening', () => {
    expect(inZone('America/New_York', DAYS)).toEqual({
      offset: 300,
      beforeUtcMidnight: ['2026-11-14', 18],
      afterUtcMidnight: ['2026-11-14', 19],
    });
  });

  const TODAY = `
    // "Now" is 15 Nov, 10:00 local time on the phone.
    const now = new Date(2026, 10, 15, 10, 0);
    return ['2026-11-14T23:59:00', '2026-11-15T00:01:00'].map((v) => t.isSameLocalDay(v, now));`;

  it("UTC+1: both scans count for Home's today on the 15th", () => {
    expect(inZone('Europe/Paris', TODAY)).toEqual([true, true]);
  });

  it("UTC-5: neither scan counts for Home's today on the 15th (they were eaten on the 14th)", () => {
    expect(inZone('America/New_York', TODAY)).toEqual([false, false]);
  });

  const WEEK = `
    const now = new Date(2026, 10, 15, 10, 0);
    const scans = ['2026-11-14T23:59:00', '2026-11-15T00:01:00'].map((createdAt) => ({
      createdAt, status: 'COMPLETED', nutritionSummary: { totalCalories: 100 },
    }));
    return w.weekDays(scans, now).filter((d) => d.scans > 0).map((d) => [d.key, d.scans]);`;

  it('the week strip puts the scans on the day the phone was in', () => {
    expect(inZone('Europe/Paris', WEEK)).toEqual([['2026-11-15', 2]]);
    expect(inZone('America/New_York', WEEK)).toEqual([['2026-11-14', 2]]);
  });
});
