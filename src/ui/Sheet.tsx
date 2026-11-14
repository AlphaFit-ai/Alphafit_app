import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useReduceMotion } from './motion';
import { Text } from './Text';

/** How long the sheet takes to leave (fade and slide down) before it is gone. */
export const SHEET_EXIT_MS = 180;

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  /**
   * Called once the sheet has left the screen (after its exit animation). A choice made in the sheet
   * that changes the screen behind it (the language) is applied here, so the sheet is not on top while
   * everything under it changes.
   */
  onClosed?: () => void;
  title?: string;
  /** Accessible name of the close button. */
  closeLabel: string;
  children: React.ReactNode;
}

/**
 * A bottom sheet for pickers and filters: dims the screen, slides up, closes on backdrop or back. It
 * leaves with a short fade and slide (none with reduced motion) instead of vanishing.
 */
export const Sheet: React.FC<SheetProps> = ({
  visible,
  onClose,
  onClosed,
  title,
  closeLabel,
  children,
}) => {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  // The modal stays up while the sheet animates out.
  const [shown, setShown] = useState(visible);
  if (visible && !shown) setShown(true);
  const leaving = useSharedValue(0);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  }, [onClosed]);

  useEffect(() => {
    if (visible) {
      leaving.set(0);
      return;
    }
    if (!shown) return;
    const duration = reduce ? 0 : SHEET_EXIT_MS;
    if (duration) leaving.set(withTiming(1, { duration, easing: Easing.in(Easing.quad) }));
    const done = setTimeout(() => {
      setShown(false);
      onClosedRef.current?.();
    }, duration);
    return () => clearTimeout(done);
  }, [visible, shown, reduce, leaving]);

  const fadeOut = useAnimatedStyle(() => ({ opacity: 1 - leaving.get() }));
  const slideOut = useAnimatedStyle(() => ({
    opacity: 1 - leaving.get(),
    transform: [{ translateY: leaving.get() * 48 }],
  }));

  return (
    <Modal
      visible={shown}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, fadeOut]}>
          <Animated.View
            entering={reduce ? undefined : FadeIn.duration(150)}
            style={[StyleSheet.absoluteFill, { backgroundColor: tokens.color.scrim }]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
            />
          </Animated.View>
        </Animated.View>
        <Animated.View pointerEvents="box-none" style={[styles.panelHost, slideOut]}>
          <Animated.View
            entering={reduce ? undefined : SlideInDown.duration(240)}
            accessibilityViewIsModal
            style={[
              styles.panel,
              tokens.elevation.modal,
              {
                backgroundColor: tokens.color.surface,
                borderTopLeftRadius: tokens.radius.xl,
                borderTopRightRadius: tokens.radius.xl,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: tokens.color.border }]} />
            <View style={styles.header}>
              <Text variant="heading" accessibilityRole="header" style={styles.title}>
                {title ?? ''}
              </Text>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={closeLabel}
                style={styles.close}
              >
                <Ionicons name="close" size={24} color={tokens.color.text} />
              </Pressable>
            </View>
            {children}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  panelHost: { flex: 1, justifyContent: 'flex-end' },
  panel: { maxHeight: '85%', paddingHorizontal: 20, paddingTop: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  title: { flex: 1 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
