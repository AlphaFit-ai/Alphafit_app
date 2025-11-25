import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, GradientText, Input } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { firebaseAuthService, onboardingService, userService } from '../../services';

// Helper function to determine first incomplete onboarding screen
function getFirstIncompleteScreen(data: any): string {
  if (!data) return '/onboarding/source';
  
  // Check each required field in order
  if (!data.source) return '/onboarding/source';
  if (!data.dateOfBirth) return '/onboarding/age';
  if (!data.gender) return '/onboarding/gender';
  if (!data.height || !data.weight) return '/onboarding/height';
  if (!data.fitnessLevel) return '/onboarding/fitness-level';
  if (!data.activityLevel) return '/onboarding/activity';
  if (!data.workoutsPerWeek) return '/onboarding/workouts';
  if (!data.equipment) return '/onboarding/equipment';
  if (!data.goal) return '/onboarding/goal';
  
  // All onboarding complete
  return '/(tabs)/home';
}

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateOnboardingData } = useOnboarding();
  const { isDarkMode, colors } = useTheme();
  
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
  const [loading, setLoading] = useState(false);
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
      errors.push(t('register.errors.passwordMinLength', 'At least 8 characters'));
    }
    if (!/[a-z]/.test(password)) {
      errors.push(t('register.errors.passwordLowercase', 'One lowercase letter'));
    }
    if (!/[A-Z]/.test(password)) {
      errors.push(t('register.errors.passwordUppercase', 'One uppercase letter'));
    }
    if (!/\d/.test(password)) {
      errors.push(t('register.errors.passwordNumber', 'One number'));
    }
    
    return errors;
  };

  const validatePassword = (password: string) => {
    return getPasswordErrors(password).length === 0;
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    setErrors({ ...errors, [field]: '' });
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
      newErrors.fullName = t('register.errors.nameRequired', 'Full name is required');
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('register.errors.nameMinLength', 'Name must be at least 2 characters');
      isValid = false;
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = t('register.errors.emailRequired', 'Email is required');
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('register.errors.emailInvalid', 'Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = t('register.errors.passwordRequired', 'Password is required');
      isValid = false;
    } else {
      const passwordErrors = getPasswordErrors(formData.password);
      if (passwordErrors.length > 0) {
        newErrors.password = t('register.errors.passwordMissing', 'Missing: ') + passwordErrors.join(', ');
        isValid = false;
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.confirmPasswordRequired', 'Please confirm your password');
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.errors.passwordMismatch', 'Passwords do not match');
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
      Alert.alert(
        t('register.termsRequired', 'Terms Required'),
        t('register.termsMessage', 'Please agree to the Terms & Conditions and Privacy Policy to continue')
      );
      return;
    }

    // Check if email already exists
    try {
      setSendingCode(true);
      const emailExists = await userService.checkEmailExists(formData.email);
      
      if (emailExists) {
        Alert.alert(
          t('register.error', 'Registration Error'),
          t('register.errors.emailInUse', 'This email is already registered. Please log in instead.')
        );
        return;
      }

      // Send verification code to email
      const response = await fetch('http://100.91.176.251:8080/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      if (!response.ok) {
        throw new Error('Failed to send verification code');
      }

      // Show verification modal
      setShowVerificationModal(true);
      
    } catch (error: any) {
      Alert.alert(
        t('register.error', 'Error'),
        error.message || t('register.errors.sendCodeFailed', 'Failed to send verification code. Please try again.')
      );
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!verificationCode.trim()) {
      setVerificationError(t('register.errors.codeRequired', 'Verification code is required'));
      return;
    }

    if (verificationCode.length !== 6) {
      setVerificationError(t('register.errors.codeInvalid', 'Code must be 6 digits'));
      return;
    }

    try {
      setVerifyingCode(true);
      
      // Verify code with backend
      const verifyResponse = await fetch('http://100.91.176.251:8080/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email,
          code: verificationCode 
        })
      });

      if (!verifyResponse.ok) {
        setVerificationError(t('register.errors.codeIncorrect', 'Invalid verification code'));
        return;
      }

      // Code is valid, proceed with registration
      // Register with Firebase
      const result = await firebaseAuthService.registerWithEmail(
        formData.email,
        formData.password,
        formData.fullName
      );

      // Send to backend
      const response = await userService.authenticateUser(result.idToken);

      // Load saved onboarding data from backend (in case user registered before)
      try {
        const savedData = await onboardingService.getOnboardingData();
        
        if (savedData) {
          // Load saved data into context
          updateOnboardingData(savedData);
        } else {
          // New user - set initial data
          updateOnboardingData({
            fullName: formData.fullName,
            email: formData.email,
            authProvider: 'email'
          });
        }
        
        // Determine where to navigate based on onboarding progress
        const nextScreen = getFirstIncompleteScreen(savedData);
        
        // Close modal and navigate
        setShowVerificationModal(false);
        router.replace(nextScreen);
        
      } catch (error) {
        console.error('Failed to load onboarding data:', error);
        // If error loading data, start onboarding from beginning
        updateOnboardingData({
          fullName: formData.fullName,
          email: formData.email,
          authProvider: 'email'
        });
        setShowVerificationModal(false);
        router.replace('/onboarding/source');
      }
      
    } catch (error: any) {
      let errorMessage = t('register.errors.registrationFailed', 'Registration failed. Please try again.');
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('register.errors.emailInUse', 'This email is already registered. Please log in instead.');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('register.errors.weakPassword', 'Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('register.errors.invalidEmail', 'Invalid email address.');
      }
      
      Alert.alert(
        t('register.error', 'Registration Error'),
        errorMessage
      );
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setSendingCode(true);
      setVerificationError('');
      
      const response = await fetch('http://100.91.176.251:8080/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      if (!response.ok) {
        throw new Error('Failed to resend verification code');
      }

      Alert.alert(
        t('register.success', 'Success'),
        t('register.codeSent', 'Verification code sent to your email')
      );
      
    } catch (error: any) {
      Alert.alert(
        t('register.error', 'Error'),
        error.message || t('register.errors.resendFailed', 'Failed to resend code. Please try again.')
      );
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back Button */}
        <View style={styles.topControls}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]} 
          onPress={handleBackToLogin}
        >
          <Ionicons name="arrow-back" size={22} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.spacer} />
        
        <View style={styles.bottomWrapper}>
          <View style={styles.header}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>
              {t('register.title', 'CREATE ACCOUNT')}
            </Text>
            <GradientText text="ALPHAFIT AI" style={styles.brandContainer} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('register.subtitle', 'Start your fitness transformation journey')}
            </Text>
          </View>

          <View style={styles.content}>
            {/* Full Name Input */}
            <Input
              label={t('register.fullName', 'Full Name')}
              placeholder={t('register.fullNamePlaceholder', 'yassir amraoui')}
              value={formData.fullName}
              onChangeText={(text) => handleFieldChange('fullName', text)}
              autoCapitalize="words"
              error={errors.fullName}
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.icon} />}
            />

            {/* Email Input */}
            <Input
              label={t('register.email', 'Email')}
              placeholder={t('register.emailPlaceholder', 'example@gmail.com')}
              value={formData.email}
              onChangeText={(text) => handleFieldChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.icon} />}
            />

            {/* Password Input */}
            <Input
              label={t('register.password', 'Password')}
              placeholder={t('register.passwordPlaceholder', 'Min. 8 characters')}
              value={formData.password}
              onChangeText={(text) => handleFieldChange('password', text)}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.icon} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              }
            />

            {/* Confirm Password Input */}
            <Input
              label={t('register.confirmPassword', 'Confirm Password')}
              placeholder={t('register.confirmPasswordPlaceholder', 'Re-enter password')}
              value={formData.confirmPassword}
              onChangeText={(text) => handleFieldChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              error={errors.confirmPassword}
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.icon} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              }
            />

            {/* Terms and Conditions Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: agreedToTerms ? Colors.primary : colors.border },
                agreedToTerms && styles.checkboxChecked
              ]}>
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={16} color={Colors.white} />
                )}
              </View>
              <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>
                {t('register.agreeToTerms', 'I agree to the')}{' '}
                <Text style={[styles.link, { color: Colors.primary }]}>
                  {t('register.termsOfService', 'Terms of Service')}
                </Text>{' '}
                {t('register.and', 'and')}{' '}
                <Text style={[styles.link, { color: Colors.primary }]}>
                  {t('register.privacyPolicy', 'Privacy Policy')}
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <Button 
              title={sendingCode ? t('register.sendingCode', 'Sending Code...') : t('register.createAccount', 'Create Account')} 
              onPress={handleRegister}
              disabled={!agreedToTerms || sendingCode}
            />

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                {t('register.alreadyHaveAccount', 'Already have an account?')}{' '}
              </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={[styles.loginLink, { color: Colors.primary }]}>
                  {t('register.signIn', 'Sign In')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseVerificationModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={handleCloseVerificationModal}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('register.verifyEmail', 'Verify Your Email')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {t('register.verifyEmailMessage', 'We sent a 6-digit code to')} {formData.email}
              </Text>

              <Input
                label={t('register.verificationCode', 'Verification Code')}
                placeholder="000000"
                value={verificationCode}
                onChangeText={(text) => {
                  setVerificationCode(text.replace(/[^0-9]/g, ''));
                  setVerificationError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={verificationError}
              />

              <Button 
                title={verifyingCode ? t('register.verifying', 'Verifying...') : t('register.verify', 'Verify & Create Account')} 
                onPress={handleVerifyAndRegister}
                disabled={verifyingCode || sendingCode}
                style={{ marginTop: 8 }}
              />

              <TouchableOpacity 
                onPress={handleResendCode}
                disabled={sendingCode}
                style={styles.resendContainer}
              >
                <Text style={[styles.resendText, { color: sendingCode ? colors.textSecondary : Colors.primary }]}>
                  {sendingCode ? t('register.sending', 'Sending...') : t('register.resendCode', 'Resend Code')}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  bottomWrapper: {
    paddingVertical: 80,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 40,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  brandContainer: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
    textAlign: 'center',
    paddingHorizontal: 16,
    fontFamily: Fonts.regular,
  },
  content: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: Fonts.sizes.sm,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  link: {
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
  },
  loginLink: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardView: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: Fonts.weights.bold,
    fontFamily: Fonts.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resendText: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
    fontWeight: Fonts.weights.semiBold,
  },
});
