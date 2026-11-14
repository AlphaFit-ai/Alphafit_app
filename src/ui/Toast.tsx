import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { haptic } from './haptics';
import { useReduceMotion } from './motion';
import { Text } from './Text';

export type ToastTone = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const TOAST_DURATION_MS = 3500;

/** Short, non-blocking messages ("Saved", "Could not save"). One at a time; announced to screen readers. */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    counter.current += 1;
    setToast({ id: counter.current, message, tone });
    if (tone === 'success') haptic.confirm();
    if (tone === 'error') haptic.error();
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const api = useMemo(() => ({ show }), [show]);
  const c = tokens.color;
  const bg =
    toast?.tone === 'error' ? c.dangerSoft : toast?.tone === 'success' ? c.successSoft : c.surface;
  const tone =
    toast?.tone === 'error' ? 'danger' : toast?.tone === 'success' ? 'success' : 'default';

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
          <Animated.View
            key={toast.id}
            entering={reduce ? undefined : FadeInUp.duration(180)}
            exiting={reduce ? undefined : FadeOut.duration(150)}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              tokens.elevation.raised,
              { backgroundColor: bg, borderColor: c.border, borderRadius: tokens.radius.lg },
            ]}
          >
            <Text variant="label" tone={tone}>
              {toast.message}
            </Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used within a ToastProvider');
  return api;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  toast: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, maxWidth: 420 },
});
