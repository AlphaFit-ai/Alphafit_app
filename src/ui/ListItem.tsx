import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PressableScale } from './Pressable';
import { Text } from './Text';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  /** Ionicons name shown in a round chip on the left. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** A node on the right before the chevron (a badge, a value). */
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** Hide the chevron on a pressable row. */
  noChevron?: boolean;
  destructive?: boolean;
  accessibilityHint?: string;
}

/** A settings or menu row: icon chip, title, subtitle, trailing content, chevron. At least 44 pt tall. */
export const ListItem = React.memo(function ListItem({
  title,
  subtitle,
  icon,
  trailing,
  onPress,
  noChevron,
  destructive,
  accessibilityHint,
}: ListItemProps) {
  const { tokens } = useTheme();
  const c = tokens.color;
  const body = (
    <>
      {icon ? (
        <View style={[styles.chip, { backgroundColor: c.surfaceMuted }]}>
          <Ionicons name={icon} size={22} color={destructive ? c.dangerText : c.text} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="bodyStrong" tone={destructive ? 'danger' : 'default'}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress && !noChevron ? (
        <Ionicons name="chevron-forward" size={20} color={c.textSubtle} />
      ) : null}
    </>
  );
  const rowStyle = [styles.row, { borderBottomColor: c.border }];
  if (!onPress) return <View style={rowStyle}>{body}</View>;
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.99}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      style={rowStyle}
    >
      {body}
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chip: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
});
