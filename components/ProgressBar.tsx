import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, onBack }) => {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const progress = (currentStep / totalSteps) * 100;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.progressWrapper}>
        <View style={[styles.background, { backgroundColor: isDarkMode ? Colors.gray[700] : Colors.gray[200] }]}>
          <View style={[styles.progress, { width: `${progress}%`, backgroundColor: colors.text }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    paddingVertical: 8,
  },
  progressWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  background: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: Colors.black,
    borderRadius: 2,
  },
});
