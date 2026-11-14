# AlphaFit AI - mobile app

The AlphaFit iOS and Android app: onboarding, AI food scan (photo and barcode), diet questions, workouts, physique projection questions, and an AI coach chat. It is an Expo (React Native) app written in TypeScript.

It talks to the AlphaFit api (`Alphafit_Backend`) and signs users in with Firebase (Google, Apple on iOS, email). The routes the app calls are listed in `docs/CONTRACTS.md` of the workspace; the plan for the app is in `docs/ROADMAP.md` (work packages `WP-MOB-*`).

## What you need

| Tool | Version |
|---|---|
| Node.js | 24 (LTS). The CI pipeline uses the same version. |
| npm | the one that ships with Node (the lock file is `package-lock.json`) |
| A development build | Firebase and Google sign-in are native code and do **not** run in Expo Go |
| EAS CLI | to make development, preview and production builds (`npm i -g eas-cli`, then `eas login`) |

You cannot run the app in a browser: there is no web build.

## First run

```bash
npm ci                      # exact versions from package-lock.json
cp .env.example .env        # optional, see "Configuration"
npm run build:dev:android   # once: a development build with EAS (or build:dev:ios)
npm run start:dev-client    # then start Metro and open the development build on the phone
```

`npm start` starts Metro for Expo Go, which cannot run this app because of its native modules (Firebase, Google sign-in, camera); always use the development build.

## Configuration

All configuration is read in `app.config.ts` (it replaces `app.json`) and reaches the code through `config.ts`.

| Variable | Default | Meaning |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api.alphafit-ai.com` | Address of the api, with or without a trailing slash. Must start with `http://` or `https://`; anything else stops the build with a clear message. |

- For local development copy `.env.example` to `.env` (ignored by git). To use the local stack in `Alphafit-manifests/compose` (api on port 8180): `http://10.0.2.2:8180` from the Android emulator, `http://localhost:8180` from the iOS simulator, `http://<your computer's LAN address>:8180` from a phone.
- For a build on EAS, set the variable under `env` of the profile in `eas.json`, or in the EAS dashboard. A profile that does not set it uses the production api, so the existing profiles keep working.
- Changing it needs a restart of Metro (`npm run start:dev-client`) or a new build; it is read when the app is configured, not while it runs.
- The Firebase web configuration and the Google OAuth client ids in `app.config.ts` are public identifiers that ship inside every build; they are not secrets. `google-services.json` and `GoogleService-Info.plist` are the Firebase files for Android and iOS. Never put a password, a private key or a service account here.

## Scripts

| Command | What it does |
|---|---|
| `npm run typecheck` | `tsc --noEmit` (TypeScript, strict) |
| `npm run lint` | ESLint over the whole repository; **any warning fails** |
| `npm test` | Jest with `jest-expo` and Testing Library; includes the translation audit |
| `npm run test:ci` | the same, without watch mode |
| `npm run format:check` | Prettier, on the files this branch changed (see "Formatting") |
| `npm run format` | formats those files |
| `npm run i18n:check` | translation audit on its own (same code the test runs) |
| `npm run check` | typecheck, lint and tests, as the pull request pipeline does |
| `npm run preview:build` / `preview:shots` / `preview:flows` | dev-only browser preview: screenshots and navigation checks (see "Visual preview") |
| `npm run start:dev-client` | Metro for a development build |
| `npm run build:dev:android` / `build:dev:ios` | development build with EAS |
| `npm run build:preview:android` / `build:preview:ios` | preview (internal) build with EAS |

Before opening a pull request run `npm run check` and `npm run format:check`. To prove the JavaScript bundle builds, run `npx expo export --platform android --output-dir <a folder outside the repository>` and delete the folder afterwards.

## How the code is laid out

```
app/             expo-router routes. Keep route files thin.
  _layout.tsx      root: fonts, saved language and theme, error boundary, the one set of providers
  index.tsx        redirects to the launch screen
  onboarding/      splash (launch check), intro, login, register, and the nine question screens
  (tabs)/          home, workouts, projections, diet, profile
  diet/ projection/ profile/   wizards and settings screens
components/      shared UI: Button, Input, Alert, ErrorState, ErrorBoundary, ProPlanModal ...
constants/       Colors, Fonts, Spacing, SharedStyles
context/         UI state only: Theme, Onboarding, Diet, Projection, and AppProviders
hooks/           useProfilePicture, useApplyServerPreferences, useProjectionPrefill ...
i18n/            i18next setup (config.ts) and the three languages in locales/
services/        api client and everything that talks to the api or to Firebase
scripts/         check-i18n.js, format-changed.js
__tests__/       Jest tests
```

Key modules in `services/`:

| File | Role |
|---|---|
| `apiClient.ts` | axios instance: base URL, `Authorization` header, forgets the token on 401 |
| `apiError.ts` | `normalizeApiError` (offline, timeout, http), and a logger that never prints headers or tokens |
| `session.ts` | the one `signOut()` and the registry the stores use to reset themselves |
| `bootstrap.ts` | the launch check (`bootstrapSession`) and `completeSignIn` |
| `onboardingResume.ts` | where a signed-in user continues; the only place that decides it |
| `preferences.ts` | saved language and theme (device first, server only when the user changes them) |
| `firebaseAuthService.ts` | Firebase and Google sign-in; keeps `error.code` |
| `tokenStore.ts`, `storage.ts` | the api token on the device |

## Design system

Semantic tokens (`src/theme/tokens.ts`: colour, spacing, radius, type scale, elevation) for light and dark come from the
brand palette in `constants/Colors.ts` (dark navy, coral `#FF6B4A`). Every text and background pair that carries text is
checked for WCAG AA (4.5:1) in both themes by `npm test`; text on the coral accent is dark navy, never white. Screens read
`useTheme().tokens`; the older `colors` object stays for screens not moved yet. The theme preference is `system`, `light`
or `dark` (Settings); `system` follows the phone and is never sent to the server.

The primitives are in `src/ui`: `Screen` (safe areas, keyboard handling with `react-native-keyboard-controller`),
`Text`, `Button`, `Input`, `OptionCard`, `ListItem`, `Dialog`, `Sheet`, `Toast`, `WheelPicker` (one virtualised
picker), `Skeleton`, `EmptyState`, `ErrorState`, `WizardStep`, `StepTransition`, `AppImage` (expo-image) and helpers for
haptics and reduced motion. `react-native-keyboard-controller` is a native module: build a new development client before
running on a device.

## Feature flags

`constants/Features.ts` holds switches for work that is built but not offered. `projections` (default `false`,
ROADMAP decision D2) hides the Projections tab, the mock physique scores on the intro, and the FAQ and Pro plan
lines about the physique analysis. The code stays (`app/(tabs)/projections.tsx`, `app/projection/*`); set it to
`true` to bring it back.

## Visual preview (dev only)

There is no emulator on a development computer without the Android SDK, so the screens can also be
rendered in a browser with `react-native-web`, to look at layout, spacing, colours, text and
translations in light and dark at phone sizes. It is a tool for developers; it is not part of any build.

```bash
npm run preview:build           # web export into .preview/dist (git-ignored)
npm run preview:shots           # 390x844 and 360x740, light and dark -> .preview/shots/*.png
npm run preview:shots -- --states --routes=/home,/profile --themes=dark   # error states; a subset
npm run preview:flows           # navigation, session and scan-edit flows (PATCH 200, 409, 404) against the mock api
```

How it works: `EXPO_PUBLIC_PREVIEW=1` makes `metro.config.js` replace the native-only modules (Google and
Apple sign-in, camera, secure-store, haptics, and Firebase auth) with stubs from `tools/preview/stubs/`,
for the web platform only; nothing changes for Android or iOS builds (a test checks it). `tools/preview/mock-api.js`
is a small mock of the api with realistic data and a switch (`POST /__mode {"fail":"offline"|"500"|"401"}`)
that makes it fail, so the error states can be photographed. A signed-in session is seeded through
`localStorage` before the page loads. The web libraries and `playwright-core` are dev dependencies; it uses the
Chrome installed on the machine.

What it cannot show: native fonts and shadows (the web renders its own), the keyboard and keyboard avoiding,
safe areas and the notch, status and navigation bars, the camera and barcode scanner, haptics, gestures,
the Android back button, push of real Firebase or Google sign-in, and real performance. The gradient logo text
(`MaskedView`) renders without its gradient in the browser. Treat it as a layout check, not a device check.

## Rules the code follows

- **Server data lives in the query cache** (TanStack Query, saved on the device, paused offline), not in React state. Screens read it with the hooks in `hooks/queries.ts`; the contexts only read and patch the cache and keep wizard steps. `signOut()` empties the cache and its saved copy.
- **The api client types every failure** (`ApiError`: `offline`, `timeout`, `http`, `cancelled`) and, on a 401, renews the token once from the Firebase session (single-flight) and repeats the request; if that fails it signs the user out. A 403 is a wrong role and signs nobody out. The token is in `expo-secure-store`.
- **Routes are guarded by the session** (`services/sessionStore.ts`: loading, signedOut, onboarding, ready) with `Stack.Protected` in `app/_layout.tsx` and `app/onboarding/_layout.tsx`. To go somewhere after a sign-in or sign-out, change the session store and `router.replace('/')`; `app/index.tsx` sends the user to the right screen.
- **A failed request is an error, never "no data".** The launch check, the diet and projection tabs, Home, the profile and the history show a retry (`ErrorState`) when a request fails; they do not start the wizard again or show empty numbers.
- **One sign-out.** Logout, account deletion and an expired session all call `signOut()` from `services/session.ts`. It clears the token, the onboarding, diet, projection and theme stores, the cached profile picture, and the Firebase and Google sessions. Do not sign out anywhere else.
- **Providers are mounted once**, in `context/AppProviders.tsx`, from `app/_layout.tsx`. A second provider in a nested layout would hide the data from screens outside it.
- **Language and theme are read from the phone at start-up** (no request) and sent to the account only when the user changes them. Change the language with `setLanguage()` from `i18n/config.ts`, never with `i18n.changeLanguage`.
- **No literal user-visible text in screens.** Use `t('key')`. English, French and Spanish keep exactly the same keys; `npm test` fails if a key used in the code is missing, or if the three files differ.
- **No `console` patching and no logging of tokens, e-mails or request objects.** Use `logError(context, error)`.

## Translations

The three files are `i18n/locales/{en,fr,es}.json`. When you add a key, add it to all three in the same change, with a real translation (English text copied into French or Spanish is flagged by the test). `npm run i18n:check` lists missing keys, parity problems and keys that nothing uses. A key built at run time (`` t(`faq.items.${id}.question`) ``) is recognised by its fixed prefix; keys kept in a lookup table (`titleKey: 'home.title'`) are recognised as strings.

## Formatting

Prettier is configured (`.prettierrc.json`) but is **not** applied to the whole repository at once, so a formatting pass never hides a real change. `npm run format:check` checks only the files that differ from the base branch (`origin/main`, or `FORMAT_BASE`), `npm run format` fixes them. A file is formatted the first time a branch edits it.

## Continuous integration

`Jenkinsfile` runs on every pull request in a pinned Node container: `npm ci`, typecheck, lint, tests, the format check on changed files, and a bundle check (`expo export` to a temporary folder). There is no image build and no deployment, because the app is not a service: builds for testers and for the stores are made with EAS.

## Releasing

Builds are made with EAS from the profiles in `eas.json` (`development`, `preview`, `production`). `production` builds an Android app bundle and an iOS archive for the stores. Run builds only when the owner asks for one.

## Troubleshooting

- *The app sits on the launch screen, then shows "We can't reach AlphaFit".* The app could not reach the api. Check `EXPO_PUBLIC_API_URL` and that the phone can open that address in its browser.
- *Google sign-in does nothing or fails with a developer error.* Use a development build (not Expo Go) built from this repository, and check that the SHA-1 of the signing key is registered in the Firebase console.
- *`npm run lint` fails on a warning.* Warnings are errors here. Fix them; do not add `eslint-disable` without a reason in a comment.
- *A test fails with a missing translation key.* Run `npm run i18n:check`; it names the key and the file that uses it.
