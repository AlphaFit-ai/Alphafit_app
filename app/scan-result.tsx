/**
 * A saved scan's result, opened from Home or History (`/scan-result?scanId=...`), as a sheet that slides
 * up over the screen it came from. It is a route of the root Stack because only the root Stack can
 * present it that way (`app/_layout.tsx`): inside `app/diet/`, whose own Stack owns its screens, the
 * root's modal options were ignored and the sheet opened as a plain screen. The Diet tab still shows
 * the same screen inline after a new scan.
 */
export { default } from './diet/diet-statistics';
