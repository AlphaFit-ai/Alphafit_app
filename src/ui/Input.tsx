import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/** Text field with a label above it, a visible focus outline, and an error line that is announced. */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  leftIcon,
  rightIcon,
  accessibilityLabel,
  onFocus,
  onBlur,
  ...props
}) => {
  const { tokens } = useTheme();
  const c = tokens.color;
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={styles.container}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            backgroundColor: c.surfaceMuted,
            borderRadius: tokens.radius.md,
            borderColor: error ? c.danger : focused ? c.text : 'transparent',
          },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={c.textSubtle}
          maxFontSizeMultiplier={1.5}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: c.text }, style]}
        />
        {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', marginVertical: 8 },
  label: { marginBottom: 4 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 16, fontFamily: Fonts.regular, minHeight: 44, paddingVertical: 8 },
  icon: { justifyContent: 'center', alignItems: 'center', marginHorizontal: 4 },
  error: { marginTop: 4 },
});
