/**
 * Every test runs in one fixed time zone, UTC+1 in winter (France), whatever the machine says. A CI
 * agent in UTC would otherwise hide a date bug that every phone outside UTC shows: the api sends its
 * date-times in UTC without a zone (docs/CONTRACTS.md section 1), and reading one as local time moved
 * late meals to the next day. Set before the workers start, so they inherit it. `__tests__/apiTime.test.ts`
 * also runs the date helpers in a UTC-5 zone, in a child process.
 */
module.exports = async () => {
  process.env.TZ = 'Europe/Paris';
};
