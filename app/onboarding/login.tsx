import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LanguageSelector } from '../../components';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { useApplyServerPreferences } from '../../hooks/useApplyServerPreferences';
import { setLanguage } from '../../i18n/config';
import { firebaseAuthService, userService } from '../../services';
import { normalizeApiError } from '../../services/apiError';
import { getAuthErrorKey } from '../../services/authErrors';
import { completeSignIn } from '../../services/bootstrap';
import { AuthProviderName } from '../../services/firebaseAuthService';
import { sessionStore } from '../../services/sessionStore';
import {
  AppImage,
  BrandLogo,
  Button,
  Dialog,
  Input,
  PressableScale,
  Screen,
  Text,
  useDialog,
} from '../../src/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { updateOnboardingData } = useOnboarding();
  const applyServerPreferences = useApplyServerPreferences();
  const { toggleTheme, tokens } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const { show, dialog } = useDialog();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAppleButton, setShowAppleButton] = useState(false);

  // Sign in with Apple exists on iOS only; on Android the button is not shown.
  useEffect(() => {
    let active = true;
    firebaseAuthService.isAppleSignInAvailable().then((available) => {
      if (active) setShowAppleButton(available);
    });
    return () => {
      active = false;
    };
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /** The message to show for a sign-in failure, in the user's language. */
  const describeFailure = (error: unknown, fallback: string): string => {
    const code = (error as { code?: string } | null)?.code;
    const key = getAuthErrorKey(code);
    if (key) return t(key);
    const normalized = normalizeApiError(error);
    if (normalized.kind === 'offline') return t('errors.offline');
    if (normalized.kind === 'timeout') return t('errors.timeout');
    if (normalized.kind === 'http' && normalized.retryable) return t('errors.server');
    return fallback;
  };

  const handleAuthSuccess = async (
    userEmail: string | null | undefined,
    idToken: string,
    provider: AuthProviderName
  ): Promise<void> => {
    try {
      // Exchange the Firebase token for an api token and read the saved onboarding data.
      const result = await completeSignIn(idToken, provider);

      applyServerPreferences(result.profile?.preferences);
      updateOnboardingData({
        email: result.profile?.email ?? userEmail ?? '',
        authProvider: provider,
      });
      // The session decides where this user continues; `/` sends them there.
      sessionStore.setSignedIn(result);
      router.replace('/');
    } catch (error) {
      // A failed request is an error to retry, never "this user has not onboarded".
      show({
        title: t('welcome.error'),
        message: describeFailure(error, t('welcome.authError')),
        feedback: 'error',
        actions: [
          { label: t('common.cancel'), tone: 'cancel' },
          {
            label: t('common.retry'),
            onPress: () => void handleAuthSuccess(userEmail, idToken, provider),
          },
        ],
      });
    }
  };

  const handleContinueWithGoogle = async () => {
    if (googleLoading || appleLoading || emailLoading) return;

    try {
      setGoogleLoading(true);
      const result = await firebaseAuthService.signInWithGoogle();

      // User cancelled - result will be null
      if (!result) {
        return;
      }

      await handleAuthSuccess(result.user.email, result.idToken, 'google');
    } catch (error: unknown) {
      show({
        title: t('welcome.error'),
        message: describeFailure(error, t('welcome.googleError')),
        feedback: 'error',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleContinueWithApple = async () => {
    if (googleLoading || appleLoading || emailLoading) return;

    try {
      setAppleLoading(true);
      const result = await firebaseAuthService.signInWithApple();
      await handleAuthSuccess(result.user.email, result.idToken, 'apple');
    } catch (error: unknown) {
      // Backing out of the Apple sheet is not an error.
      if ((error as { code?: string } | null)?.code !== 'ERR_CANCELED') {
        show({
          title: t('welcome.error'),
          message: describeFailure(error, t('welcome.appleError')),
          feedback: 'error',
        });
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleContinueWithEmail = async () => {
    // Reset errors
    setEmailError('');

    // Validate email
    if (!email) {
      setEmailError(t('welcome.emailRequired'));
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(t('welcome.invalidEmail'));
      return;
    }

    // Check if email exists using backend API
    try {
      setEmailLoading(true);

      const emailExists = await userService.checkEmailExists(email);

      if (emailExists) {
        // Email exists, show password modal
        setShowPasswordModal(true);
      } else {
        // Email doesn't exist, show error
        setEmailError(t('welcome.noAccountFound'));
      }
    } catch (error: unknown) {
      show({
        title: t('welcome.error'),
        message: describeFailure(error, t('welcome.checkEmailError')),
        feedback: 'error',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    // Reset errors
    setPasswordError('');

    // Validate
    if (!password) {
      setPasswordError(t('welcome.passwordRequired'));
      return;
    }
    if (password.length < 6) {
      setPasswordError(t('welcome.passwordTooShort'));
      return;
    }

    try {
      setEmailLoading(true);
      const result = await firebaseAuthService.signInWithEmailPassword(email, password);
      setShowPasswordModal(false);
      await handleAuthSuccess(result.user.email, result.idToken, 'email');
    } catch (error: unknown) {
      show({
        title: t('welcome.error'),
        message: describeFailure(error, t('welcome.loginError')),
        feedback: 'error',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      show({ title: t('welcome.error'), message: t('welcome.enterValidEmail'), feedback: 'error' });
      return;
    }

    try {
      await firebaseAuthService.sendPasswordResetEmail(email);
      show({
        title: t('welcome.success'),
        message: t('welcome.resetEmailSent'),
        feedback: 'confirm',
      });
      setShowPasswordModal(false);
    } catch (error: unknown) {
      show({
        title: t('welcome.error'),
        message: describeFailure(error, t('welcome.resetError')),
        feedback: 'error',
      });
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
  };

  const c = tokens.color;
  const busy = googleLoading || appleLoading || emailLoading;

  return (
    <Screen
      scroll
      keyboard
      contentStyle={styles.content}
      header={
        <View style={styles.topControls}>
          <PressableScale
            onPress={toggleTheme}
            accessibilityRole="button"
            accessibilityLabel={t('profile.darkMode')}
            style={[styles.iconButton, { backgroundColor: c.surfaceMuted }]}
          >
            <Ionicons name={tokens.mode === 'dark' ? 'sunny' : 'moon'} size={22} color={c.text} />
          </PressableScale>
          <PressableScale
            onPress={() => setShowLanguages(true)}
            accessibilityRole="button"
            accessibilityLabel={t('profile.language')}
            style={[styles.languageButton, { backgroundColor: c.surfaceMuted }]}
          >
            <Ionicons name="language" size={22} color={c.text} />
            <Text variant="label">{i18n.language.toUpperCase()}</Text>
          </PressableScale>
        </View>
      }
    >
      <View style={styles.header}>
        <BrandLogo height={36} style={styles.logo} />
        <Text variant="title" accessibilityRole="header">
          {t('welcome.title')}
        </Text>

        <Text tone="muted">{t('welcome.subtitle')}</Text>
      </View>

      <SocialButton
        onPress={handleContinueWithGoogle}
        disabled={busy}
        loading={googleLoading}
        label={t('welcome.continueWithGoogle')}
        icon={
          <AppImage
            source={require('../../assets/images/logo/google.png')}
            noPlaceholder
            contentFit="contain"
            accessible={false}
            style={styles.socialIcon}
          />
        }
      />
      {showAppleButton && (
        <SocialButton
          onPress={handleContinueWithApple}
          disabled={busy}
          loading={appleLoading}
          label={t('welcome.continueWithApple')}
          icon={<Ionicons name="logo-apple" size={22} color={c.text} />}
        />
      )}

      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: c.border }]} />
        <Text variant="caption" tone="muted">
          {t('welcome.or')}
        </Text>
        <View style={[styles.line, { backgroundColor: c.border }]} />
      </View>

      <Input
        label={t('welcome.email')}
        placeholder={t('welcome.emailPlaceholder')}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setEmailError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={emailError}
      />
      <Button
        title={emailLoading ? t('welcome.loading') : t('welcome.continue')}
        onPress={handleContinueWithEmail}
        disabled={busy}
      />

      <Text variant="caption" tone="subtle" style={styles.terms}>
        {t('welcome.terms')}
      </Text>

      <View style={styles.registerRow}>
        <Text tone="muted">{t('welcome.noAccount')} </Text>
        <PressableScale
          onPress={() => router.push('/onboarding/register')}
          minTarget
          accessibilityRole="link"
          style={styles.link}
        >
          <Text variant="bodyStrong" tone="accent">
            {t('welcome.signUp')}
          </Text>
        </PressableScale>
      </View>

      <LanguageSelector
        visible={showLanguages}
        onClose={() => setShowLanguages(false)}
        onSelect={(language) => void setLanguage(language.code)}
        selectedLanguage={i18n.language}
      />

      {/* The password for an e-mail that has an account */}
      <Dialog
        visible={showPasswordModal}
        title={t('welcome.enterPassword')}
        message={email}
        onClose={handleClosePasswordModal}
        actions={[
          {
            label: emailLoading ? t('welcome.loading') : t('welcome.login'),
            keepOpen: true,
            loading: emailLoading,
            onPress: handlePasswordSubmit,
          },
        ]}
      >
        <Input
          label={t('welcome.password')}
          placeholder={t('welcome.passwordPlaceholder')}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
          }}
          secureTextEntry={!showPassword}
          autoComplete="password"
          error={passwordError}
          rightIcon={
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? t('common.hidePassword') : t('common.showPassword')
              }
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eye}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={c.textMuted} />
            </PressableScale>
          }
        />
        <PressableScale
          onPress={handleForgotPassword}
          minTarget
          accessibilityRole="button"
          style={styles.forgot}
        >
          <Text variant="label" tone="accent">
            {t('welcome.forgotPassword')}
          </Text>
        </PressableScale>
      </Dialog>

      {dialog}
    </Screen>
  );
}

function SocialButton({
  onPress,
  disabled,
  loading,
  label,
  icon,
}: {
  onPress: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  const { tokens } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      feedback
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
      style={[
        styles.social,
        { backgroundColor: tokens.color.surface, borderColor: tokens.color.borderStrong },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tokens.color.text} />
      ) : (
        <>
          {icon}
          <Text variant="bodyStrong">{label}</Text>
        </>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32, gap: 12 },
  topControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButton: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logo: { alignSelf: 'flex-start', marginBottom: 8 },
  header: { gap: 6, marginBottom: 12 },
  social: {
    minHeight: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialIcon: { width: 22, height: 22 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  terms: { textAlign: 'center', marginTop: 4 },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 44, justifyContent: 'center' },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  forgot: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
});
