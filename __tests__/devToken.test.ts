import { checkDevToken, readClaims, tokenFromHash } from '../src/preview/devToken';

/** An unsigned JWT with these claims (the signature is never checked by the app, only by the api). */
function jwt(claims: Record<string, unknown>): string {
  const b64 = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url').replace(/=+$/, '');
  return `${b64({ alg: 'HS512', typ: 'JWT' })}.${b64(claims)}.c2lnbmF0dXJl`;
}

const NOW = Date.UTC(2026, 10, 14, 12, 0, 0);
const inAnHour = NOW / 1000 + 3600;

describe('tokenFromHash', () => {
  it('reads the token of the link, with or without the leading #', () => {
    expect(tokenFromHash('#token=abc.def.ghi')).toBe('abc.def.ghi');
    expect(tokenFromHash('token=abc.def.ghi')).toBe('abc.def.ghi');
    expect(tokenFromHash('#x=1&token=abc.def.ghi')).toBe('abc.def.ghi');
    expect(tokenFromHash('#token=abc%2Edef.ghi')).toBe('abc.def.ghi');
  });

  it('is null when there is no token', () => {
    expect(tokenFromHash('')).toBeNull();
    expect(tokenFromHash(null)).toBeNull();
    expect(tokenFromHash('#token=')).toBeNull();
    expect(tokenFromHash('#notoken=abc')).toBeNull();
    expect(tokenFromHash('#token=%E0%A4%A')).toBeNull(); // broken percent-encoding
  });
});

describe('readClaims', () => {
  it('reads sub (the user id), email and exp', () => {
    expect(readClaims(jwt({ sub: 'seed-user-demo', email: 'demo@example.test', exp: 99 }))).toEqual(
      {
        userId: 'seed-user-demo',
        email: 'demo@example.test',
        exp: 99,
      }
    );
  });

  it('copes with non-ASCII text in the claims', () => {
    expect(readClaims(jwt({ sub: 'u1', email: 'zoé@example.test' }))?.email).toBe(
      'zoé@example.test'
    );
  });

  it('refuses a token without a user id or that is not a JWT', () => {
    expect(readClaims(jwt({ email: 'a@b.c' }))).toBeNull();
    expect(readClaims(jwt({ sub: '' }))).toBeNull();
    expect(readClaims('not-a-jwt')).toBeNull();
    expect(readClaims('a.b')).toBeNull();
    expect(readClaims('a.%%%.c')).toBeNull();
    expect(readClaims(`a.${Buffer.from('not json').toString('base64url')}.c`)).toBeNull();
  });
});

describe('checkDevToken', () => {
  it('accepts a readable token that has not expired', () => {
    const token = jwt({ sub: 'seed-user-demo', exp: inAnHour });
    expect(checkDevToken(token, NOW)).toEqual({
      ok: true,
      token,
      claims: { userId: 'seed-user-demo', email: null, exp: inAnHour },
    });
  });

  it('says why a token is refused: missing, malformed or expired', () => {
    expect(checkDevToken(null, NOW)).toEqual({ ok: false, reason: 'missing' });
    expect(checkDevToken('garbage', NOW)).toEqual({ ok: false, reason: 'malformed' });
    expect(checkDevToken(jwt({ sub: 'u1', exp: NOW / 1000 - 1 }), NOW)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('leaves a token without exp to the api', () => {
    expect(checkDevToken(jwt({ sub: 'u1' }), NOW).ok).toBe(true);
  });
});
