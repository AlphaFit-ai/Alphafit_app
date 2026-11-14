import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FEATURES } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { Button, PressableScale, Sheet, Text } from '../src/ui';

interface ProPlanModalProps {
  visible: boolean;
  onClose: () => void;
}

// Prices are shown as written until the purchase work (ROADMAP D1) sets real ones.
const PRICES = { monthly: '$9.99', yearly: '$49.99' };

type Plan = 'monthly' | 'yearly';

/**
 * The Pro plan sheet. Buying is not built (ROADMAP D1): the trial and purchase buttons stay disabled on
 * purpose, and only the plan choice and the feature list react.
 */
export const ProPlanModal: React.FC<ProPlanModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const c = tokens.color;
  const [plan, setPlan] = useState<Plan>('yearly');

  const common = [
    t('proPlan.features.customWorkouts'),
    t('proPlan.features.dietPlans'),
    t('proPlan.features.progressReports'),
  ];
  // The physique projection lines appear only while that feature is offered (ROADMAP D2).
  const projection = (key: string) => (FEATURES.projections ? [t(key)] : []);
  const features =
    plan === 'monthly'
      ? [...projection('proPlan.features.physiqueProjection'), ...common]
      : [
          ...projection('proPlan.features.physiqueProjectionFull'),
          ...common,
          t('proPlan.features.coachChat'),
          t('proPlan.features.badges'),
          t('proPlan.features.prioritySupport'),
        ];

  const planButton = (id: Plan, title: string, price: string) => {
    const active = plan === id;
    return (
      <PressableScale
        key={id}
        onPress={() => setPlan(id)}
        feedback
        accessibilityRole="radio"
        accessibilityLabel={`${title}, ${price}`}
        accessibilityState={{ selected: active, checked: active }}
        style={[
          styles.plan,
          {
            backgroundColor: c.surface,
            borderColor: active ? c.accent : c.border,
          },
        ]}
      >
        {id === 'yearly' ? (
          <View style={[styles.badge, { backgroundColor: c.accent }]}>
            <Text variant="caption" tone="onAccent" style={styles.badgeText}>
              {t('proPlan.popular')}
            </Text>
          </View>
        ) : null}
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="label" tone={active ? 'accent' : 'muted'}>
          {price}
        </Text>
      </PressableScale>
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t('common.close')}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: c.premium }]}>
          <Text variant="label" tone="onAccent" style={styles.heroBadge}>
            {t('proPlan.badge')}
          </Text>
          <Text variant="title" style={{ color: c.onPremium }}>
            {t('proPlan.titleLead')} {t('proPlan.titleRest')}
          </Text>
          <Text style={{ color: c.onPremium }}>{t('proPlan.subtitle')}</Text>
          <Text variant="label" style={{ color: c.onPremium }}>
            {t('proPlan.limitedOffer')}
          </Text>
        </View>

        <View style={styles.plans} accessibilityRole="radiogroup">
          {planButton(
            'monthly',
            t('proPlan.monthly'),
            t('proPlan.pricePerMonth', { price: PRICES.monthly })
          )}
          {planButton(
            'yearly',
            t('proPlan.yearly'),
            t('proPlan.pricePerYear', { price: PRICES.yearly })
          )}
        </View>
        <Text variant="caption" tone="subtle" style={styles.center}>
          {plan === 'monthly' ? t('proPlan.perMonth') : t('proPlan.perYear')}
          {plan === 'yearly' ? ` · ${t('proPlan.save', { percent: 25 })}` : ''}
        </Text>

        <View style={styles.features}>
          <View style={styles.featuresHeader}>
            <Ionicons name="flash" size={18} color={c.text} />
            <Text variant="subheading" accessibilityRole="header">
              {t('proPlan.premiumFeatures')}
            </Text>
          </View>
          {features.map((text) => (
            <View key={text} style={styles.feature}>
              <Ionicons name="checkmark-circle" size={22} color={c.successText} />
              <Text tone="muted" style={styles.featureText}>
                {text}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button variant="outline" title={t('proPlan.startTrial')} onPress={onClose} disabled />
          <Button
            title={t('proPlan.getPremium', {
              price:
                plan === 'monthly'
                  ? t('proPlan.priceMonthShort', { price: PRICES.monthly })
                  : t('proPlan.priceYearShort', { price: PRICES.yearly }),
            })}
            onPress={onClose}
            disabled
          />
        </View>
      </ScrollView>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  scroll: { flexShrink: 1 },
  hero: { borderRadius: 20, padding: 20, gap: 8 },
  heroBadge: { alignSelf: 'flex-start' },
  plans: { flexDirection: 'row', gap: 12, marginTop: 20 },
  plan: { flex: 1, borderWidth: 2, borderRadius: 16, padding: 16, gap: 4, alignItems: 'center' },
  badge: {
    position: 'absolute',
    top: -12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontWeight: '700' },
  center: { textAlign: 'center', marginTop: 8 },
  features: { marginTop: 20, gap: 12 },
  featuresHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { flex: 1 },
  actions: { gap: 12, marginTop: 24, marginBottom: 8 },
});
