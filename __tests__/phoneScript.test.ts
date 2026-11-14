/**
 * `npm run phone` (scripts/phone.js) starts Metro for Expo Go. A phone cannot reach this computer's
 * localhost, so an api address it cannot use stops the script with what to set instead.
 */
const { checkPhoneApiUrl, isPrivateIPv4, phoneEnv } = jest.requireActual('../scripts/phone');

it('accepts the computer on the Wi-Fi and a public https api', () => {
  expect(checkPhoneApiUrl('http://192.168.1.190:8180')).toEqual({
    ok: true,
    url: 'http://192.168.1.190:8180',
    host: '192.168.1.190',
  });
  expect(checkPhoneApiUrl('https://api.alphafit-ai.com/')).toMatchObject({
    ok: true,
    url: 'https://api.alphafit-ai.com',
  });
});

it('refuses an unset address, which would make the phone call the production api', () => {
  for (const value of [undefined, '', '   ']) {
    const check = checkPhoneApiUrl(value);
    expect(check.ok).toBe(false);
    expect(check.message).toMatch(/not set/);
    expect(check.message).toMatch(/EXPO_PUBLIC_API_URL=http:\/\/192\.168\.1\.190:8180/);
  }
});

it('refuses localhost, loopback and the emulator alias, which a phone cannot reach', () => {
  for (const value of [
    'http://localhost:8180',
    'http://127.0.0.1:8180',
    'http://[::1]:8180',
    'http://0.0.0.0:8180',
    'http://10.0.2.2:8180',
  ]) {
    const check = checkPhoneApiUrl(value);
    expect(check.ok).toBe(false);
    expect(check.message).toMatch(/cannot reach/);
  }
});

it('refuses something that is not an http(s) address', () => {
  expect(checkPhoneApiUrl('192.168.1.190:8180').ok).toBe(false);
  expect(checkPhoneApiUrl('ftp://192.168.1.190').ok).toBe(false);
});

it('advertises Metro on the same LAN address as the api, unless told otherwise', () => {
  expect(isPrivateIPv4('192.168.1.190')).toBe(true);
  expect(isPrivateIPv4('172.20.0.1')).toBe(true);
  expect(isPrivateIPv4('8.8.8.8')).toBe(false);
  const lan = checkPhoneApiUrl('http://192.168.1.190:8180');
  expect(phoneEnv(lan, {})).toEqual({
    EXPO_PUBLIC_API_URL: 'http://192.168.1.190:8180',
    REACT_NATIVE_PACKAGER_HOSTNAME: '192.168.1.190',
  });
  expect(phoneEnv(lan, { REACT_NATIVE_PACKAGER_HOSTNAME: '10.1.1.1' })).toMatchObject({
    REACT_NATIVE_PACKAGER_HOSTNAME: '10.1.1.1',
  });
  const vps = checkPhoneApiUrl('https://api.alphafit-ai.com');
  expect(phoneEnv(vps, {})).not.toHaveProperty('REACT_NATIVE_PACKAGER_HOSTNAME');
});
