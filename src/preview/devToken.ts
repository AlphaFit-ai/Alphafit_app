/**
 * Reading the dev sign-in link of the browser preview (docs/CONTRACTS.md section 8):
 * `/dev-sign-in#token=<JWT>`. Pure functions, no storage and no network. The api decides whether the
 * token is really valid; the checks here only make a broken or old link fail with a clear message
 * before any request is made.
 */

export interface DevTokenClaims {
  /** The user id (`sub`). */
  userId: string;
  email: string | null;
  /** Expiry, seconds since 1970, when the token has one. */
  exp: number | null;
}

export type DevTokenCheck =
  | { ok: true; token: string; claims: DevTokenClaims }
  | { ok: false; reason: 'missing' | 'malformed' | 'expired' };

/** The `token` value of a URL fragment such as `#token=abc.def.ghi`, or null. */
export function tokenFromHash(hash: string | null | undefined): string | null {
  if (!hash) return null;
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  for (const part of fragment.split('&')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq) === 'token') {
      const value = part.slice(eq + 1).trim();
      try {
        return decodeURIComponent(value) || null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes base64url to a UTF-8 string without relying on `atob` (absent on some runtimes). */
function decodeBase64Url(input: string): string | null {
  const text = input.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (!/^[A-Za-z0-9+/]*$/.test(text) || text.length % 4 === 1) return null;
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of text) {
    buffer = (buffer << 6) | BASE64.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  try {
    return decodeURIComponent(bytes.map((b) => `%${b.toString(16).padStart(2, '0')}`).join(''));
  } catch {
    return null;
  }
}

/** The claims of a JWT, unverified (only the api can verify the signature), or null when unreadable. */
export function readClaims(token: string): DevTokenClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) return null;
  const json = decodeBase64Url(parts[1]);
  if (json === null) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }
  if (!payload || typeof payload !== 'object') return null;
  const { sub, email, exp } = payload as Record<string, unknown>;
  if (typeof sub !== 'string' || sub.length === 0) return null;
  return {
    userId: sub,
    email: typeof email === 'string' ? email : null,
    exp: typeof exp === 'number' && Number.isFinite(exp) ? exp : null,
  };
}

export function checkDevToken(token: string | null, nowMs: number = Date.now()): DevTokenCheck {
  if (!token) return { ok: false, reason: 'missing' };
  const claims = readClaims(token);
  if (!claims) return { ok: false, reason: 'malformed' };
  if (claims.exp !== null && claims.exp * 1000 <= nowMs) return { ok: false, reason: 'expired' };
  return { ok: true, token, claims };
}
