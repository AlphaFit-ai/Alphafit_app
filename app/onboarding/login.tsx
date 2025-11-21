import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, GradientText, Input } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { updateOnboardingData } = useOnboarding();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

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

  const handleContinueWithGoogle = () => {
    updateOnboardingData({ authProvider: 'google' });
    router.push('/onboarding/source');
  };

  const handleContinueWithApple = () => {
    updateOnboardingData({ authProvider: 'apple' });
    router.push('/onboarding/source');
  };

  const handleContinueWithEmail = () => {
    if (!email) {
      setEmailError(t('welcome.invalidEmail'));
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(t('welcome.invalidEmail'));
      return;
    }
    setEmailError('');
    updateOnboardingData({ email, authProvider: 'email' });
    router.push('/onboarding/source');
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
            >
              <Image 
                source={require('../../assets/images/logo/google.png')} 
                style={styles.socialIcon}
              />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>{t('welcome.continueWithGoogle')}</Text>
            </TouchableOpacity>

            {/* Apple Button */}
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={handleContinueWithApple}
            >
              <Ionicons name="logo-apple" size={20} color={colors.icon} style={styles.socialIcon} />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>{t('welcome.continueWithApple')}</Text>
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
              style={{ marginBottom: 10 }}
            />

            {/* Continue Button */}
            <Button title={t('welcome.continue')} onPress={handleContinueWithEmail} />

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
    paddingVertical: 40,
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
});
