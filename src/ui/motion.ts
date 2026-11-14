import { FadeInDown, useReducedMotion } from 'react-native-reanimated';

export const DURATION = { fast: 120, base: 200, slow: 320 } as const;

/** True when the phone asks for less motion; animations then become instant or are skipped. */
export function useReduceMotion(): boolean {
  return useReducedMotion();
}

/** A subtle entrance for list items: fade and rise, staggered by position. Nothing when motion is reduced. */
export function enter(index: number, reduce: boolean) {
  return reduce ? undefined : FadeInDown.delay(Math.min(index, 6) * 50).duration(240);
}
