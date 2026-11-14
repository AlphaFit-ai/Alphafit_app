import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** "Nothing here yet" (as opposed to ErrorState, which means "could not load"). */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'file-tray-outline',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  const { tokens } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.chip, { backgroundColor: tokens.color.surfaceMuted }]}>
        <Ionicons name={icon} size={36} color={tokens.color.textSubtle} />
      </View>
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {message ? (
        <Text tone="muted" style={styles.center}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} fullWidth={false} size="medium" />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 48 },
  chip: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
