import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';
import { logError } from '../../services/apiError';
import { Text, WheelPicker, WizardStep } from '../../src/ui';
import type { WheelItem } from '../../src/ui';

const range = (from: number, count: number, unit: string): WheelItem[] =>
  Array.from({ length: count }, (_, i) => ({
    key: String(from + i),
    label: `${from + i} ${unit}`,
  }));

// The values offered, built once. A wheel index is `value - first value`.
const CM_ITEMS = range(60, 191, 'cm');
const FEET_ITEMS = range(2, 7, 'ft');
const INCH_ITEMS = range(0, 12, 'in');
const KG_ITEMS = range(30, 171, 'kg');
const LB_ITEMS = range(60, 381, 'lb');

export default function HeightScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { onboardingData, updateOnboardingData, setCurrentStep } = useOnboarding();
  const { tokens } = useTheme();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();

  const [isMetric, setIsMetric] = useState(true);
  const [selectedFeet, setSelectedFeet] = useState(5);
  const [selectedInches, setSelectedInches] = useState(7);
  const [selectedCm, setSelectedCm] = useState(170);
  const [selectedLbs, setSelectedLbs] = useState(150);
  const [selectedKg, setSelectedKg] = useState(70);

  // The saved height and weight are where the wheels start when the question is opened to change them
  // (applied once; they may arrive after the first render).
  const seeded = useRef(false);
  const savedHeight = onboardingData.height;
  const savedWeight = onboardingData.weight;
  useEffect(() => {
    if (seeded.current || (!savedHeight && !savedWeight)) return;
    seeded.current = true;
    if (savedHeight?.unit === 'imperial' && savedHeight.feet !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- written before this React Compiler check (eslint-config-expo 58); it loads or syncs state on purpose. Refactor separately.
      setIsMetric(false);
      setSelectedFeet(Math.min(8, Math.max(2, savedHeight.feet)));
      setSelectedInches(Math.min(11, Math.max(0, savedHeight.inches ?? 0)));
    } else if (savedHeight?.cm) {
      setIsMetric(true);
      setSelectedCm(Math.min(250, Math.max(60, Math.round(savedHeight.cm))));
    }
    if (savedWeight?.kg) setSelectedKg(Math.min(200, Math.max(30, Math.round(savedWeight.kg))));
    if (savedWeight?.lbs) setSelectedLbs(Math.min(440, Math.max(60, Math.round(savedWeight.lbs))));
  }, [savedHeight, savedWeight]);

  const handleContinue = async () => {
    const heightData = isMetric
      ? { value: selectedCm, unit: 'metric' as const, cm: selectedCm }
      : {
          value: selectedFeet * 12 + selectedInches,
          unit: 'imperial' as const,
          feet: selectedFeet,
          inches: selectedInches,
        };

    const weightData = isMetric
      ? { value: selectedKg, unit: 'metric' as const, kg: selectedKg }
      : { value: selectedLbs, unit: 'imperial' as const, lbs: selectedLbs };

    updateOnboardingData({
      height: heightData,
      weight: weightData,
    });

    if (!isUpdatingFromProfile) {
      setCurrentStep(4);
    }

    // Save to backend in real-time. The user moves on even when saving fails (it is retried with
    // the next answer).
    try {
      await onboardingService.saveOnboardingData({
        height: heightData,
        weight: weightData,
      });
    } catch (error) {
      logError('onboarding.saveHeightWeight', error);
    }

    if (isUpdatingFromProfile) {
      navigateAfterUpdate();
    } else {
      router.push('/onboarding/fitness-level');
    }
  };

  const c = tokens.color;

  return (
    <WizardStep
      step={4}
      totalSteps={10}
      title={t('onboarding.height.title')}
      onContinue={handleContinue}
    >
      <View style={styles.switchRow}>
        <Text tone={isMetric ? 'subtle' : 'default'} variant={isMetric ? 'label' : 'bodyStrong'}>
          {t('onboarding.height.imperial')}
        </Text>
        <Switch
          value={isMetric}
          onValueChange={setIsMetric}
          accessibilityLabel={t('onboarding.height.metric')}
          trackColor={{ false: c.borderStrong, true: c.borderStrong }}
          thumbColor={c.action}
        />
        <Text tone={isMetric ? 'default' : 'subtle'} variant={isMetric ? 'bodyStrong' : 'label'}>
          {t('onboarding.height.metric')}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text variant="label" style={styles.label}>
            {t('onboarding.height.heightLabel')}
          </Text>
          {isMetric ? (
            <WheelPicker
              label={t('onboarding.height.heightLabel')}
              items={CM_ITEMS}
              selectedIndex={selectedCm - 60}
              onChange={(i) => setSelectedCm(60 + i)}
            />
          ) : (
            <View style={styles.pair}>
              <View style={styles.fill}>
                <WheelPicker
                  label={`${t('onboarding.height.heightLabel')} ft`}
                  items={FEET_ITEMS}
                  selectedIndex={selectedFeet - 2}
                  onChange={(i) => setSelectedFeet(2 + i)}
                />
              </View>
              <View style={styles.fill}>
                <WheelPicker
                  label={`${t('onboarding.height.heightLabel')} in`}
                  items={INCH_ITEMS}
                  selectedIndex={selectedInches}
                  onChange={setSelectedInches}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.column}>
          <Text variant="label" style={styles.label}>
            {t('onboarding.height.weightLabel')}
          </Text>
          {isMetric ? (
            <WheelPicker
              key="kg"
              label={t('onboarding.height.weightLabel')}
              items={KG_ITEMS}
              selectedIndex={selectedKg - 30}
              onChange={(i) => setSelectedKg(30 + i)}
            />
          ) : (
            <WheelPicker
              key="lb"
              label={t('onboarding.height.weightLabel')}
              items={LB_ITEMS}
              selectedIndex={selectedLbs - 60}
              onChange={(i) => setSelectedLbs(60 + i)}
            />
          )}
        </View>
      </View>
    </WizardStep>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 8 },
  pair: { flexDirection: 'row', gap: 8 },
  fill: { flex: 1 },
  label: { textAlign: 'center' },
});
