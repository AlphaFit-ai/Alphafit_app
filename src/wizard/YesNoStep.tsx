import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { AppImage } from '../ui/AppImage';
import { haptic } from '../ui/haptics';
import { Input } from '../ui/Input';
import { OptionCard } from '../ui/OptionCard';
import { WizardSkeleton } from '../ui/WizardSkeleton';
import { WizardStep } from '../ui/WizardStep';
import type { YesNoStepConfig } from './flows';
import { questionNumber } from './flows';
import { useWizardFlow } from './useWizardFlow';

/**
 * "Do you have X?" with a free-text answer when yes. Saved the way the api expects: the flag and the
 * text together, the text emptied on "no". Continue needs "no", or "yes" with something typed.
 */
export const YesNoStep: React.FC<{ config: YesNoStepConfig }> = ({ config }) => {
  const { t } = useTranslation();
  const flow = useWizardFlow(config);
  const [answer, setAnswer] = useState<boolean | undefined>();
  const [typed, setTyped] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  if (flow.loading) return <WizardSkeleton />;

  const savedFlag = flow.saved[config.flagField];
  const savedText = flow.saved[config.textField];
  const yes = answer ?? (typeof savedFlag === 'boolean' ? savedFlag : undefined);
  const text = typed ?? (typeof savedText === 'string' ? savedText : '');
  const { current, total } = questionNumber(config);
  const canContinue = yes === false || (yes === true && text.trim().length > 0);
  const isLast = config.index === 3;

  const onContinue = async () => {
    if (!canContinue || busy) return;
    setBusy(true);
    try {
      await flow.save(
        yes
          ? { [config.flagField]: true, [config.textField]: text.trim() }
          : { [config.flagField]: false, [config.textField]: '' }
      );
      haptic.confirm();
      flow.next();
    } finally {
      setBusy(false);
    }
  };

  return (
    <WizardStep
      step={current}
      totalSteps={total}
      stepLabel={flow.editing ? undefined : t('wizard.stepOf', { current, total })}
      title={t(config.titleKey)}
      onBack={flow.back}
      hideBack={flow.hideBack}
      onContinue={onContinue}
      continueDisabled={!canContinue}
      continueLoading={busy}
      continueLabel={isLast ? t('common.finish') : undefined}
      scroll
    >
      {config.image ? (
        <AppImage
          source={config.image}
          contentFit="contain"
          noPlaceholder
          accessible={false}
          style={[styles.hero, { backgroundColor: 'transparent' }]}
        />
      ) : null}
      <View style={styles.row} accessibilityRole="radiogroup">
        <View style={styles.half}>
          <OptionCard
            title={t(config.yesKey)}
            selected={yes === true}
            onPress={() => setAnswer(true)}
          />
        </View>
        <View style={styles.half}>
          <OptionCard
            title={t(config.noKey)}
            selected={yes === false}
            onPress={() => setAnswer(false)}
          />
        </View>
      </View>
      {yes === true ? (
        <Input
          label={t(config.titleKey)}
          accessibilityLabel={t(config.placeholderKey)}
          placeholder={t(config.placeholderKey)}
          value={text}
          onChangeText={setTyped}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.area}
        />
      ) : null}
    </WizardStep>
  );
};

const styles = StyleSheet.create({
  hero: { width: '100%', height: 150, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  area: { minHeight: 110 },
});
