import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, ProgressBar } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useOnboarding } from '../../context/OnboardingContext';
import { useTheme } from '../../context/ThemeContext';

export default function AgeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateOnboardingData, setCurrentStep } = useOnboarding();
  const { colors, isDarkMode } = useTheme();
  
  const [selectedMonth, setSelectedMonth] = useState(4); // April
  const [selectedDay, setSelectedDay] = useState(4);
  const [selectedYear, setSelectedYear] = useState(2006);

  const ITEM_HEIGHT = 50;
  const VISIBLE_ITEMS = 5;
  const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  const months = [
    t('onboarding.age.january'), t('onboarding.age.february'), t('onboarding.age.march'),
    t('onboarding.age.april'), t('onboarding.age.may'), t('onboarding.age.june'),
    t('onboarding.age.july'), t('onboarding.age.august'), t('onboarding.age.september'),
    t('onboarding.age.october'), t('onboarding.age.november'), t('onboarding.age.december')
  ];

  // Calculate days in month
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  // Adjust day if it exceeds days in selected month
  React.useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [selectedMonth, selectedYear, daysInMonth]);

  // Scroll to initial positions after mount
  React.useEffect(() => {
    setTimeout(() => {
      monthScrollRef.current?.scrollTo({ y: selectedMonth * ITEM_HEIGHT, animated: false });
      dayScrollRef.current?.scrollTo({ y: (selectedDay - 1) * ITEM_HEIGHT, animated: false });
      yearScrollRef.current?.scrollTo({ y: (2015 - selectedYear) * ITEM_HEIGHT, animated: false });
    }, 100);
  }, []);

  const handleMonthScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    setSelectedMonth(Math.max(0, Math.min(11, index)));
  };

  const handleDayScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    setSelectedDay(Math.max(1, Math.min(daysInMonth, index + 1)));
  };

  const handleYearScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    setSelectedYear(Math.max(1945, Math.min(2015, 2015 - index)));
  };

  const handleContinue = () => {
    updateOnboardingData({
      dateOfBirth: {
        month: selectedMonth + 1,
        day: selectedDay,
        year: selectedYear,
      },
    });
    setCurrentStep(2);
    router.push('/onboarding/gender');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <ProgressBar currentStep={2} totalSteps={10} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{t('onboarding.age.title')}</Text>

        <View style={styles.dateContainer}>
          {/* Month Selector */}
          <View style={styles.dateSection}>
            <Text style={[styles.label, { color: colors.text }]}>{t('onboarding.age.month')}</Text>
            <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[50] }]}>
              <View style={[styles.highlightBar, { borderColor: isDarkMode ? Colors.gray[600] : Colors.gray[300] }]} />
              <ScrollView 
                ref={monthScrollRef}
                style={styles.scrollView}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMonthScroll}
                onScrollEndDrag={handleMonthScroll}
              >
                {months.map((month, index) => (
                  <View
                    key={index}
                    style={[styles.dateOption, { height: ITEM_HEIGHT }]}
                  >
                    <Text style={[
                      styles.dateText,
                      { color: isDarkMode ? Colors.gray[400] : Colors.gray[400] },
                      index === selectedMonth && [styles.dateTextSelected, { color: colors.text }]
                    ]}>
                      {month}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Day Selector */}
          <View style={styles.dateSection}>
            <Text style={[styles.label, { color: colors.text }]}>{t('onboarding.age.day')}</Text>
            <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[50] }]}>
              <View style={[styles.highlightBar, { borderColor: isDarkMode ? Colors.gray[600] : Colors.gray[300] }]} />
              <ScrollView 
                ref={dayScrollRef}
                style={styles.scrollView}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleDayScroll}
                onScrollEndDrag={handleDayScroll}
              >
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                  <View
                    key={day}
                    style={[styles.dateOption, { height: ITEM_HEIGHT }]}
                  >
                    <Text style={[
                      styles.dateText,
                      { color: isDarkMode ? Colors.gray[400] : Colors.gray[400] },
                      day === selectedDay && [styles.dateTextSelected, { color: colors.text }]
                    ]}>
                      {day}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Year Selector */}
          <View style={styles.dateSection}>
            <Text style={[styles.label, { color: colors.text }]}>{t('onboarding.age.year')}</Text>
            <View style={[styles.pickerWrapper, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[50] }]}>
              <View style={[styles.highlightBar, { borderColor: isDarkMode ? Colors.gray[600] : Colors.gray[300] }]} />
              <ScrollView 
                ref={yearScrollRef}
                style={styles.scrollView}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleYearScroll}
                onScrollEndDrag={handleYearScroll}
              >
                {Array.from({ length: 70 }, (_, i) => 2015 - i).map((year) => (
                  <View
                    key={year}
                    style={[styles.dateOption, { height: ITEM_HEIGHT }]}
                  >
                    <Text style={[
                      styles.dateText,
                      { color: isDarkMode ? Colors.gray[400] : Colors.gray[400] },
                      year === selectedYear && [styles.dateTextSelected, { color: colors.text }]
                    ]}>
                      {year}
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
    marginBottom: 40,
    fontFamily: Fonts.bold,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 16,
    height: 250,
  },
  dateSection: {
    flex: 1,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.semiBold,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Fonts.semiBold,
  },
  pickerWrapper: {
    position: 'relative',
    height: 250,
    backgroundColor: Colors.gray[50],
    borderRadius: Spacing.radius.lg,
    overflow: 'hidden',
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
