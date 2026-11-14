#!/usr/bin/env node
/**
 * `npm run phone`: Metro for Expo Go (SDK 58) on a phone on the same Wi-Fi as this computer.
 *
 *   EXPO_PUBLIC_API_URL=http://192.168.1.190:8180 npm run phone          (Git Bash, macOS, Linux)
 *   $env:EXPO_PUBLIC_API_URL="http://192.168.1.190:8180"; npm run phone   (PowerShell)
 *
 * or put EXPO_PUBLIC_API_URL in `.env`. It refuses an address the phone cannot reach (localhost, the
 * emulator's 10.0.2.2) instead of starting an app that cannot sign in. When the api is on a private LAN
 * address, Metro advertises that same address (REACT_NATIVE_PACKAGER_HOSTNAME), so the exp:// link does
 * not point at a Docker or WSL network adapter. Extra arguments go to `expo start` (`--clear`).
 */
const { spawn } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8081;
const EXAMPLE = 'http://192.168.1.190:8180';

/** The address as Expo will see it: the environment first, then `.env` files. */
function configuredApiUrl(env = process.env) {
  if (env.EXPO_PUBLIC_API_URL) return env.EXPO_PUBLIC_API_URL;
  try {
    const parsed = require('@expo/env').parseProjectEnv(ROOT, { silent: true });
    return parsed.env.EXPO_PUBLIC_API_URL;
  } catch {
    return undefined;
  }
}

const PHONE_CANNOT_REACH = /^(localhost|127(\.\d+){3}|0\.0\.0\.0|\[?::1?\]?|10\.0\.2\.2)$/i;

/** Whether a phone can use this api address, with the reason when it cannot. */
function checkPhoneApiUrl(value) {
  const text = (value || '').trim().replace(/\/+$/, '');
  const how =
    `Set it to this computer's Wi-Fi address, for example:\n` +
    `  EXPO_PUBLIC_API_URL=${EXAMPLE} npm run phone\n` +
    `  (PowerShell: $env:EXPO_PUBLIC_API_URL="${EXAMPLE}"; npm run phone), or put it in .env.`;
  if (!text) {
    return {
      ok: false,
      message: `EXPO_PUBLIC_API_URL is not set: the app on the phone would call the production api.\n${how}`,
    };
  }
  let url;
  try {
    url = new URL(text);
  } catch {
    url = null;
  }
  if (!url || !/^https?:$/.test(url.protocol)) {
    return {
      ok: false,
      message: `EXPO_PUBLIC_API_URL must be an http(s) address (got "${text}").\n${how}`,
    };
  }
  if (PHONE_CANNOT_REACH.test(url.hostname)) {
    return {
      ok: false,
      message:
        `EXPO_PUBLIC_API_URL points at ${url.hostname}, which a phone cannot reach ` +
        `(on the phone it means the phone itself, or the Android emulator only).\n${how}`,
    };
  }
  return { ok: true, url: text, host: url.hostname };
}

/** A private IPv4 address (the computer on the home network): Metro should advertise the same one. */
function isPrivateIPv4(host) {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

/** The environment for `expo start`: the checked api address, and the LAN host for the exp:// link. */
function phoneEnv(check, env = process.env) {
  const next = { ...env, EXPO_PUBLIC_API_URL: check.url };
  if (!env.REACT_NATIVE_PACKAGER_HOSTNAME && isPrivateIPv4(check.host)) {
    next.REACT_NATIVE_PACKAGER_HOSTNAME = check.host;
  }
  return next;
}

module.exports = { checkPhoneApiUrl, isPrivateIPv4, phoneEnv };

if (require.main === module) {
  const check = checkPhoneApiUrl(configuredApiUrl());
  if (!check.ok) {
    console.error(`npm run phone: ${check.message}`);
    process.exit(1);
  }
  const env = phoneEnv(check);
  console.log(`Expo Go (SDK 58) on your phone. Api: ${check.url}`);
  if (env.REACT_NATIVE_PACKAGER_HOSTNAME)
    console.log(`Metro is advertised on ${env.REACT_NATIVE_PACKAGER_HOSTNAME}:${PORT}.`);
  const extra = process.argv
    .slice(2)
    .filter((arg) => /^[\w=:./-]+$/.test(arg))
    .join(' ');
  const child = spawn(`npx expo start --lan --go --port ${PORT} ${extra}`.trim(), {
    cwd: ROOT,
    env,
    stdio: 'inherit',
    shell: true,
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('exit', (code) => process.exit(code ?? 0));
}
