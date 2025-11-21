import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

interface SupportSection {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  content: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();

  const sections: SupportSection[] = [
    {
      icon: 'help-circle-outline',
      title: t('profile.support', 'Support'),
      content: 'Need help? Our support team is here for you 24/7. Contact us for any questions, technical issues, or feedback about the app.',
      action: {
        label: 'Contact Support',
        onPress: () => Linking.openURL('mailto:support@forgeai.com'),
      },
    },
    {
      icon: 'shield-checkmark-outline',
      title: t('profile.privacyPolicy', 'Privacy Policy'),
      content: 'We take your privacy seriously. Your personal data is encrypted and securely stored. We never share your information with third parties without your consent. Your fitness data, photos, and progress are kept confidential and used only to improve your experience.',
      action: {
        label: 'Read Full Policy',
        onPress: () => Linking.openURL('https://forgeai.com/privacy'),
      },
    },
    {
      icon: 'document-text-outline',
      title: t('profile.termsOfService', 'Terms of Service'),
      content: 'By using Forge AI, you agree to our terms of service. This includes proper use of the app, subscription terms, and community guidelines. We reserve the right to update these terms as needed to improve our service.',
      action: {
        label: 'Read Full Terms',
        onPress: () => Linking.openURL('https://forgeai.com/terms'),
      },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {sections.map((section, index) => (
            <View
              key={section.title}
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.primary + '15' },
                  ]}
                >
                  <Ionicons name={section.icon} size={24} color={Colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
              </View>

              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {section.content}
              </Text>

              {section.action && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                  onPress={section.action.onPress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>{section.action.label}</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
              },
            ]}
          >
            <Ionicons name="mail-outline" size={24} color={Colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              Still need help?
            </Text>
            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
              support@forgeai.com
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 20,
  },
  sectionCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
    flex: 1,
  },
  sectionContent: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    lineHeight: 24,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Spacing.radius.md,
    gap: 8,
  },
  actionButtonText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  contactCard: {
    borderRadius: Spacing.radius.lg,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  contactTitle: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    marginTop: 12,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
  },
});
