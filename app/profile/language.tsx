import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

type Language = 'en' | 'es' | 'fr';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (i18n.language as Language) || 'en'
  );

  const handleLanguageChange = async (langCode: Language) => {
    setSelectedLanguage(langCode);
    await i18n.changeLanguage(langCode);
    setTimeout(() => {
      router.back();
    }, 300);
  };

  return (
    <SafeAreaView style={[SharedStyles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={SharedStyles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={colors.icon} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContent}>
          <Text style={[SharedStyles.title, { color: colors.text }]}>{t('profile.language')}</Text>

          <View style={styles.languageList}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  selectedLanguage === language.code && styles.languageItemActive,
                ]}
                onPress={() => handleLanguageChange(language.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageLeft}>
                  <Text style={styles.flag}>{language.flag}</Text>
                  <View style={styles.languageText}>
                    <Text style={[styles.languageName, { color: colors.text }]}>{language.name}</Text>
                    <Text style={styles.languageNative}>{language.nativeName}</Text>
                  </View>
                </View>
                {selectedLanguage === language.code && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  innerContent: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.gray[200],
  },
  languageItemActive: {
    borderColor: Colors.black,
    backgroundColor: Colors.gray[50],
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flag: {
    fontSize: 32,
  },
  languageText: {
    gap: 2,
  },
  languageName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
  },
  languageNative: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
});
