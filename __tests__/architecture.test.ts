import fs from 'fs';
import path from 'path';

/**
 * Rules that broke the app before and are cheap to check by reading the source: they keep a fixed
 * bug from coming back through a later edit.
 */

const ROOT = path.resolve(__dirname, '..');

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(rel, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(rel.replace(/\\/g, '/'));
  }
  return out;
}

const APP_DIRS = ['app', 'components', 'context', 'hooks', 'i18n', 'services', 'src'];
const allFiles = APP_DIRS.flatMap((dir) => sourceFiles(dir));
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

describe('providers', () => {
  const PROVIDERS = ['ThemeProvider', 'OnboardingProvider', 'DietProvider', 'ProjectionProvider'];

  it('are mounted once: only AppProviders renders them, and only the root layout renders AppProviders', () => {
    for (const provider of PROVIDERS) {
      const mounts = allFiles.filter((file) => new RegExp(`<${provider}[\\s>]`).test(read(file)));
      expect(mounts).toEqual(['context/AppProviders.tsx']);
    }
    const appProvidersMounts = allFiles.filter((file) => /<AppProviders[\s>]/.test(read(file)));
    expect(appProvidersMounts).toEqual(['app/_layout.tsx']);
  });

  it('are not mounted by any route file below the root layout', () => {
    const routes = allFiles.filter((file) => file.startsWith('app/') && file !== 'app/_layout.tsx');
    for (const file of routes) {
      expect(read(file)).not.toMatch(/<(Theme|Onboarding|Diet|Projection)Provider/);
    }
  });
});

describe('sign-out', () => {
  it('is one function: no screen calls the Firebase or token clearing itself', () => {
    const outsideSession = allFiles.filter((file) => file !== 'services/session.ts');
    for (const file of outsideSession) {
      const text = read(file);
      expect(text).not.toMatch(/\.signOutProviders\(/); // only services/session.ts may call it
      expect(text).not.toMatch(/firebaseAuthService\.signOut\b/);
    }
  });

  it('is used by the logout button, account deletion, the launch check and the api client (via launch.ts)', () => {
    expect(read('app/(tabs)/profile.tsx')).toMatch(/await signOut\(\)/);
    expect(
      read('app/(tabs)/profile.tsx').match(/await signOut\(\)/g)!.length
    ).toBeGreaterThanOrEqual(2); // logout, delete
    expect(read('app/profile/account-details.tsx')).toMatch(/await signOut\(\)/);
    expect(read('services/launch.ts')).toMatch(/await signOut\(\)/); // the launch check and an unrenewable token
  });

  it('does not use the old token-only logout', () => {
    for (const file of allFiles) {
      expect(read(file)).not.toMatch(
        /userService\.logout|loginWithEmail|registerWithEmail\(email: string, password: string, fullName/
      );
    }
  });
});

describe('console', () => {
  it('is not patched', () => {
    for (const file of allFiles) {
      expect(read(file)).not.toMatch(/console\.(log|warn|error|info)\s*=[^=]/);
    }
  });

  it('is only used by the logger, so an error object (with request headers) is never printed', () => {
    const users = allFiles.filter((file) => /console\.(log|warn|error|info)\(/.test(read(file)));
    expect(users).toEqual(['services/apiError.ts']);
  });
});

describe('translations', () => {
  it('has no English default text inside t() calls (the key exists in every language)', () => {
    for (const file of allFiles) {
      expect({
        file,
        defaults: read(file).match(/\bt\('[\w.]+',\s*['"][^'"]*['"]\)/g) ?? [],
      }).toEqual({
        file,
        defaults: [],
      });
    }
  });

  it('never writes t(key) with a fallback after it, which can not run because t returns the key', () => {
    for (const file of allFiles) {
      expect(read(file)).not.toMatch(/\bt\('[\w.]+'\)\s*\|\|/);
    }
  });

  it('has no literal user-visible English left in the screens that were translated', () => {
    const translated = [
      'app/(tabs)/workouts.tsx',
      'app/profile/faq.tsx',
      'app/profile/help-support.tsx',
      'components/ProPlanModal.tsx',
      'app/chatbot.tsx',
      'app/diet/food-scan.tsx',
      'app/(tabs)/_layout.tsx',
    ];
    for (const file of translated) {
      const text = read(file);
      // Text between tags that is not an expression or a translation call.
      const literalJsxText = text.match(/>\s*[A-Z][a-z]+(?:\s+[a-z]+){1,}[^<{]*</g) ?? [];
      expect({ file, literalJsxText }).toEqual({ file, literalJsxText: [] });
    }
  });
});

describe('route guards', () => {
  it('guard every screen of the app behind the session: nothing reachable by name outside Stack.Protected', () => {
    const root = read('app/_layout.tsx');
    const protectedBlock = root.slice(
      root.indexOf('<Stack.Protected'),
      root.indexOf('</Stack.Protected>')
    );
    for (const name of [
      '(tabs)',
      'diet',
      'projection',
      'history',
      'chatbot',
      'profile',
      'diet/diet-statistics',
    ]) {
      expect(protectedBlock).toContain(`name="${name}"`);
    }
    // Only these two are open to everybody (the second guards its own children).
    const openScreens =
      root.slice(0, root.indexOf('<Stack.Protected')).match(/<Stack\.Screen\s+name="[^"]+"/g) ?? [];
    expect(openScreens.map((m) => m.match(/"([^"]+)"/)![1]).sort()).toEqual([
      'index',
      'onboarding',
    ]);
    expect(root).toContain("guard={session.status === 'ready'}");
  });

  it('split the onboarding folder into signed-out and signed-in screens', () => {
    const layout = read('app/onboarding/_layout.tsx');
    expect(layout).toContain("guard={status === 'signedOut'}");
    expect(layout).toContain("guard={status === 'onboarding' || status === 'ready'}");
    expect(layout).toMatch(/<Stack\.Screen name="index" \/>/); // the fallback: a turned-away user goes back to /
    for (const name of [
      'intro',
      'login',
      'register',
      'source',
      'age',
      'gender',
      'height',
      'fitness-level',
      'activity',
      'workouts',
      'equipment',
      'goal',
    ]) {
      expect(layout).toContain(`name="${name}"`);
    }
  });

  it('have no imperative launch routing left: no splash route, and no screen picks a route from saved answers', () => {
    expect(fs.existsSync(path.join(ROOT, 'app/onboarding/splash.tsx'))).toBe(false);
    for (const file of allFiles.filter((f) => f.startsWith('app/'))) {
      expect(read(file)).not.toMatch(/router\.replace\(\s*result\.route/);
    }
  });
});

describe('server data', () => {
  it('is not held in context state: the contexts read and patch the query cache', () => {
    for (const file of [
      'context/OnboardingContext.tsx',
      'context/DietContext.tsx',
      'context/ProjectionContext.tsx',
    ]) {
      const text = read(file);
      expect(text).toMatch(/useQuery\(/);
      expect(text).not.toMatch(/useState<(UserOnboardingData|DietOnboardingData|ProjectionData)>/);
    }
  });

  it('keeps the api token out of AsyncStorage', () => {
    const text = read('services/tokenStore.ts');
    expect(text).toContain('expo-secure-store');
    expect(text).not.toMatch(/storage\.setItem/);
  });
});

describe('design system', () => {
  // Screens moved onto the tokens and the src/ui primitives. A palette ternary on `isDarkMode` or a
  // hand-rolled Modal inside them means the old pattern crept back in.
  const MIGRATED = [
    'app/(tabs)/home.tsx',
    'app/(tabs)/profile.tsx',
    'app/history.tsx',
    'app/profile/settings.tsx',
    'app/profile/account-details.tsx',
    'app/onboarding/age.tsx',
    'app/onboarding/gender.tsx',
    'app/onboarding/height.tsx',
    'app/onboarding/fitness-level.tsx',
    'app/onboarding/activity.tsx',
    'app/onboarding/workouts.tsx',
    'app/onboarding/equipment.tsx',
    'app/onboarding/goal.tsx',
    'app/onboarding/source.tsx',
  ];

  it('migrated screens read colours from tokens, not from isDarkMode ternaries', () => {
    for (const file of MIGRATED) {
      const text = read(file);
      expect(`${file}: ${/isDarkMode\s*\?/.test(text)}`).toBe(`${file}: false`);
      expect(`${file}: ${/Colors\.gray\[/.test(text)}`).toBe(`${file}: false`);
    }
  });

  it('migrated screens have no hand-rolled Modal and no native Alert pyramid of their own', () => {
    for (const file of MIGRATED) {
      expect(`${file}: ${/<Modal[\s>]/.test(read(file))}`).toBe(`${file}: false`);
    }
  });

  it('src/ui components never branch on isDarkMode: they use the tokens', () => {
    for (const file of sourceFiles('src/ui')) {
      expect(`${file}: ${/isDarkMode/.test(read(file))}`).toBe(`${file}: false`);
    }
  });

  it('there is one WheelPicker: no screen scrolls its own snapping picker', () => {
    for (const file of allFiles.filter((f) => f.startsWith('app/'))) {
      expect(`${file}: ${/snapToInterval/.test(read(file))}`).toBe(`${file}: false`);
    }
  });

  it('no text is white on the coral accent', () => {
    for (const file of allFiles) {
      const text = read(file);
      // a coral background style next to a white foreground in the same style object
      expect(
        `${file}: ${/backgroundColor:\s*Colors\.primary[^}]*color:\s*Colors\.white/s.test(text)}`
      ).toBe(`${file}: false`);
    }
  });
});

describe('accessibility', () => {
  it('every touchable in app/ and components/ declares an accessibilityRole', () => {
    const opening =
      /<(TouchableOpacity|Pressable|TouchableWithoutFeedback)\b[\s\S]*?(?<![=])>(?=\s*[\n<{])/g;
    const missing: string[] = [];
    for (const file of allFiles.filter(
      (f) => /^(app|components)\//.test(f) && f.endsWith('.tsx')
    )) {
      const text = read(file);
      for (const match of text.matchAll(opening)) {
        if (!/accessibilityRole/.test(match[0])) {
          const line = text.slice(0, match.index).split('\n').length;
          missing.push(`${file}:${line}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('design system, every screen', () => {
  const SCREEN_FILES = allFiles.filter((f) => /^(app|components)\//.test(f) && f.endsWith('.tsx'));

  it('no screen or component branches a palette on isDarkMode', () => {
    const offenders = SCREEN_FILES.filter((f) => /isDarkMode/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('no hand-rolled Modal and no native Alert.alert outside src/ui: Dialog, Sheet, Toast or FullScreen', () => {
    const offenders = SCREEN_FILES.filter((f) => /<Modal[\s>]|Alert\.alert\(/.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it('no screen draws a plain react-native Image: images are AppImage (expo-image)', () => {
    const offenders = SCREEN_FILES.filter((f) =>
      /import\s*\{[^}]*\bImage\b[^}]*\}\s*from 'react-native'/.test(read(f))
    );
    expect(offenders).toEqual([]);
  });

  it('wizard questions come from the config: the route files only render a step', () => {
    for (const file of [
      'app/diet/diet-preference.tsx',
      'app/diet/allergies.tsx',
      'app/diet/meals.tsx',
      'app/diet/supplements.tsx',
      'app/projection/sleep.tsx',
      'app/projection/steps.tsx',
      'app/projection/stress.tsx',
    ]) {
      expect(read(file)).toMatch(/renderStep\('/);
      expect(read(file).split('\n').length).toBeLessThan(12);
    }
  });
});

describe('dev-only browser preview (docs/CONTRACTS.md section 8)', () => {
  const GUARD =
    /process\.env\.EXPO_PUBLIC_PREVIEW === '1'\s*\?\s*(?:\/\/[^\n]*\n\s*)?require\('(?:\.\.\/)+src\/preview'\)\s*:\s*null/;

  it('loads src/preview only behind the build flag, so an app build drops it', () => {
    const users = allFiles.filter(
      (file) => !file.startsWith('src/preview/') && /src\/preview/.test(read(file))
    );
    expect(users.sort()).toEqual([
      'app/_layout.tsx',
      'app/dev-sign-in.tsx',
      'app/diet/food-scan.tsx',
    ]);
    for (const file of users) {
      const text = read(file);
      expect(`${file}: ${GUARD.test(text)}`).toBe(`${file}: true`);
      // no static import of the folder anywhere
      expect(`${file}: ${/import[^;]*from '(?:\.\.\/)+src\/preview/.test(text)}`).toBe(
        `${file}: false`
      );
    }
  });

  it('opens the /dev-sign-in screen only in a preview build', () => {
    const root = read('app/_layout.tsx');
    expect(root).toMatch(
      /<Stack\.Protected guard=\{process\.env\.EXPO_PUBLIC_PREVIEW === '1'\}>\s*<Stack\.Screen name="dev-sign-in"/
    );
  });

  it('never imports the preview stubs from app code', () => {
    for (const file of allFiles) {
      // a mention in a comment is fine; an import or require is not
      const imports = /(?:from|require\()\s*'[^']*tools\/preview/.test(read(file));
      expect(`${file}: ${imports}`).toBe(`${file}: false`);
    }
  });
});
