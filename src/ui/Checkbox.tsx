import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PressableScale } from './Pressable';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The label text or node; also read as the accessible name when it is a string. */
  children: React.ReactNode;
  accessibilityLabel?: string;
}

/** A checkbox with its label; the whole row is the 44 pt target. */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  children,
  accessibilityLabel,
}) => {
  const { tokens } = useTheme();
  return (
    <PressableScale
      onPress={() => onChange(!checked)}
      feedback
      pressedScale={0.99}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? tokens.color.action : tokens.color.borderStrong,
            backgroundColor: checked ? tokens.color.action : 'transparent',
          },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={tokens.color.onAction} /> : null}
      </View>
      <View style={styles.label}>{children}</View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingVertical: 4 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
