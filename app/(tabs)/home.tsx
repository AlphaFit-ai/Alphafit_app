import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('tabs.home')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('tabs.homeSubtitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
