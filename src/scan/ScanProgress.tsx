import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { ScanStage } from '../../services/foodScanService';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';

/** After this many seconds the screen admits the scan is slow and says the user can wait or cancel. */
export const SLOW_AFTER_SECONDS = 20;

type StepState = 'done' | 'active' | 'todo';

const ORDER: ScanStage[] = ['uploading', 'analyzing', 'complete'];

/** The state of each of the three steps for the stage the scan reports. Exported for the tests. */
export function stepStates(stage: ScanStage): StepState[] {
  const at = ORDER.indexOf(stage);
  return ORDER.map((_, index) => (index < at ? 'done' : index === at ? 'active' : 'todo'));
}

interface ScanProgressProps {
  stage: ScanStage;
  seconds: number;
  onCancel: () => void;
}

/**
 * What is really happening during a photo scan: uploading, finding the foods (the long part, polled
 * from the api), adding up. Each step is shown as waiting, running or finished, the time so far is
 * visible, and after a while the screen says it is slow. Cancel is always there.
 */
export function ScanProgress({ stage, seconds, onCancel }: ScanProgressProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const c = tokens.color;
  const states = stepStates(stage);
  const labels = [t('scan.step.upload'), t('scan.step.analyze'), t('scan.step.done')];

  return (
    <View
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.header}>
        <Text variant="heading" accessibilityRole="header">
          {t('scan.progressTitle')}
        </Text>
        <Text variant="label" tone="muted">
          {`${seconds} s`}
        </Text>
      </View>
      {labels.map((label, index) => {
        const state = states[index];
        return (
          <View
            key={label}
            style={styles.step}
            accessible
            accessibilityLabel={label}
            accessibilityState={{ busy: state === 'active', checked: state === 'done' }}
          >
            {state === 'done' ? (
              <Ionicons name="checkmark-circle" size={24} color={c.successText} />
            ) : state === 'active' ? (
              <ActivityIndicator size="small" color={c.accent} style={styles.spinner} />
            ) : (
              <Ionicons name="ellipse-outline" size={24} color={c.textSubtle} />
            )}
            <Text
              tone={state === 'todo' ? 'subtle' : 'default'}
              variant={state === 'active' ? 'bodyStrong' : 'body'}
            >
              {label}
            </Text>
          </View>
        );
      })}
      {seconds >= SLOW_AFTER_SECONDS ? (
        <Text variant="caption" tone="warning">
          {t('scan.slow')}
        </Text>
      ) : null}
      <Button variant="outline" size="medium" title={t('scan.cancel')} onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 },
  spinner: { width: 24, height: 24 },
});
