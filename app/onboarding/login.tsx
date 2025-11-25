import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, GradientText, Input } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { firebaseAuthService, onboardingService, userService } from '../../services';
import * as AppleAuthentication from 'expo-apple-authentication';

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

export default function LoginScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { updateOnboardingData } = useOnboarding();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isNotRobot, setIsNotRobot] = useState(false);

  const toggleLanguageMenu = () => {
    setShowLanguageMenu(!showLanguageMenu);
  };

  const selectLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageMenu(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuthSuccess = async (user: any, idToken: string, provider: 'email' | 'google' | 'apple') => {
    try {
      // Send to backend
      const response = await userService.authenticateUser(idToken);
      
      // Load saved onboarding data from backend
      try {
        const savedData = await onboardingService.getOnboardingData();
        
        if (savedData) {
          // Load saved data into context
          updateOnboardingData(savedData);
        } else {
          // New user - just update email and provider
          updateOnboardingData({ 
            email: user.email || '',
            authProvider: provider
          });
        }
        
        // Determine where to navigate based on onboarding progress
        const nextScreen = getFirstIncompleteScreen(savedData);
        router.replace(nextScreen);
        
      } catch (error) {
        console.error('Failed to load onboarding data:', error);
        // If error loading data, start onboarding from beginning
        updateOnboardingData({ 
          email: user.email || '',
          authProvider: provider
        });
        router.replace('/onboarding/source');
      }
    } catch (error: any) {
      console.error('Backend authentication error:', error);
      Alert.alert(
        t('welcome.error', 'Error'),
        error.message || t('welcome.authError', 'Authentication failed. Please try again.')
      );
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
      
      await handleAuthSuccess(result.user, result.idToken, 'google');
    } catch (error: any) {
      let errorMessage = error.message || t('welcome.googleError', 'Google sign-in failed');
      
      Alert.alert(
        t('welcome.error', 'Error'),
        errorMessage
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleContinueWithApple = async () => {
    if (googleLoading || appleLoading || emailLoading) return;
    
    // Check if Apple Sign-In is available
    try {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert(
          t('welcome.notAvailable', 'Not Available'),
          t('welcome.appleNotAvailableMessage', 'Apple Sign-In is only available on iOS 13+ devices. Please use Google or Email sign-in instead.')
        );
        return;
      }

      setAppleLoading(true);
      const result = await firebaseAuthService.signInWithApple();
      await handleAuthSuccess(result.user, result.idToken, 'apple');
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert(
          t('welcome.error', 'Error'),
          error.message || t('welcome.appleError', 'Apple sign-in failed. Please try another method.')
        );
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
      setEmailError(t('welcome.emailRequired', 'Email is required'));
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(t('welcome.invalidEmail', 'Please enter a valid email'));
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
        setEmailError(t('welcome.noAccount', 'No account found with this email. Please sign up first.'));
      }
    } catch (error: any) {
      console.error('Email check error:', error);
      Alert.alert(
        t('welcome.error', 'Error'),
        t('welcome.checkEmailError', 'Failed to verify email. Please try again.')
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    // Reset errors
    setPasswordError('');

    // Validate
    if (!password) {
      setPasswordError(t('welcome.passwordRequired', 'Password is required'));
      return;
    }
    if (password.length < 6) {
      setPasswordError(t('welcome.passwordTooShort', 'Password must be at least 6 characters'));
      return;
    }
    if (!isNotRobot) {
      Alert.alert(
        t('welcome.error', 'Error'),
        t('welcome.verifyRobot', 'Please verify that you are not a robot')
      );
      return;
    }

    try {
      setEmailLoading(true);
      const result = await firebaseAuthService.signInWithEmailPassword(email, password);
      setShowPasswordModal(false);
      await handleAuthSuccess(result.user, result.idToken, 'email');
    } catch (error: any) {
      Alert.alert(
        t('welcome.error', 'Error'),
        error.message || t('welcome.loginError', 'Login failed. Please check your credentials.')
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert(
        t('welcome.error', 'Error'),
        t('welcome.enterValidEmail', 'Please enter a valid email address first')
      );
      return;
    }

    try {
      await firebaseAuthService.sendPasswordResetEmail(email);
      Alert.alert(
        t('welcome.success', 'Success'),
        t('welcome.resetEmailSent', 'Password reset email has been sent. Please check your inbox.')
      );
      setShowPasswordModal(false);
    } catch (error: any) {
      Alert.alert(
        t('welcome.error', 'Error'),
        error.message || t('welcome.resetError', 'Failed to send reset email')
      );
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
    setIsNotRobot(false);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top Controls */}
      <View style={styles.topControls}>
        {/* Theme Switcher */}
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]} 
          onPress={toggleTheme}
        >
          <Ionicons 
            name={isDarkMode ? "sunny" : "moon"} 
            size={22} 
            color={colors.icon} 
          />
        </TouchableOpacity>

        {/* Language Switcher */}
        <View style={styles.languageContainer}>
          <TouchableOpacity 
            style={[styles.languageButton, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]} 
            onPress={toggleLanguageMenu}
          >
            <Ionicons name="language" size={22} color={colors.icon} />
            <Text style={[styles.languageText, { color: colors.text }]}>{i18n.language.toUpperCase()}</Text>
          </TouchableOpacity>
          
          {showLanguageMenu && (
            <View style={[styles.languageMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity 
                style={[
                  styles.languageOption, 
                  { borderBottomColor: colors.border },
                  i18n.language === 'en' && { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[50] }
                ]} 
                onPress={() => selectLanguage('en')}
              >
                <Text style={[styles.languageOptionText, { color: colors.text }, i18n.language === 'en' && styles.languageOptionTextActive]}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.languageOption, 
                  { borderBottomColor: colors.border },
                  i18n.language === 'es' && { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[50] }
                ]} 
                onPress={() => selectLanguage('es')}
              >
                <Text style={[styles.languageOptionText, { color: colors.text }, i18n.language === 'es' && styles.languageOptionTextActive]}>Español</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.languageOption, 
                  { borderBottomColor: colors.border },
                  i18n.language === 'fr' && { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[50] }
                ]} 
                onPress={() => selectLanguage('fr')}
              >
                <Text style={[styles.languageOptionText, { color: colors.text }, i18n.language === 'fr' && styles.languageOptionTextActive]}>Français</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.spacer} />
        
        <View style={styles.bottomWrapper}>
          <View style={styles.header}>
            <Text style={[styles.welcomeText, { color: colors.text }]}>{t('welcome.title')}</Text>
            <GradientText text="ALPHAFIT AI" style={styles.brandContainer} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('welcome.subtitle')}</Text>
          </View>

          <View style={styles.content}>
            {/* Google Button */}
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={handleContinueWithGoogle}
              disabled={googleLoading || appleLoading || emailLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Image 
                    source={require('../../assets/images/logo/google.png')} 
                    style={styles.socialIcon}
                  />
                  <Text style={[styles.socialButtonText, { color: colors.text }]}>{t('welcome.continueWithGoogle')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Apple Button */}
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={handleContinueWithApple}
              disabled={googleLoading || appleLoading || emailLoading}
            >
              {appleLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color={colors.icon} style={styles.socialIcon} />
                  <Text style={[styles.socialButtonText, { color: colors.text }]}>{t('welcome.continueWithApple')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>{t('welcome.or')}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Email Input */}
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
              error={emailError}
            />

            {/* Continue Button */}
            <Button 
              title={emailLoading ? t('welcome.loading', 'Loading...') : t('welcome.continue', 'Continue')} 
              onPress={handleContinueWithEmail}
              disabled={googleLoading || appleLoading || emailLoading}
            />

            {/* Terms */}
            <Text style={[styles.terms, { color: colors.textSecondary }]}>{t('welcome.terms')}</Text>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                {t('welcome.noAccount', "Don't have an account?")}{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/onboarding/register')}>
                <Text style={[styles.registerLink, { color: Colors.primary }]}>
                  {t('welcome.signUp', 'Sign Up')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClosePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={handleClosePasswordModal}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Modal Header */}
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('welcome.enterPassword', 'Enter Password')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {email}
              </Text>

              {/* Password Input */}
              <Input
                label={t('welcome.password', 'Password')}
                placeholder={t('welcome.passwordPlaceholder', 'Enter your password')}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                error={passwordError}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={colors.icon} 
                    />
                  </TouchableOpacity>
                }
              />

              {/* Not a Robot Checkbox */}
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setIsNotRobot(!isNotRobot)}
              >
                <View style={[
                  styles.checkbox, 
                  { borderColor: colors.border },
                  isNotRobot && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                ]}>
                  {isNotRobot && (
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                  {t('welcome.notRobot', "I'm not a robot")}
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Button 
                title={emailLoading ? t('welcome.loading', 'Loading...') : t('welcome.login', 'Log In')} 
                onPress={handlePasswordSubmit}
                disabled={emailLoading}
                style={{ marginTop: 8 }}
              />

              {/* Forgot Password Link */}
              <TouchableOpacity 
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
              >
                <Text style={[styles.forgotPasswordText, { color: Colors.primary }]}>
                  {t('welcome.forgotPassword', 'Forgot password?')}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageContainer: {
    zIndex: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  languageMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  languageOptionText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
  },
  languageOptionTextActive: {
    fontWeight: Fonts.weights.semiBold,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  languageText: {
    marginLeft: 6,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semiBold,
    fontFamily: Fonts.semiBold,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  spacer: {
    flex: 1,
  },
  bottomWrapper: {
    paddingTop: 40,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 50,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Fonts.bold,
  },
  brandContainer: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
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
  socialButton: {
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    fontFamily: Fonts.semiBold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
  },
  terms: {
    textAlign: 'center',
    fontSize: Fonts.sizes.xs,
    marginTop: 16,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  link: {
    color: Colors.black,
    textDecorationLine: 'underline',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
  },
  registerLink: {
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
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  forgotPasswordText: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
    fontWeight: Fonts.weights.semiBold,
  },
});
