import {
  Canvas,
  Circle,
  Group,
  Image as SkiaImage,
  makeImageFromView,
  type SkImage,
} from '@shopify/react-native-skia';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { logError } from '../../services/apiError';
import type { ThemePreference } from '../../services/preferences';
import { useReduceMotion } from './motion';

/**
 * The light/dark switch with a circular reveal (Telegram-style): the screen as it was is captured (a
 * Skia snapshot of the whole app, not of a sheet or dialog above it), the theme changes underneath one
 * frame later, and the old picture is drawn on top with a growing hole centred on the button that was
 * pressed until the new theme covers the screen. ThemeContext stays the source of truth; this only
 * decides how a user's change is shown. (The language has no animation: the owner wants it to switch
 * plainly, see `setLanguage`.)
 *
 * - Reduced motion, no press position, or a change that does not change light/dark: no animation.
 * - The phone's own appearance change (preference "system") never goes through here: it is instant.
 * - A second tap while the circle grows is ignored; the overlay is always removed after the duration.
 * - A snapshot that fails switches the theme at once (logged, never a crash).
 */
export const REVEAL_MS = 450;

export interface Origin {
  x: number;
  y: number;
}

type Snapshot = (ref: React.RefObject<unknown>) => Promise<SkImage | null>;

interface ThemeTransition {
  /** Light to dark or back, revealed from `origin` (the press position on screen). */
  toggleTheme: (origin?: Origin) => void;
  /** A chosen preference (Settings), revealed from `origin` when it changes light/dark. */
  setThemeFrom: (theme: ThemePreference, origin?: Origin) => void;
}

const ThemeTransitionContext = createContext<ThemeTransition | null>(null);

/** The press position of an event, for `toggleTheme` / `setThemeFrom`. */
export function originOf(event: GestureResponderEvent | undefined): Origin | undefined {
  const touch = event?.nativeEvent;
  return touch && Number.isFinite(touch.pageX) && Number.isFinite(touch.pageY)
    ? { x: touch.pageX, y: touch.pageY }
    : undefined;
}

/** Radius that covers the whole screen from `origin`: the distance to the farthest corner. */
export function revealRadius(origin: Origin, width: number, height: number): number {
  const dx = Math.max(origin.x, width - origin.x);
  const dy = Math.max(origin.y, height - origin.y);
  return Math.ceil(Math.hypot(dx, dy));
}

interface Overlay {
  image: SkImage;
  origin: Origin;
  radius: number;
  theme: ThemePreference;
}

export function ThemeTransitionProvider({
  children,
  snapshot = makeImageFromView as unknown as Snapshot,
}: {
  children: React.ReactNode;
  /** Test hook: how the screen is captured. */
  snapshot?: Snapshot;
}) {
  const { setTheme, tokens } = useTheme();
  const dark = tokens.mode === 'dark';
  // What "system" means right now: the phone's own appearance.
  const deviceDark = useColorScheme() === 'dark';
  const reduce = useReduceMotion();
  const { width, height } = useWindowDimensions();
  const root = useRef<React.ComponentRef<typeof View>>(null);
  const busy = useRef(false);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const radius = useSharedValue(0);

  const setThemeFrom = useCallback(
    (theme: ThemePreference, origin?: Origin) => {
      if (busy.current) return; // a second tap while the circle grows
      const darkAfter = theme === 'system' ? deviceDark : theme === 'dark';
      if (reduce || !origin || darkAfter === dark) {
        setTheme(theme);
        return;
      }
      busy.current = true;
      radius.set(0);
      // Through a promise, so a capture that throws at once is handled like one that rejects.
      Promise.resolve()
        .then(() => snapshot(root))
        .catch((error: unknown) => {
          logError('themeTransition.snapshot', error);
          return null;
        })
        .then((image) => {
          if (!image) {
            setTheme(theme);
            busy.current = false;
            return;
          }
          setOverlay({ image, origin, radius: revealRadius(origin, width, height), theme });
        });
    },
    [height, dark, deviceDark, radius, reduce, setTheme, snapshot, width]
  );

  // The old picture is on screen. One frame later (so it is drawn before anything under it changes)
  // the theme is switched underneath and the circle opens. The overlay is removed by a timer, so it can
  // never stay stuck even if a frame is dropped.
  useEffect(() => {
    if (!overlay) return;
    let done: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      setTheme(overlay.theme);
      radius.set(
        withTiming(overlay.radius, { duration: REVEAL_MS, easing: Easing.out(Easing.cubic) })
      );
      done = setTimeout(() => {
        setOverlay(null);
        overlay.image.dispose?.();
        busy.current = false;
      }, REVEAL_MS + 40);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (done) clearTimeout(done);
    };
  }, [overlay, radius, setTheme]);

  const toggleTheme = useCallback(
    (origin?: Origin) => setThemeFrom(dark ? 'light' : 'dark', origin),
    [dark, setThemeFrom]
  );

  return (
    <ThemeTransitionContext.Provider value={{ toggleTheme, setThemeFrom }}>
      <View ref={root} collapsable={false} style={styles.fill}>
        {children}
      </View>
      {overlay ? (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none" testID="theme-reveal">
          {/* The old screen on its own layer, with a hole that grows from the button. */}
          <Group layer>
            <SkiaImage image={overlay.image} x={0} y={0} width={width} height={height} fit="fill" />
            <Circle cx={overlay.origin.x} cy={overlay.origin.y} r={radius} blendMode="clear" />
          </Group>
        </Canvas>
      ) : null}
    </ThemeTransitionContext.Provider>
  );
}

/** The animated theme switch. Outside the provider (a test rendering one screen) it switches at once. */
export function useThemeTransition(): ThemeTransition {
  const context = useContext(ThemeTransitionContext);
  const { setTheme, toggleTheme } = useTheme();
  return (
    context ?? {
      toggleTheme: () => toggleTheme(),
      setThemeFrom: (theme: ThemePreference) => setTheme(theme),
    }
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
