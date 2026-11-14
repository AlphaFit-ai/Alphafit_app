import React from 'react';
import { Appearance, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '../constants';
import i18n from '../i18n/config';
import { describeError, logError } from '../services/apiError';

interface ErrorFallbackProps {
  error?: unknown;
  /** Try to show the screen again. */
  onReload: () => void;
}

/**
 * What the user sees when a screen crashes: a plain explanation and a reload button instead of a
 * blank screen. It does not use the theme or any other context, because the crash may have come
 * from one of them; it reads the phone's colour scheme directly.
 */
export function ErrorFallback({ error, onReload }: ErrorFallbackProps) {
  const dark = Appearance.getColorScheme() === 'dark';
  const text = dark ? Colors.white : Colors.black;
  const subtle = dark ? Colors.gray[400] : Colors.gray[600];

  return (
    <View
      style={[styles.container, { backgroundColor: dark ? Colors.backgroundDark : Colors.white }]}
      accessibilityRole="alert"
    >
      <Text style={[styles.title, { color: text }]}>{i18n.t('errors.boundary.title')}</Text>
      <Text style={[styles.message, { color: subtle }]}>{i18n.t('errors.boundary.message')}</Text>
      {__DEV__ && error ? (
        <Text style={[styles.detail, { color: subtle }]} numberOfLines={6}>
          {describeError(error)}
        </Text>
      ) : null}
      <TouchableOpacity
        style={styles.button}
        onPress={onReload}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('errors.boundary.reload')}
      >
        <Text style={styles.buttonText}>{i18n.t('errors.boundary.reload')}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: unknown;
  hasError: boolean;
}

/**
 * Catches errors thrown while rendering anything below it, logs them (without personal data) and
 * shows `ErrorFallback`. "Reload" renders the children again from a clean state.
 */
export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null, hasError: false };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidCatch(error: unknown) {
    logError('render', error);
  }

  private reload = () => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReload={this.reload} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: Fonts.sizes['2xl'],
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  message: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
  detail: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  button: {
    minHeight: 48,
    minWidth: 160,
    borderRadius: 24,
    paddingHorizontal: 24,
    marginTop: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.gray[900],
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
  },
});
