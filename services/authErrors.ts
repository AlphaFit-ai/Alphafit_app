/**
 * Translation key for a Firebase auth error code, or null when the code has no specific message
 * (the screen then shows its own generic text). `firebaseAuthService` keeps the original code on
 * the errors it throws.
 */
const AUTH_ERROR_KEYS: Record<string, string> = {
  'auth/invalid-email': 'authErrors.invalidEmail',
  'auth/user-disabled': 'authErrors.userDisabled',
  'auth/user-not-found': 'authErrors.userNotFound',
  'auth/wrong-password': 'authErrors.wrongPassword',
  'auth/invalid-credential': 'authErrors.invalidCredential',
  'auth/email-already-in-use': 'authErrors.emailInUse',
  'auth/weak-password': 'authErrors.weakPassword',
  'auth/operation-not-allowed': 'authErrors.operationNotAllowed',
  'auth/too-many-requests': 'authErrors.tooManyRequests',
  'auth/network-request-failed': 'authErrors.network',
};

export function getAuthErrorKey(code: string | undefined | null): string | null {
  return (code && AUTH_ERROR_KEYS[code]) || null;
}
