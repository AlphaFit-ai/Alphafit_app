import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { PressableScale } from '../src/ui/Pressable';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  /** No back button: the first screen of a flow. */
  hideBack?: boolean;
}

/** Back button and progress line at the top of a wizard step. */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  onBack,
  hideBack = false,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const progress = Math.min(100, (currentStep / totalSteps) * 100);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/onboarding/login');
    }
  };

  return (
    <View style={styles.container}>
      {hideBack ? (
        <View style={styles.backButton} />
      ) : (
        <PressableScale
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color={tokens.color.text} />
        </PressableScale>
      )}
      <View
        style={styles.progressWrapper}
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: totalSteps, now: currentStep }}
      >
        <View style={[styles.background, { backgroundColor: tokens.color.border }]}>
          <View
            style={[styles.progress, { width: `${progress}%`, backgroundColor: tokens.color.text }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progressWrapper: { flex: 1, justifyContent: 'center' },
  background: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progress: { height: '100%', borderRadius: 3 },
});
