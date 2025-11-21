import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: 'How do I track my workouts?',
      answer: 'You can track your workouts by going to the Workouts tab and selecting your desired workout plan. Follow the exercises and mark them as complete as you go.',
    },
    {
      question: 'Can I customize my meal plans?',
      answer: 'Yes! Navigate to the Diet tab and use the Smart Diet Plan feature. You can scan foods, set your dietary preferences, and our AI will generate personalized meal plans for you.',
    },
    {
      question: 'How does the AI Physique Projection work?',
      answer: 'Our AI analyzes your current photos and profile data (age, fitness level, goals) to project how your physique could transform over time with consistent training and nutrition.',
    },
    {
      question: 'What features are included in the Pro plan?',
      answer: 'Pro plan includes: unlimited AI-generated workouts, advanced physique projections, personalized meal plans, progress analytics, priority support, and ad-free experience.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can manage your subscription in your device settings under Subscriptions, or contact our support team at support@alphafitai.com for assistance.',
    },
    {
      question: 'Is my data secure and private?',
      answer: 'Absolutely! We use bank-level encryption to protect your data. Your photos, progress, and personal information are stored securely and never shared with third parties without your consent.',
    },
    {
      question: 'Can I sync data across devices?',
      answer: 'Yes, your data automatically syncs across all devices when you\'re logged in with the same account.',
    },
    {
      question: 'How accurate is the body scan feature?',
      answer: 'Our AI body scan uses advanced computer vision models trained on thousands of physiques. While highly accurate, results are estimates and should be used as guidance alongside professional advice.',
    },
    {
      question: 'What should I do if I encounter a bug?',
      answer: 'Please contact our support team at support@alphafitai.com with details about the issue. Include screenshots if possible, and we\'ll work quickly to resolve it.',
    },
    {
      question: 'Can I change my fitness goals after setup?',
      answer: 'Yes! You can update your goals, preferences, and profile information anytime from the Profile tab > Account Details.',
    },
  ];

  const toggleExpanded = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={[styles.headerText, { color: colors.textSecondary }]}>
            Find answers to commonly asked questions about AlphaFit AI
          </Text>

          {faqItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.faqCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => toggleExpanded(index)}
              activeOpacity={0.7}
            >
              <View style={styles.questionRow}>
                <Text style={[styles.question, { color: colors.text }]}>
                  {item.question}
                </Text>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.icon}
                />
              </View>

              {expandedIndex === index && (
                <Text style={[styles.answer, { color: colors.textSecondary }]}>
                  {item.answer}
                </Text>
              )}
            </TouchableOpacity>
          ))}

          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
              },
            ]}
          >
            <Ionicons name="help-circle-outline" size={32} color={Colors.primary} />
            <Text style={[styles.contactTitle, { color: colors.text }]}>
              Still have questions?
            </Text>
            <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
              Contact us at support@alphafitai.com
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
