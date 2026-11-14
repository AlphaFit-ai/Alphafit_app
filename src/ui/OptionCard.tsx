import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export interface OptionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

/** A single-choice answer in the wizards. Selected = action-colour fill, so it reads without colour. */
export const OptionCard: React.FC<OptionCardProps> = ({
  title,
  subtitle,
  icon,
  selected = false,
  onPress,
  style,
}) => {
  const { tokens } = useTheme();
  const c = tokens.color;
  return (
    <PressableScale
      onPress={onPress}
      feedback
      accessibilityRole="radio"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={{ selected, checked: selected }}
      style={[
        styles.container,
        {
          backgroundColor: selected ? c.action : c.surfaceMuted,
          borderColor: selected ? c.action : 'transparent',
          borderRadius: tokens.radius.md,
        },
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.text}>
        <Text variant="bodyStrong" style={{ color: selected ? c.onAction : c.text }}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" style={{ color: selected ? c.onAction : c.textMuted }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    minHeight: 56,
    borderWidth: 2,
  },
  icon: { marginRight: 12 },
  text: { flex: 1 },
});
