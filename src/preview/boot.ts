import { tokenFromHash } from './devToken';

/**
 * Runs once, when the preview bundle starts (it is imported by the root layout, behind the preview
 * flag): if the page was opened as `/dev-sign-in#token=...`, the token is taken out of the address bar
 * at once, before the router or anything else can copy the URL, and kept in memory for the
 * dev-sign-in screen. It is never written anywhere by this module.
 */
const DEV_SIGN_IN_PATH = '/dev-sign-in';

let captured: string | null = null;

function capture(): void {
  if (typeof window === 'undefined') return;
  const { location, history } = window;
  if (!location || typeof location.hash !== 'string') return;
  if (!location.pathname.replace(/\/+$/, '').endsWith(DEV_SIGN_IN_PATH)) return;
  const token = tokenFromHash(location.hash);
  if (!token) return;
  captured = token;
  try {
    history.replaceState(history.state, '', location.pathname + location.search);
  } catch {
    // The address bar keeps the fragment; signing in still works.
  }
}

capture();

/** The token the page was opened with, once: a second call returns null. */
export function takeCapturedToken(): string | null {
  const token = captured;
  captured = null;
  return token;
}

/** Test helper: pretend the page was opened with this token. */
export function _setCapturedToken(token: string | null): void {
  captured = token;
}
