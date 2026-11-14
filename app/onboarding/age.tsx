import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';
import {
  BIRTH_YEAR_COUNT,
  getBirthYearRange,
  normalizeStoredMonth,
  toStoredMonth,
} from '../../services/dateOfBirth';
import { Text, WheelPicker, WizardStep } from '../../src/ui';
import type { WheelItem } from '../../src/ui';

// The years offered depend on today's date, not on a fixed 2015.
const { maxYear: MAX_BIRTH_YEAR, defaultYear: DEFAULT_BIRTH_YEAR } = getBirthYearRange();

const MONTH_KEYS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

const YEAR_ITEMS: WheelItem[] = Array.from({ length: BIRTH_YEAR_COUNT }, (_, i) => ({
  key: String(MAX_BIRTH_YEAR - i),
  label: String(MAX_BIRTH_YEAR - i),
}));

export default function AgeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();

  // Positions in the wheels: month 0 = January, day 0 = the 1st, year 0 = the newest year.
  const [monthIndex, setMonthIndex] = useState(4);
  const [dayIndex, setDayIndex] = useState(3);
  const [yearIndex, setYearIndex] = useState(MAX_BIRTH_YEAR - DEFAULT_BIRTH_YEAR);

  // When the question is opened to change the answer, the saved date is where the wheels start. It
  // may arrive after the first render, so it is applied once, until the user has moved a wheel.
  const saved = onboardingData.dateOfBirth;
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !saved) return;
    seeded.current = true;
    setMonthIndex(normalizeStoredMonth(saved.month) - 1);
    setDayIndex(Math.max(0, saved.day - 1));
    setYearIndex(Math.min(BIRTH_YEAR_COUNT - 1, Math.max(0, MAX_BIRTH_YEAR - saved.year)));
  }, [saved]);

  const selectedYear = MAX_BIRTH_YEAR - yearIndex;
  const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
  // The day follows the month: 31 January, then February, gives the last day of February.
  const safeDayIndex = Math.min(dayIndex, daysInMonth - 1);

  const monthItems = useMemo<WheelItem[]>(
    () => MONTH_KEYS.map((key) => ({ key, label: t(`onboarding.age.${key}`) })),
    [t]
  );
  const dayItems = useMemo<WheelItem[]>(
    () =>
      Array.from({ length: daysInMonth }, (_, i) => ({ key: String(i + 1), label: String(i + 1) })),
    [daysInMonth]
  );

  const handleContinue = async () => {
    const dateOfBirth = {
      month: toStoredMonth(monthIndex),
      day: safeDayIndex + 1,
      year: selectedYear,
    };

    updateOnboardingData({ dateOfBirth });
    setCurrentStep(2);

    // Save to backend in real-time
    try {
      await onboardingService.saveOnboardingData({ dateOfBirth });
    } catch (error) {
      logError('onboarding.saveAge', error);
    }

    router.push('/onboarding/gender');
  };

  return (
    <WizardStep
      step={2}
      totalSteps={10}
      title={t('onboarding.age.title')}
      onContinue={handleContinue}
    >
      <View style={styles.wheels}>
        <View style={styles.column}>
          <Text variant="label" style={styles.label}>
            {t('onboarding.age.month')}
          </Text>
          <WheelPicker
            label={t('onboarding.age.month')}
            items={monthItems}
            selectedIndex={monthIndex}
            onChange={(i) => {
              seeded.current = true;
              setMonthIndex(i);
            }}
          />
        </View>
        <View style={styles.column}>
          <Text variant="label" style={styles.label}>
            {t('onboarding.age.day')}
          </Text>
          <WheelPicker
            label={t('onboarding.age.day')}
            items={dayItems}
            selectedIndex={safeDayIndex}
            onChange={(i) => {
              seeded.current = true;
              setDayIndex(i);
            }}
          />
        </View>
        <View style={styles.column}>
          <Text variant="label" style={styles.label}>
            {t('onboarding.age.year')}
          </Text>
          <WheelPicker
            label={t('onboarding.age.year')}
            items={YEAR_ITEMS}
            selectedIndex={yearIndex}
            onChange={(i) => {
              seeded.current = true;
              setYearIndex(i);
            }}
          />
        </View>
      </View>
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  wheels: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 8 },
  label: { textAlign: 'center' },
});
