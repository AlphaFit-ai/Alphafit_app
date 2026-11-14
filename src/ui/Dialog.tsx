import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';
import { haptic } from './haptics';
import { useReduceMotion } from './motion';
import { Text } from './Text';

export interface DialogAction {
  label: string;
  onPress?: () => void;
  /** `cancel` is the quiet one, `destructive` is red, `default` is the filled primary. */
  tone?: 'default' | 'cancel' | 'destructive';
  /** Do not close the dialog when pressed (a form that validates first). */
  keepOpen?: boolean;
  /** Shows a spinner and ignores presses. */
  loading?: boolean;
}

export interface DialogProps {
  visible: boolean;
  title: string;
  message?: string;
  /** Defaults to a single OK. Every action closes the dialog after its `onPress` runs. */
  actions?: DialogAction[];
  onClose: () => void;
  /** Tapping the backdrop or Android back closes it (default true). */
  dismissable?: boolean;
  /** Extra content under the message. */
  children?: React.ReactNode;
  /** Haptic on open: `error` for a failure, `confirm` for success. */
  feedback?: 'error' | 'confirm';
}

/**
 * One dialog for confirmations and messages. Replaces the hand-rolled alert modals: same look
 * everywhere, token colours, 44 pt buttons, screen readers treat it as modal.
 */
export const Dialog: React.FC<DialogProps> = ({
  visible,
  title,
  message,
  actions,
  onClose,
  dismissable = true,
  children,
  feedback,
}) => {
  const { tokens } = useTheme();
  const reduce = useReduceMotion();
  const { t } = useTranslation();
  const buttons = actions ?? [{ label: t('common.ok') }];

  React.useEffect(() => {
    if (!visible) return;
    if (feedback === 'error') haptic.error();
    if (feedback === 'confirm') haptic.confirm();
  }, [visible, feedback]);

  const run = (action: DialogAction) => {
    if (!action.keepOpen) onClose();
    action.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissable ? onClose : undefined}
      statusBarTranslucent
    >
      <Animated.View
        entering={reduce ? undefined : FadeIn.duration(150)}
        style={[styles.backdrop, { backgroundColor: tokens.color.scrim }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissable ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          accessible={dismissable}
          importantForAccessibility={dismissable ? 'yes' : 'no'}
        />
        <KeyboardAvoidingView behavior="padding" style={styles.avoid} pointerEvents="box-none">
          <Animated.View
            entering={reduce ? undefined : ZoomIn.duration(180)}
            accessibilityViewIsModal
            style={[
              styles.card,
              tokens.elevation.modal,
              {
                backgroundColor: tokens.color.surface,
                borderRadius: tokens.radius.xl,
                borderColor: tokens.color.border,
              },
            ]}
          >
            <Text variant="heading" accessibilityRole="header" style={styles.center}>
              {title}
            </Text>
            {message ? (
              <Text tone="muted" style={styles.center}>
                {message}
              </Text>
            ) : null}
            {children}
            <View style={styles.actions}>
              {buttons.map((action, index) => (
                <Button
                  key={`${action.label}-${index}`}
                  title={action.label}
                  size="medium"
                  variant={
                    action.tone === 'destructive'
                      ? 'danger'
                      : action.tone === 'cancel'
                        ? 'secondary'
                        : 'primary'
                  }
                  loading={action.loading}
                  onPress={() => run(action)}
                />
              ))}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  avoid: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 340, padding: 24, gap: 12, borderWidth: 1 },
  center: { textAlign: 'center' },
  actions: { gap: 8, marginTop: 8 },
});
