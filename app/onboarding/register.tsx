import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Fonts } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { useApplyServerPreferences } from '../../hooks/useApplyServerPreferences';
import { firebaseAuthService, userService } from '../../services';
import { normalizeApiError } from '../../services/apiError';
import { getAuthErrorKey } from '../../services/authErrors';
import { completeSignIn } from '../../services/bootstrap';
import { sessionStore } from '../../services/sessionStore';
import {
  BrandLogo,
  Button,
  Checkbox,
  Dialog,
  Input,
  PressableScale,
  Screen,
  Text,
  useDialog,
} from '../../src/ui';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateOnboardingData } = useOnboarding();
  const applyServerPreferences = useApplyServerPreferences();
  const { tokens } = useTheme();
  const { show, dialog } = useDialog();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getPasswordErrors = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push(t('register.errors.passwordMinLength'));
    }
    if (!/[a-z]/.test(password)) {
      errors.push(t('register.errors.passwordLowercase'));
    }
    if (!/[A-Z]/.test(password)) {
      errors.push(t('register.errors.passwordUppercase'));
    }
    if (!/\d/.test(password)) {
      errors.push(t('register.errors.passwordNumber'));
    }

    return errors;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    setErrors({ ...errors, [field]: '' });
  };

  /** The message for a failed request, in the user's language. */
  const describeFailure = (error: unknown, fallback: string): string => {
    const key = getAuthErrorKey((error as { code?: string } | null)?.code);
    if (key) return t(key);
    const normalized = normalizeApiError(error);
    if (normalized.kind === 'offline') return t('errors.offline');
    if (normalized.kind === 'timeout') return t('errors.timeout');
    if (normalized.kind === 'http' && normalized.retryable) return t('errors.server');
    return fallback;
  };

  const validateForm = () => {
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    let isValid = true;

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('register.errors.nameRequired');
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('register.errors.nameMinLength');
      isValid = false;
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = t('register.errors.emailRequired');
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('register.errors.emailInvalid');
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = t('register.errors.passwordRequired');
      isValid = false;
    } else {
      const passwordErrors = getPasswordErrors(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = t('register.errors.passwordMissing') + passwordErrors.join(', ');
        isValid = false;
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.confirmPasswordRequired');
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.passwordMismatch');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    if (!agreedToTerms) {
      show({
        title: t('register.termsRequired'),
        message: t('register.termsMessage'),
        feedback: 'error',
      });
      return;
    }

    // Check if email already exists
    try {
      setSendingCode(true);
      const emailExists = await userService.checkEmailExists(formData.email);

      if (emailExists) {
        show({
          title: t('register.error'),
          message: t('register.errors.emailInUse'),
          feedback: 'error',
        });
        return;
      }

      // Send verification code to email
      await userService.sendVerificationCode(formData.email);

      // Show verification modal
      setShowVerificationModal(true);
    } catch (error: unknown) {
      show({
        title: t('register.error'),
        message: describeFailure(error, t('register.errors.sendCodeFailed')),
        feedback: 'error',
      });
    } finally {
      setSendingCode(false);
    }
  };

  /** Sign the new Firebase account in to the api and continue where onboarding should resume. */
  const finishRegistration = async (idToken: string): Promise<void> => {
    try {
      const result = await completeSignIn(idToken, 'email');

      applyServerPreferences(result.profile?.preferences);
      updateOnboardingData({
        fullName: result.profile?.fullName ?? formData.fullName,
        email: result.profile?.email ?? formData.email,
        authProvider: 'email',
      });

      // Close modal and navigate
      setShowVerificationModal(false);
      sessionStore.setSignedIn(result);
      router.replace('/');
    } catch (error: unknown) {
      // The Firebase account exists now; a failed request here is retried, not treated as a new user.
      show({
        title: t('register.error'),
        message: describeFailure(error, t('register.errors.registrationFailed')),
        feedback: 'error',
        actions: [
          { label: t('common.cancel'), tone: 'cancel' },
          { label: t('common.retry'), onPress: () => void finishRegistration(idToken) },
        ],
      });
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!verificationCode.trim()) {
      setVerificationError(t('register.errors.codeRequired'));
      return;
    }

    if (verificationCode.length !== 6) {
      setVerificationError(t('register.errors.codeInvalid'));
      return;
    }

    try {
      setVerifyingCode(true);

      // Verify code with backend
      const codeIsValid = await userService.verifyCode(formData.email, verificationCode);

      if (!codeIsValid) {
        setVerificationError(t('register.errors.codeIncorrect'));
        return;
      }

      // Code is valid, proceed with registration (Firebase first, then the api)
      const result = await firebaseAuthService.registerWithEmail(
        formData.email,
        formData.password,
        formData.fullName
      );

      await finishRegistration(result.idToken);
    } catch (error: unknown) {
      // `error.code` is the Firebase code, so "email already in use" is told apart from the rest.
      const code = (error as { code?: string } | null)?.code;
      let message = describeFailure(error, t('register.errors.registrationFailed'));
      if (code === 'auth/email-already-in-use') message = t('register.errors.emailInUse');
      else if (code === 'auth/weak-password') message = t('register.errors.weakPassword');
      else if (code === 'auth/invalid-email') message = t('register.errors.invalidEmail');

      show({ title: t('register.error'), message: message, feedback: 'error' });
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setSendingCode(true);
      setVerificationError('');

      await userService.sendVerificationCode(formData.email);

      show({ title: t('register.success'), message: t('register.codeSent'), feedback: 'confirm' });
    } catch (error: unknown) {
      show({
        title: t('register.error'),
        message: describeFailure(error, t('register.errors.resendFailed')),
        feedback: 'error',
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleCloseVerificationModal = () => {
    setShowVerificationModal(false);
    setVerificationCode('');
    setVerificationError('');
  };

  const handleBackToLogin = () => {
    router.replace('/onboarding/login');
  };

  const c = tokens.color;
  const eye = (shown: boolean, toggle: () => void) => (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={shown ? t('common.hidePassword') : t('common.showPassword')}
      onPress={toggle}
      style={styles.eye}
    >
      <Ionicons name={shown ? 'eye-outline' : 'eye-off-outline'} size={20} color={c.textMuted} />
    </PressableScale>
  );
  const fieldIcon = (name: keyof typeof Ionicons.glyphMap) => (
    <Ionicons name={name} size={20} color={c.textMuted} />
  );

  return (
    <Screen
      scroll
      keyboard
      contentStyle={styles.content}
      header={
        <PressableScale
          onPress={handleBackToLogin}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          style={[styles.backButton, { backgroundColor: c.surfaceMuted }]}
        >
          <Ionicons name="arrow-back" size={22} color={c.text} />
        </PressableScale>
      }
    >
      <View style={styles.header}>
        <BrandLogo height={36} style={styles.logo} />
        <Text variant="title" accessibilityRole="header">
          {t('register.title')}
        </Text>

        <Text tone="muted">{t('register.subtitle')}</Text>
      </View>

      <Input
        label={t('register.fullName')}
        placeholder={t('register.fullNamePlaceholder')}
        value={formData.fullName}
        onChangeText={(text) => handleFieldChange('fullName', text)}
        autoCapitalize="words"
        autoComplete="name"
        error={errors.fullName}
        leftIcon={fieldIcon('person-outline')}
      />
      <Input
        label={t('register.email')}
        placeholder={t('register.emailPlaceholder')}
        value={formData.email}
        onChangeText={(text) => handleFieldChange('email', text)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
        leftIcon={fieldIcon('mail-outline')}
      />
      <Input
        label={t('register.password')}
        placeholder={t('register.passwordPlaceholder')}
        value={formData.password}
        onChangeText={(text) => handleFieldChange('password', text)}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        error={errors.password}
        leftIcon={fieldIcon('lock-closed-outline')}
        rightIcon={eye(showPassword, () => setShowPassword(!showPassword))}
      />
      <Input
        label={t('register.confirmPassword')}
        placeholder={t('register.confirmPasswordPlaceholder')}
        value={formData.confirmPassword}
        onChangeText={(text) => handleFieldChange('confirmPassword', text)}
        secureTextEntry={!showConfirmPassword}
        autoComplete="new-password"
        error={errors.confirmPassword}
        leftIcon={fieldIcon('lock-closed-outline')}
        rightIcon={eye(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
      />

      <Checkbox checked={agreedToTerms} onChange={setAgreedToTerms}>
        <Text variant="caption" tone="muted">
          {t('register.agreeToTerms')}{' '}
          <Text variant="caption" tone="accent" style={styles.bold}>
            {t('register.termsOfService')}
          </Text>{' '}
          {t('register.and')}{' '}
          <Text variant="caption" tone="accent" style={styles.bold}>
            {t('register.privacyPolicy')}
          </Text>
        </Text>
      </Checkbox>

      <Button
        title={sendingCode ? t('register.sendingCode') : t('register.createAccount')}
        onPress={handleRegister}
        disabled={!agreedToTerms || sendingCode}
      />

      <View style={styles.loginRow}>
        <Text tone="muted">{t('register.alreadyHaveAccount')} </Text>
        <PressableScale
          onPress={handleBackToLogin}
          minTarget
          accessibilityRole="button"
          style={styles.link}
        >
          <Text variant="bodyStrong" tone="accent">
            {t('register.signIn')}
          </Text>
        </PressableScale>
      </View>

      {/* The code sent by e-mail */}
      <Dialog
        visible={showVerificationModal}
        title={t('register.verifyEmail')}
        message={`${t('register.verifyEmailMessage')} ${formData.email}`}
        onClose={handleCloseVerificationModal}
        actions={[
          {
            label: verifyingCode ? t('register.verifying') : t('register.verify'),
            keepOpen: true,
            loading: verifyingCode,
            onPress: handleVerifyAndRegister,
          },
        ]}
      >
        <Input
          label={t('register.verificationCode')}
          placeholder="000000"
          value={verificationCode}
          onChangeText={(text) => {
            setVerificationCode(text.replace(/[^0-9]/g, ''));
            setVerificationError('');
          }}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          error={verificationError}
        />
        <PressableScale
          onPress={handleResendCode}
          disabled={sendingCode}
          minTarget
          accessibilityRole="button"
          style={styles.resend}
        >
          <Text variant="label" tone={sendingCode ? 'muted' : 'accent'}>
            {sendingCode ? t('register.sending') : t('register.resendCode')}
          </Text>
        </PressableScale>
      </Dialog>

      {dialog}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 32, gap: 8 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { alignSelf: 'flex-start', marginBottom: 8 },
  header: { gap: 6, marginBottom: 12 },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bold: { fontFamily: Fonts.semiBold },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  link: { minHeight: 44, justifyContent: 'center' },
  resend: { minHeight: 44, justifyContent: 'center', alignSelf: 'center' },
});
