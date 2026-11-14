import type { DevSignInFailure } from './devSignIn';

/**
 * Text of the dev-only preview tools (the dev sign-in screen and the manual barcode entry). They are
 * developer tools that exist only in a preview build, so they are in English and are not part of the
 * app's translations.
 */
export const TOKEN_COMMAND_WINDOWS = 'Alphafit-manifests\\compose\\demo-token.ps1';
export const TOKEN_COMMAND_UNIX = './Alphafit-manifests/compose/demo-token.sh';

export const DEV_SIGN_IN_COPY = {
  working: 'Signing in to the preview',
  failedTitle: 'This sign-in link did not work',
  howTo: 'Get a new link: run one of these in the AlphaFit folder, then open the link it prints.',
  toLogin: 'Go to the login screen',
  reasons: {
    disabled: 'This build does not accept dev sign-in links.',
    missing: 'The link has no token. It must look like /dev-sign-in#token=...',
    malformed: 'The token in the link is not a valid JWT (it may have been cut when copied).',
    expired: 'The token in the link has expired (tokens last 24 hours).',
    rejected:
      'The api refused the token. It may have expired, or it was signed for another stack, or the demo user does not exist yet (run the seed).',
    offline: 'The api did not answer. Start the local stack, then open the link again.',
    failed: 'Something went wrong while signing in. Open the link again.',
  } satisfies Record<DevSignInFailure, string>,
} as const;

export const MANUAL_BARCODE_COPY = {
  title: 'Enter a barcode',
  message:
    'Preview only: there is no camera in the browser, so type the digits under the barcode. The lookup is the real one.',
  label: 'Barcode digits',
  placeholder: '3017620422003',
  lookUp: 'Look up',
  invalid: 'Type 6 to 14 digits.',
} as const;
