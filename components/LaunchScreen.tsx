import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ApiErrorKind } from '../services/apiError';
import { ErrorState } from './ErrorState';
import { BrandLogo } from '../src/ui/BrandLogo';

interface LaunchScreenProps {
  /** Set when the launch check failed: shows a retry instead of the logo. */
  error: ApiErrorKind | null;
  onRetry: () => void;
}

/**
 * Shown by the root layout while the launch check runs, and when it fails. A failed check is never
 * treated as "new user": the user sees why and can try again, and nothing is changed.
 */
export function LaunchScreen({ error, onRetry }: LaunchScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState kind={error} title={t('bootstrap.retryTitle')} onRetry={onRetry} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
        <BrandLogo variant="symbol" height={96} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
