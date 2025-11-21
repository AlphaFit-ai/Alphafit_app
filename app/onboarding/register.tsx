import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, GradientText, Input } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

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

  const handleRegister = () => {
    if (!validateForm()) {
      return;
    }

    if (!agreedToTerms) {
      // Show alert or error
      return;
    }

    // Update onboarding data
    updateOnboardingData({
      fullName: formData.fullName,
      email: formData.email,
      authProvider: 'email',
    });

    // Navigate to next onboarding step
    router.push('/onboarding/source');
  };

  const handleBackToLogin = () => {
    router.back();
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
              placeholder={t('register.fullNamePlaceholder', 'John Doe')}
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
              title={t('register.createAccount', 'Create Account')} 
              onPress={handleRegister}
              disabled={!agreedToTerms}
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
    paddingVertical: 40,
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
});
