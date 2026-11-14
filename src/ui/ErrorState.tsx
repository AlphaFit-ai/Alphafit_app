import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ApiErrorKind } from '../../services/apiError';
import { Button } from './Button';
import { Text } from './Text';

export interface ErrorStateProps {
  /** What went wrong, so the message can say "offline" or "timed out". */
  kind?: ApiErrorKind;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** True while a retry is running. */
  retrying?: boolean;
  style?: ViewStyle;
}

function messageKey(kind: ApiErrorKind | undefined): string {
  switch (kind) {
    case 'offline':
      return 'errors.offline';
    case 'timeout':
      return 'errors.timeout';
    case 'http':
      return 'errors.server';
    default:
      return 'errors.unknown';
  }
}

/**
 * Shown where data could not be loaded: says what happened in plain words and offers a retry.
 * Used instead of an empty screen, so a failed request is never mistaken for "no data".
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  kind,
  title,
  message,
  onRetry,
  retryLabel,
  retrying = false,
  style,
}) => {
  const { t } = useTranslation();
  const { tokens } = useTheme();

  return (
    <View style={[styles.container, style]} accessibilityRole="alert">
      <Ionicons
        name={kind === 'offline' ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={56}
        color={tokens.color.textSubtle}
      />
      <Text variant="heading" style={styles.center}>
        {title ?? t('errors.title')}
      </Text>
      <Text tone="muted" style={styles.center}>
        {message ?? t(messageKey(kind))}
      </Text>
      {onRetry ? (
        <Button
          variant="accent"
          size="medium"
          fullWidth={false}
          title={retryLabel ?? t('common.retry')}
          onPress={onRetry}
          loading={retrying}
          style={styles.retry}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  center: { textAlign: 'center' },
  retry: { minWidth: 160, marginTop: 12 },
});
