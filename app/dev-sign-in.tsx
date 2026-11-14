import { Redirect } from 'expo-router';

/**
 * `/dev-sign-in#token=<JWT>`: the dev-only sign-in of the browser preview (docs/CONTRACTS.md
 * section 8, `npm run preview:serve`).
 *
 * In every other build this route is inert: the sign-in code is not in the bundle (the `require` below
 * is removed when the flag is not `1` at build time), the root layout does not let anybody reach the
 * route, and if it is rendered anyway it only sends the visitor to `/`.
 */
const preview: typeof import('../src/preview') | null =
  process.env.EXPO_PUBLIC_PREVIEW === '1'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be a require so a build without the flag drops it
      require('../src/preview')
    : null;

export default function DevSignInRoute() {
  if (!preview) return <Redirect href="/" />;
  return <preview.DevSignInScreen />;
}
