import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useReduceMotion } from './motion';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Accessible name of the close button. */
  closeLabel: string;
  children: React.ReactNode;
}

/** A bottom sheet for pickers and filters: dims the screen, slides up, closes on backdrop or back. */
export const Sheet: React.FC<SheetProps> = ({ visible, onClose, title, closeLabel, children }) => {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        entering={reduce ? undefined : FadeIn.duration(150)}
        style={[styles.backdrop, { backgroundColor: tokens.color.scrim }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        />
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  panel: { maxHeight: '85%', paddingHorizontal: 20, paddingTop: 8 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  title: { flex: 1 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
