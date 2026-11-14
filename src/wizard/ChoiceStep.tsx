import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppImage } from '../ui/AppImage';
import { haptic } from '../ui/haptics';
import { OptionCard } from '../ui/OptionCard';
import { PressableScale } from '../ui/Pressable';
import { Text } from '../ui/Text';
import { WizardSkeleton } from '../ui/WizardSkeleton';
import { WizardStep } from '../ui/WizardStep';
import type { Choice, ChoiceStepConfig } from './flows';
import { questionNumber } from './flows';
import { useWizardFlow } from './useWizardFlow';

const LAST_QUESTION: Record<string, number> = { diet: 3, projection: 3 };

/**
 * A single-choice question, drawn from its config: the saved answer is preselected, Continue saves it
 * and moves on (or returns to the profile when the question is being edited), Back goes to the
 * previous question.
 */
export const ChoiceStep: React.FC<{ config: ChoiceStepConfig }> = ({ config }) => {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const flow = useWizardFlow(config);
  const [picked, setPicked] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  if (flow.loading) return <WizardSkeleton />;

  const stored = flow.saved[config.field];
  const savedValue = config.fromStored
    ? config.fromStored(stored)
    : typeof stored === 'string'
      ? stored
      : undefined;
  const selected = picked ?? savedValue;
  const { current, total } = questionNumber(config);
  const isLast = config.index === LAST_QUESTION[config.flow];

  const label = (option: Choice) =>
    option.labelKey ? t(option.labelKey, option.labelParams) : (option.label ?? option.value);

  const onContinue = async () => {
    if (selected === undefined || busy) return;
    setBusy(true);
    try {
      await flow.save({
        [config.field]: config.toStored ? config.toStored(selected) : selected,
      });
      haptic.confirm();
      flow.next();
    } finally {
      setBusy(false);
    }
  };

  const choose = (value: string) => setPicked(value);

  return (
    <WizardStep
      step={current}
      totalSteps={total}
      stepLabel={flow.editing ? undefined : t('wizard.stepOf', { current, total })}
      title={t(config.titleKey)}
      onBack={flow.back}
      hideBack={flow.hideBack}
      onContinue={onContinue}
      continueDisabled={selected === undefined}
      continueLoading={busy}
      continueLabel={isLast ? t('common.finish') : undefined}
      scroll
    >
      {config.image && config.layout !== 'tiles' ? (
        <AppImage
          source={config.image}
          contentFit="contain"
          noPlaceholder
          accessible={false}
          style={[styles.hero, { backgroundColor: 'transparent' }]}
        />
      ) : null}

      {config.layout === 'tiles' ? (
        <View style={styles.grid} accessibilityRole="radiogroup">
          {config.options.map((option) => {
            const active = selected === option.value;
            return (
              <PressableScale
                key={option.value}
                onPress={() => choose(option.value)}
                feedback
                accessibilityRole="radio"
                accessibilityLabel={label(option)}
                accessibilityState={{ selected: active, checked: active }}
                style={[
                  styles.tile,
                  { borderColor: active ? tokens.color.accent : tokens.color.border },
                ]}
              >
                {option.image ? (
                  <AppImage source={option.image} accessible={false} style={styles.tileImage} />
                ) : null}
                <LinearGradient
                  colors={['transparent', 'rgba(0, 0, 0, 0.72)']}
                  style={styles.scrim}
                >
                  <Text variant="subheading" style={styles.tileTitle}>
                    {label(option)}
                  </Text>
                </LinearGradient>
                {active ? (
                  <View style={[styles.check, { backgroundColor: tokens.color.accent }]}>
                    <Ionicons name="checkmark" size={18} color={tokens.color.onAccent} />
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </View>
      ) : config.layout === 'numbers' ? (
        <View style={styles.grid} accessibilityRole="radiogroup">
          {config.options.map((option) => {
            const active = selected === option.value;
            return (
              <PressableScale
                key={option.value}
                onPress={() => choose(option.value)}
                feedback
                accessibilityRole="radio"
                accessibilityLabel={label(option)}
                accessibilityState={{ selected: active, checked: active }}
                style={[
                  styles.number,
                  {
                    backgroundColor: active ? tokens.color.action : tokens.color.surfaceMuted,
                    borderColor: active ? tokens.color.action : tokens.color.border,
                  },
                ]}
              >
                <Text
                  variant="heading"
                  style={{ color: active ? tokens.color.onAction : tokens.color.text }}
                >
                  {label(option)}
                </Text>
              </PressableScale>
            );
          })}
        </View>
      ) : (
        <View accessibilityRole="radiogroup">
          {config.options.map((option) => (
            <OptionCard
              key={option.value}
              title={label(option)}
              selected={selected === option.value}
              onPress={() => choose(option.value)}
              icon={
                option.icon ? (
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={selected === option.value ? tokens.color.onAction : tokens.color.text}
                  />
                ) : undefined
              }
            />
          ))}
        </View>
      )}
    </WizardStep>
  );
};

const styles = StyleSheet.create({
  hero: { width: '100%', height: 150, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '48%', height: 168, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
  tileImage: { width: '100%', height: '100%' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 14,
  },
  tileTitle: { color: '#FFFFFF' },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    width: '48%',
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
