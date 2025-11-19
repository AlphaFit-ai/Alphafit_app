import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components';
import { Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';

const sleepOptions = [
  { id: '<5', label: '<5', degrees: 90 },
  { id: '5-6', label: '5-6', degrees: 90 },
  { id: '7-8', label: '7-8', degrees: 90 },
  { id: '9+', label: '9+', degrees: 90 },
];

export default function SleepScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { projectionData, updateProjectionData, setCurrentStep } = useProjection();
  const [selected, setSelected] = useState<string | undefined>(projectionData.sleepHours);

  const handleContinue = () => {
    if (selected) {
      updateProjectionData({ sleepHours: selected });
      setCurrentStep(1);
    }
  };

  const renderPieChart = () => {
    return (
      <View style={styles.pieChartContainer}>
        <View style={[styles.pieChart, { borderColor: colors.border, borderWidth: 1 }]}>
          {/* Top Left - <5 */}
          <TouchableOpacity
            style={[
              styles.pieSlice,
              styles.topLeft,
              {
                backgroundColor: selected === '<5' ? colors.text : (isDarkMode ? colors.backgroundSecondary : colors.card),
                borderTopColor: colors.border,
                borderLeftColor: colors.border,
              },
            ]}
            onPress={() => setSelected('<5')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pieText,
                { color: selected === '<5' ? colors.background : colors.text },
              ]}
            >
              &lt;5
            </Text>
          </TouchableOpacity>

          {/* Top Right - 5-6 */}
          <TouchableOpacity
            style={[
              styles.pieSlice,
              styles.topRight,
              {
                backgroundColor: selected === '5-6' ? colors.text : (isDarkMode ? colors.backgroundSecondary : colors.card),
                borderTopColor: colors.border,
                borderRightColor: colors.border,
              },
            ]}
            onPress={() => setSelected('5-6')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pieText,
                { color: selected === '5-6' ? colors.background : colors.text },
              ]}
            >
              5-6
            </Text>
          </TouchableOpacity>

          {/* Bottom Left - 7-8 */}
          <TouchableOpacity
            style={[
              styles.pieSlice,
              styles.bottomLeft,
              {
                backgroundColor: selected === '7-8' ? colors.text : (isDarkMode ? colors.backgroundSecondary : colors.card),
                borderBottomColor: colors.border,
                borderLeftColor: colors.border,
              },
            ]}
            onPress={() => setSelected('7-8')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pieText,
                { color: selected === '7-8' ? colors.background : colors.text },
              ]}
            >
              7-8
            </Text>
          </TouchableOpacity>

          {/* Bottom Right - 9+ */}
          <TouchableOpacity
            style={[
              styles.pieSlice,
              styles.bottomRight,
              {
                backgroundColor: selected === '9+' ? colors.text : (isDarkMode ? colors.backgroundSecondary : colors.card),
                borderBottomColor: colors.border,
                borderRightColor: colors.border,
              },
            ]}
            onPress={() => setSelected('9+')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pieText,
                { color: selected === '9+' ? colors.background : colors.text },
              ]}
            >
              9+
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t('projection.sleep.title')}
        </Text>

        {renderPieChart()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={t('common.continue')}
          onPress={handleContinue}
          disabled={!selected}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 24,
  },
  title: {
    fontSize: Fonts.sizes['3xl'],
    fontFamily: Fonts.bold,
    marginBottom: 60,
  },
  pieChartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieChart: {
    width: 280,
    height: 280,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 140,
    overflow: 'hidden',
  },
  pieSlice: {
    width: '50%',
    height: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topLeft: {
    borderTopLeftRadius: 140,
  },
  topRight: {
    borderTopRightRadius: 140,
  },
  bottomLeft: {
    borderBottomLeftRadius: 140,
  },
  bottomRight: {
    borderBottomRightRadius: 140,
  },
  pieText: {
    fontSize: Fonts.sizes.xl,
    fontFamily: Fonts.bold,
  },
  footer: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
});
