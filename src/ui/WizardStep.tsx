import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { ProgressBar } from '../../components/ProgressBar';
import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

export interface WizardStepProps {
  step: number;
  totalSteps: number;
  title: string;
  /** Short line under the title. */
  subtitle?: string;
  /** Back button action; defaults to the router. */
  onBack?: () => void;
  /** No back button (the first question of a flow that lives in a tab). */
  hideBack?: boolean;
  /** "Step 2 of 4" above the heading; omit while editing one answer. */
  stepLabel?: string;
  onContinue: () => void;
  continueLabel?: string;
  /** The Continue button is greyed until the user has answered. */
  continueDisabled?: boolean;
  continueLoading?: boolean;
  /** The body scrolls (long option lists). */
  scroll?: boolean;
  children: React.ReactNode;
}

/**
 * One question per screen: back and progress on top, the heading directly under them, the answer
 * area, and a Continue button pinned at the bottom. Every wizard step uses it, so headings sit at
 * the same height on every screen (no vertical centring).
 */
export const WizardStep: React.FC<WizardStepProps> = ({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  hideBack,
  stepLabel,
  onContinue,
  continueLabel,
  continueDisabled,
  continueLoading,
  scroll = false,
  children,
}) => {
  const { t } = useTranslation();
  return (
    <Screen
      scroll={scroll}
      header={
        <ProgressBar
          currentStep={step}
          totalSteps={totalSteps}
          onBack={onBack}
          hideBack={hideBack}
        />
      }
      footer={
        <Button
          title={continueLabel ?? t('onboarding.continue')}
          onPress={onContinue}
          disabled={continueDisabled}
          loading={continueLoading}
        />
      }
    >
      <View style={styles.heading}>
        {stepLabel ? (
          <Text variant="label" tone="muted">
            {stepLabel}
          </Text>
        ) : null}
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  heading: { gap: 8, paddingTop: 16, paddingBottom: 24 },
  body: { gap: 12 },
});
