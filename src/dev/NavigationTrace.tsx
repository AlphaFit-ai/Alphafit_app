import { usePathname, useRootNavigationState, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Dimensions, PixelRatio, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import i18n from '../../i18n/config';
import { sessionStore } from '../../services/sessionStore';

/**
 * DEV ONLY. A navigation trace in the Metro log, to see on a real phone what back does: every route
 * change (path and the depth of each navigator on the way to it), every hardware back press that
 * reaches JavaScript, every change of the session status (a status that leaves "ready" closes the
 * guarded screens), every language and light/dark change, and the screen geometry at start and on each
 * change (`layout` line: safe-area insets, StatusBar.currentHeight, window and screen heights, pixel
 * ratio), which tells whether the host draws the app under the status bar (window height equal to the
 * screen height, insets.top > 0) or below an opaque bar (window shorter, insets.top 0). The session line carries the trace's
 * instance number: a new number means the root of the app was mounted again (its state lost); the
 * same number means only effects ran again (Fast Refresh). app/_layout.tsx loads this file only when `__DEV__` is true, so a release bundle
 * does not contain it (scripts/check-bundle.js looks for its tag).
 *
 * Read in Metro as lines starting with `[alphafit-trace]`.
 */
const TAG = '[alphafit-trace]';
let instances = 0;

function trace(...parts: unknown[]) {
  console.log(TAG, ...parts);
}

interface NavState {
  type?: string;
  index?: number;
  routes: { name: string; state?: NavState }[];
  history?: unknown[];
}

/** "stack 2 > tab (tabs) 3 > ..." : for each navigator on the focused path, its kind and depth. */
function describeDepth(state: NavState | undefined): string {
  const levels: string[] = [];
  let current = state;
  while (current && current.routes?.length) {
    const index = current.index ?? current.routes.length - 1;
    const route = current.routes[index];
    const depth = current.type === 'tab' ? (current.history?.length ?? 1) : current.routes.length;
    levels.push(`${current.type ?? '?'}:${route?.name}(${depth})`);
    current = route?.state;
  }
  return levels.join(' > ');
}

export function NavigationTrace() {
  const pathname = usePathname();
  const navState = useRootNavigationState() as unknown as NavState | undefined;
  const pathRef = useRef(pathname);
  const [instance] = useState(() => ++instances);
  const { tokens } = useTheme();
  const mode = tokens.mode;
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();

  useEffect(() => {
    const screen = Dimensions.get('screen');
    trace(
      'layout',
      `insets top ${insets.top} bottom ${insets.bottom}`,
      `| StatusBar.currentHeight ${StatusBar.currentHeight ?? 'n/a'}`,
      `| window ${window.width}x${window.height} screen ${screen.width}x${screen.height}`,
      `| pixelRatio ${PixelRatio.get()}`
    );
  }, [insets.top, insets.bottom, window.width, window.height]);

  useEffect(() => {
    pathRef.current = pathname;
    trace('route', pathname, '|', describeDepth(navState));
  }, [pathname, navState]);

  // Added again on every route change, so it is the newest listener and runs first. It only logs and
  // returns false: the app's own handling goes on as without it.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      trace('back pressed on', pathRef.current, '| canGoBack', router.canGoBack());
      return false;
    });
    return () => subscription.remove();
  }, [pathname]);

  useEffect(() => {
    let previous = sessionStore.getState().status;
    trace('session', previous, '| root instance', instance);
    return sessionStore.subscribe(() => {
      const next = sessionStore.getState().status;
      if (next !== previous) trace('session', previous, '->', next);
      previous = next;
    });
  }, [instance]);

  useEffect(() => {
    const onLanguage = (language: string) => trace('language', language);
    i18n.on('languageChanged', onLanguage);
    return () => i18n.off('languageChanged', onLanguage);
  }, []);

  const firstMode = useRef(true);
  useEffect(() => {
    if (firstMode.current) {
      firstMode.current = false;
      return;
    }
    trace('theme', mode);
  }, [mode]);

  return null;
}
