/**
 * Switches for work that is built but not offered yet. Change a value here, nowhere else.
 *
 * `projections`: the physique analysis (Projections tab, intro scores, the Pro plan and FAQ lines about
 * it). ROADMAP decision D2: hidden until the analysis exists, because today it shows mock scores.
 * The code stays in `app/(tabs)/projections.tsx` and `app/projection/*`, so turning this on brings it back.
 */
export const FEATURES = {
  projections: false,
} as const;
