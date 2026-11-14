import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export type ButtonVariant =
  'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dangerOutline';

export interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  floating?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  /** Accessibility hint, read after the label. */
  hint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const HEIGHT = { small: 44, medium: 48, large: 56 } as const;

/**
 * The app's button. `primary` is the black (light) or white (dark) pill; `accent` is coral with dark
 * text (white on coral fails WCAG AA, so no variant uses it). The label is the accessible name.
 */
export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  fullWidth = true,
  floating = false,
  icon,
  iconPosition = 'right',
  hint,
  style,
  textStyle,
}) => {
  const { tokens } = useTheme();
  const c = tokens.color;
  const inactive = disabled || loading;

  const palette = (() => {
    if (inactive && (variant === 'primary' || variant === 'accent' || variant === 'danger')) {
      return { bg: c.disabled, fg: c.onDisabled, border: 'transparent' };
    }
    switch (variant) {
      case 'accent':
        return { bg: c.accent, fg: c.onAccent, border: 'transparent' };
      case 'secondary':
        return { bg: c.surfaceMuted, fg: c.text, border: 'transparent' };
      case 'outline':
        return { bg: 'transparent', fg: c.text, border: c.borderStrong };
      case 'ghost':
        return { bg: 'transparent', fg: c.text, border: 'transparent' };
      case 'dangerOutline':
        return { bg: 'transparent', fg: c.dangerText, border: c.danger };
      case 'danger':
        return { bg: c.danger, fg: '#111827', border: 'transparent' };
      default:
        return { bg: c.action, fg: c.onAction, border: 'transparent' };
    }
  })();

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      feedback={variant !== 'ghost'}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          minHeight: HEIGHT[size],
          borderRadius: tokens.radius.pill,
          paddingHorizontal: size === 'small' ? tokens.spacing.lg : tokens.spacing.xl,
        },
        fullWidth && styles.fullWidth,
        floating && styles.floating,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={20} color={palette.fg} style={styles.iconLeft} />
          )}
          <Text variant="bodyStrong" style={[{ color: palette.fg }, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={20} color={palette.fg} style={styles.iconRight} />
          )}
        </View>
      )}
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  button: { justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  fullWidth: { alignSelf: 'stretch' },
  floating: { position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 10 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});
