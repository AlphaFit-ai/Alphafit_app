import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FEATURES, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

/** Question ids; the text is in the translation files under `faq.items.<id>`. */
const FAQ_IDS = [
  'trackWorkouts',
  'customizeMeals',
  'physiqueProjection',
  'proFeatures',
  'cancelSubscription',
  'dataSecurity',
  'syncDevices',
  'bodyScanAccuracy',
  'reportBug',
  'changeGoals',
] as const;

/** The questions shown: the physique-projection one only while that feature is offered (D2). */
const VISIBLE_FAQ_IDS = FAQ_IDS.filter((id) => FEATURES.projections || id !== 'physiqueProjection');

/** Where the questions say to write (kept as it was; the owner decides the domain, ROADMAP D4). */
const SUPPORT_EMAIL = 'support@alphafitai.com';

export default function FAQScreen() {
  const { t } = useTranslation();
  const { colors, tokens } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>{t('faq.intro')}</Text>

          {VISIBLE_FAQ_IDS.map((id, index) => (
            <TouchableOpacity
              key={id}
              style={[
                styles.faqCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => toggleExpanded(index)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t(`faq.items.${id}.question`)}
              accessibilityState={{ expanded: expandedIndex === index }}
            >
              <View style={styles.questionRow}>
                <Text style={[styles.question, { color: colors.text }]}>
                  {t(`faq.items.${id}.question`)}
                </Text>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.icon}
                />
              </View>

              {expandedIndex === index && (
                <Text style={[styles.answer, { color: colors.textSecondary }]}>
                  {t(`faq.items.${id}.answer`, { email: SUPPORT_EMAIL })}
                </Text>
              )}
            </TouchableOpacity>
          ))}

          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: tokens.color.surfaceMuted,
              },
            ]}
          >
            <Ionicons name="help-circle-outline" size={32} color={Colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              {t('faq.stillHaveQuestions')}
            </Text>
            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
              {t('faq.contactUs', { email: SUPPORT_EMAIL })}
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
  headerText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    marginBottom: 24,
  },
  faqCard: {
    borderRadius: Spacing.radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  answer: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    lineHeight: 24,
    marginTop: 12,
  },
  contactCard: {
    borderRadius: Spacing.radius.lg,
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
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
