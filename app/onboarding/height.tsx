import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button, ProgressBar } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';
import { useProfileUpdateNavigation } from '../../hooks/useProfileUpdateNavigation';
import { onboardingService } from '../../services';

export default function HeightScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const { colors, isDarkMode } = useTheme();
  const { navigateAfterUpdate, isUpdatingFromProfile } = useProfileUpdateNavigation();
  
  const [isMetric, setIsMetric] = useState(true);
  const [selectedFeet, setSelectedFeet] = useState(5);
  const [selectedInches, setSelectedInches] = useState(7);
  const [selectedCm, setSelectedCm] = useState(170);
  const [selectedLbs, setSelectedLbs] = useState(150);
  const [selectedKg, setSelectedKg] = useState(70);

  const ITEM_HEIGHT = 50;

  const cmScrollRef = useRef<ScrollView>(null);
  const feetScrollRef = useRef<ScrollView>(null);
  const inchesScrollRef = useRef<ScrollView>(null);
  const weightScrollRef = useRef<ScrollView>(null);

  // Scroll to initial positions after mount or unit change
  React.useEffect(() => {
    setTimeout(() => {
      if (isMetric) {
        cmScrollRef.current?.scrollTo({ y: (selectedCm - 60) * ITEM_HEIGHT, animated: false });
        weightScrollRef.current?.scrollTo({ y: (selectedKg - 30) * ITEM_HEIGHT, animated: false });
      } else {
        feetScrollRef.current?.scrollTo({ y: (selectedFeet - 2) * ITEM_HEIGHT, animated: false });
        inchesScrollRef.current?.scrollTo({ y: selectedInches * ITEM_HEIGHT, animated: false });
        weightScrollRef.current?.scrollTo({ y: (selectedLbs - 60) * ITEM_HEIGHT, animated: false });
      }
    }, 100);
  }, [isMetric]);

  const handleCmScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    const newCm = Math.max(60, Math.min(250, index + 60));
    setSelectedCm(newCm);
    
    // Snap to position on web
    if (Platform.OS === 'web') {
      setTimeout(() => {
        cmScrollRef.current?.scrollTo({ y: (newCm - 60) * ITEM_HEIGHT, animated: true });
      }, 50);
    }
  };

  const handleFeetScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    const newFeet = Math.max(2, Math.min(8, index + 2));
    setSelectedFeet(newFeet);
    
    // Snap to position on web
    if (Platform.OS === 'web') {
      setTimeout(() => {
        feetScrollRef.current?.scrollTo({ y: (newFeet - 2) * ITEM_HEIGHT, animated: true });
      }, 50);
    }
  };

  const handleInchesScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    const newInches = Math.max(0, Math.min(11, index));
    setSelectedInches(newInches);
    
    // Snap to position on web
    if (Platform.OS === 'web') {
      setTimeout(() => {
        inchesScrollRef.current?.scrollTo({ y: newInches * ITEM_HEIGHT, animated: true });
      }, 50);
    }
  };

  const handleWeightScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    if (isMetric) {
      const newKg = Math.max(30, Math.min(200, index + 30));
      setSelectedKg(newKg);
      
      // Snap to position on web
      if (Platform.OS === 'web') {
        setTimeout(() => {
          weightScrollRef.current?.scrollTo({ y: (newKg - 30) * ITEM_HEIGHT, animated: true });
        }, 50);
      }
    } else {
      const newLbs = Math.max(60, Math.min(440, index + 60));
      setSelectedLbs(newLbs);
      
      // Snap to position on web
      if (Platform.OS === 'web') {
        setTimeout(() => {
          weightScrollRef.current?.scrollTo({ y: (newLbs - 60) * ITEM_HEIGHT, animated: true });
        }, 50);
      }
    }
  };

  const handleContinue = async () => {
    const heightData = isMetric
      ? { value: selectedCm, unit: 'metric' as const, cm: selectedCm }
      : { value: selectedFeet * 12 + selectedInches, unit: 'imperial' as const, feet: selectedFeet, inches: selectedInches };
    
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
    
    // Save to backend in real-time
    try {
      await onboardingService.saveOnboardingData({
        height: heightData,
        weight: weightData,
      });
      
      // Navigate based on context
      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        router.push('/onboarding/fitness-level');
      }
    } catch (error) {
      console.error('Failed to save height/weight:', error);
      // Still navigate even on error
      if (isUpdatingFromProfile) {
        navigateAfterUpdate();
      } else {
        router.push('/onboarding/fitness-level');
      }
    }
  };  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ProgressBar currentStep={4} totalSteps={10} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.height.title')}</Text>

        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, !isMetric && styles.switchLabelActive, { color: !isMetric ? colors.text : colors.textSecondary }]}>{t('onboarding.height.imperial')}</Text>
          <Switch
            value={isMetric}
            onValueChange={setIsMetric}
            trackColor={{ false: Colors.gray[300], true: Colors.gray[300] }}
            thumbColor={isDarkMode ? Colors.white : Colors.black}
          />
          <Text style={[styles.switchLabel, isMetric && styles.switchLabelActive, { color: isMetric ? colors.text : colors.textSecondary }]}>{t('onboarding.height.metric')}</Text>
        </View>

        <View style={styles.pickerRow}>
          <View style={styles.column}>
            <Text style={[styles.columnLabel, { color: colors.text }]}>{t('onboarding.height.heightLabel')}</Text>
            <View style={styles.pickerContainer}>
              {isMetric ? (
                <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}>
                  <View style={[styles.highlightBar, { borderColor: isDarkMode ? Colors.gray[600] : Colors.gray[300] }]} />
                  <ScrollView
                    ref={cmScrollRef}
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={Platform.OS === 'web' ? undefined : ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={handleCmScroll}
                    onScrollEndDrag={handleCmScroll}
                    {...(Platform.OS === 'web' && { onScroll: handleCmScroll, scrollEventThrottle: 16 })}
                  >
                    {Array.from({ length: 191 }, (_, i) => i + 60).map((cm) => (
                      <View key={cm} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                        <Text style={[
                          styles.dateText,
                          { color: isDarkMode ? Colors.gray[400] : Colors.gray[400] },
                          cm === selectedCm && [styles.dateTextSelected, { color: colors.text }]
                        ]}>
                          {cm} cm
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ) : (
                <>
                  <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}>
                    <View style={[styles.highlightBar, { borderColor: isDarkMode ? Colors.gray[600] : Colors.gray[300] }]} />
                    <ScrollView
                      ref={feetScrollRef}
                      style={styles.scrollView}
                      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={Platform.OS === 'web' ? undefined : ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleFeetScroll}
                      onScrollEndDrag={handleFeetScroll}
                      {...(Platform.OS === 'web' && { onScroll: handleFeetScroll, scrollEventThrottle: 16 })}
                    >
                      {Array.from({ length: 7 }, (_, i) => i + 2).map((ft) => (
                        <View key={ft} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                          <Text style={[
                            styles.dateText,
                            { color: isDarkMode ? Colors.gray[400] : Colors.gray[400] },
                            ft === selectedFeet && [styles.dateTextSelected, { color: colors.text }]
                          ]}>
                            {ft} ft
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}>
                    <View style={[styles.highlightBar, { borderColor: isDarkMode ? Colors.gray[600] : Colors.gray[300] }]} />
                    <ScrollView
                      ref={inchesScrollRef}
                      style={styles.scrollView}
                      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={Platform.OS === 'web' ? undefined : ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleInchesScroll}
                      onScrollEndDrag={handleInchesScroll}
                      {...(Platform.OS === 'web' && { onScroll: handleInchesScroll, scrollEventThrottle: 16 })}
                    >
                      {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                        <View key={inch} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                          <Text style={[
                            styles.dateText,
                            { color: isDarkMode ? Colors.gray[400] : Colors.gray[400] },
                            inch === selectedInches && [styles.dateTextSelected, { color: colors.text }]
                          ]}>
                            {inch} in
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={[styles.columnLabel, { color: colors.text }]}>{t('onboarding.height.weightLabel')}</Text>
            <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}>
              <View style={[styles.highlightBar, { borderColor: isDarkMode ? Colors.gray[600] : Colors.gray[300] }]} />
              <ScrollView
                ref={weightScrollRef}
                style={styles.scrollView}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                showsVerticalScrollIndicator={false}
                snapToInterval={Platform.OS === 'web' ? undefined : ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleWeightScroll}
                onScrollEndDrag={handleWeightScroll}
                {...(Platform.OS === 'web' && { onScroll: handleWeightScroll, scrollEventThrottle: 16 })}
              >
                {Array.from({ length: isMetric ? 171 : 381 }, (_, i) => i + (isMetric ? 30 : 60)).map((weight) => (
                  <View key={weight} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                    <Text style={[
                      styles.dateText,
                      { color: isDarkMode ? Colors.gray[400] : Colors.gray[400] },
                      weight === (isMetric ? selectedKg : selectedLbs) && [styles.dateTextSelected, { color: colors.text }]
                    ]}>
                      {weight} {isMetric ? 'kg' : 'lb'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Button title={t('onboarding.continue')} onPress={handleContinue} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 24,
    fontFamily: Fonts.bold,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  switchLabel: {
    fontSize: Fonts.sizes.base,
    color: Colors.gray[400],
    marginHorizontal: 12,
    fontFamily: Fonts.regular,
  },
  switchLabelActive: {
    color: Colors.black,
    fontWeight: Fonts.weights.semiBold,
    fontFamily: Fonts.semiBold,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontSize: Fonts.sizes.base,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerWrapper: {
    position: 'relative',
    flex: 1,
    height: 250,
    backgroundColor: Colors.gray[100],
    borderRadius: Spacing.radius.md,
    overflow: 'hidden',
    ...(Platform.OS === 'web' && {
      // Add explicit dimensions for web
      minHeight: 250,
      maxHeight: 250,
    }),
  },
  highlightBar: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.gray[300],
    zIndex: 1,
    pointerEvents: 'none',
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      // Fix scroll behavior on web
      height: '100%',
      overflowY: 'scroll' as any,
    }),
  },
  dateOption: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: Fonts.sizes.base,
    color: Colors.gray[400],
    fontWeight: Fonts.weights.medium,
    fontFamily: Fonts.medium,
  },
  dateTextSelected: {
    color: Colors.black,
    fontWeight: Fonts.weights.bold,
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
  },
  footer: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 40,
  },
});
