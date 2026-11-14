import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo, Button, Screen, Text } from '../ui';
import { takeCapturedToken } from './boot';
import { DEV_SIGN_IN_COPY, TOKEN_COMMAND_UNIX, TOKEN_COMMAND_WINDOWS } from './copy';
import { DevSignInError, DevSignInFailure, signInWithDevToken } from './devSignIn';
import { tokenFromHash } from './devToken';

/** The token of the link this page was opened with: taken at start-up, or still in the address bar. */
function readToken(): string | null {
  const captured = takeCapturedToken();
  if (captured) return captured;
  if (typeof window === 'undefined' || !window.location) return null;
  const token = tokenFromHash(window.location.hash);
  if (token) {
    try {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    } catch {
      // nothing to do: the fragment stays visible
    }
  }
  return token;
}

/**
 * `/dev-sign-in#token=<JWT>` in the browser preview (docs/CONTRACTS.md section 8). Signs in with the
 * token of the link and goes to `/`; a link that does not work says why and how to get a new one.
 */
export default function DevSignInScreen() {
  const router = useRouter();
  const { tokens } = useTheme();
  const [failure, setFailure] = useState<DevSignInFailure | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    signInWithDevToken(readToken())
      .then(() => router.replace('/'))
      .catch((error: unknown) =>
        setFailure(error instanceof DevSignInError ? error.reason : 'failed')
      );
  }, [router]);

  if (!failure) {
    return (
      <Screen contentStyle={styles.center}>
        <ActivityIndicator size="large" color={tokens.color.accent} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {DEV_SIGN_IN_COPY.working}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      footer={<Button title={DEV_SIGN_IN_COPY.toLogin} onPress={() => router.replace('/')} />}
    >
      <BrandLogo height={32} style={styles.logo} />
      <Text variant="title" accessibilityRole="header">
        {DEV_SIGN_IN_COPY.failedTitle}
      </Text>
      <Text accessibilityRole="alert">{DEV_SIGN_IN_COPY.reasons[failure]}</Text>
      <Text tone="muted">{DEV_SIGN_IN_COPY.howTo}</Text>
      {[TOKEN_COMMAND_WINDOWS, TOKEN_COMMAND_UNIX].map((command) => (
        <View
          key={command}
          style={[
            styles.command,
            { backgroundColor: tokens.color.surfaceMuted, borderColor: tokens.color.border },
          ]}
        >
          <Text variant="label" selectable>
            {command}
          </Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  content: { paddingTop: 32, paddingBottom: 24, gap: 16 },
  logo: { alignSelf: 'flex-start' },
  command: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
});
