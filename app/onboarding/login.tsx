import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, GradientText, Input } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';

export default function LoginScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { updateOnboardingData } = useOnboarding();
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Language Switcher */}
      <View style={styles.languageContainer}>
        <TouchableOpacity style={styles.languageButton} onPress={toggleLanguageMenu}>
          <Ionicons name="language" size={24} color={Colors.black} />
          <Text style={styles.languageText}>{i18n.language.toUpperCase()}</Text>
        </TouchableOpacity>
        
        {showLanguageMenu && (
          <View style={styles.languageMenu}>
            <TouchableOpacity 
              style={[styles.languageOption, i18n.language === 'en' && styles.languageOptionActive]} 
              onPress={() => selectLanguage('en')}
            >
              <Text style={[styles.languageOptionText, i18n.language === 'en' && styles.languageOptionTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.languageOption, i18n.language === 'es' && styles.languageOptionActive]} 
              onPress={() => selectLanguage('es')}
            >
              <Text style={[styles.languageOptionText, i18n.language === 'es' && styles.languageOptionTextActive]}>Español</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.languageOption, i18n.language === 'fr' && styles.languageOptionActive]} 
              onPress={() => selectLanguage('fr')}
            >
              <Text style={[styles.languageOptionText, i18n.language === 'fr' && styles.languageOptionTextActive]}>Français</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.spacer} />
        
        <View style={styles.bottomWrapper}>
          <View style={styles.header}>
            <Text style={styles.welcomeText}>{t('welcome.title')}</Text>
            <GradientText text="FORGE AI" style={styles.brandContainer} />
            <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
          </View>

          <View style={styles.content}>
            {/* Google Button */}
            <TouchableOpacity style={styles.socialButton} onPress={handleContinueWithGoogle}>
              <Image 
                source={require('../../assets/images/logo/google.png')} 
                style={styles.socialIcon}
              />
              <Text style={styles.socialButtonText}>{t('welcome.continueWithGoogle')}</Text>
            </TouchableOpacity>

            {/* Apple Button */}
            <TouchableOpacity style={styles.socialButton} onPress={handleContinueWithApple}>
              <Ionicons name="logo-apple" size={20} color={Colors.black} style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>{t('welcome.continueWithApple')}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('welcome.or')}</Text>
              <View style={styles.dividerLine} />
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
            <Text style={styles.terms}>{t('welcome.terms')}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  languageContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
  },
  languageMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[300],
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
    borderBottomColor: Colors.gray[200],
  },
  languageOptionActive: {
    backgroundColor: Colors.gray[50],
  },
  languageOptionText: {
    fontSize: Fonts.sizes.base,
    color: Colors.black,
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
    color: Colors.black,
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
    color: Colors.black,
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
    color: Colors.textSecondary,
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
    borderColor: Colors.gray[300],
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: Colors.white,
  },
  socialIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.black,
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
    backgroundColor: Colors.gray[300],
  },
  dividerText: {
    marginHorizontal: 12,
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
  },
  terms: {
    textAlign: 'center',
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 16,
    lineHeight: 18,
    fontFamily: Fonts.regular,
  },
  link: {
    color: Colors.black,
    textDecorationLine: 'underline',
  },
});
