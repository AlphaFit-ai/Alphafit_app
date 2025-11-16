import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LanguageSelector } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const currentLanguage = i18n.language || 'en';
  const languageNames: { [key: string]: string } = { en: 'English', es: 'Español', fr: 'Français' };

  const handleLanguageSelect = (language: { code: string; name: string; flag: string }) => {
    i18n.changeLanguage(language.code);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="language-outline" size={22} color={Colors.black} />
              </View>
              <Text style={styles.settingTitle}>{t('profile.language')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingRight}
              onPress={() => setShowLanguageSelector(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.settingValue}>{languageNames[currentLanguage]}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="moon-outline" size={22} color={Colors.black} />
              </View>
              <Text style={styles.settingTitle}>{t('profile.darkMode')}</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.gray[300], true: Colors.black }}
              thumbColor={Colors.white}
            />
          </View>
        </View>
      </ScrollView>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onSelect={handleLanguageSelect}
        selectedLanguage={currentLanguage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray[100],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.black,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
});
