import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { logError } from '../../services/apiError';

interface SupportSection {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  content: string;
  action: {
    label: string;
    url: string;
  };
}

/** Where the support screen says to write (kept as it was; the owner decides the domain, ROADMAP D4). */
const SUPPORT_EMAIL = 'support@alphafit-ai.com';

function openUrl(url: string) {
  Linking.openURL(url).catch((error) => logError('help.openUrl', error));
}

export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const { colors, tokens } = useTheme();

  const sections: SupportSection[] = [
    {
      icon: 'help-circle-outline',
      title: t('profile.faq'),
      content: t('help.faqContent'),
      action: { label: t('help.faqAction'), url: 'https://alphafit-ai.com/faq.html' },
    },
    {
      icon: 'mail-outline',
      title: t('profile.contact'),
      content: t('help.contactContent'),
      action: { label: t('help.contactAction'), url: 'https://alphafit-ai.com/contact.html' },
    },
    {
      icon: 'shield-checkmark-outline',
      title: t('profile.privacyPolicy'),
      content: t('help.privacyContent'),
      action: {
        label: t('help.privacyAction'),
        url: 'https://alphafit-ai.com/privacy-policy.html',
      },
    },
    {
      icon: 'document-text-outline',
      title: t('profile.termsOfService'),
      content: t('help.termsContent'),
      action: {
        label: t('help.termsAction'),
        url: 'https://alphafit-ai.com/terms-of-service.html',
      },
    },
    {
      icon: 'trash-outline',
      title: t('profile.deleteAccount'),
      content: t('help.deleteContent'),
      action: { label: t('help.deleteAction'), url: 'https://alphafit-ai.com/delete-account.html' },
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {sections.map((section) => (
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
                <View style={[styles.iconContainer, { backgroundColor: tokens.color.accentSoft }]}>
                  <Ionicons name={section.icon} size={24} color={Colors.primary} />
                </View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              </View>

              <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
                {section.content}
              </Text>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: Colors.primary }]}
                onPress={() => openUrl(section.action.url)}
                activeOpacity={0.8}
                accessibilityRole="link"
                accessibilityLabel={`${section.title}: ${section.action.label}`}
              >
                <Text style={styles.actionButtonText}>{section.action.label}</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.gray[900]} />
              </TouchableOpacity>
            </View>
          ))}

          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: tokens.color.surfaceMuted,
              },
            ]}
          >
            <Ionicons name="mail-outline" size={24} color={Colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              {t('help.stillNeedHelp')}
            </Text>
            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
              {SUPPORT_EMAIL}
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
    color: Colors.gray[900],
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
