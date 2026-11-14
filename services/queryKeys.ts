/** One place for every query key, so a screen and the code that updates the cache agree. */
export const queryKeys = {
  profile: ['profile'] as const,
  onboarding: ['onboarding', 'main'] as const,
  diet: ['onboarding', 'diet'] as const,
  projection: ['onboarding', 'projection'] as const,
  avatar: ['avatar'] as const,
  scansRecent: ['scans', 'recent'] as const,
  scansHistory: ['scans', 'history'] as const,
  scan: (id: string) => ['scans', 'detail', id] as const,
};
