import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { AppImage } from '../../src/ui';

type WorkoutDay = 'push' | 'pull' | 'leg';
type Muscle =
  | 'chest'
  | 'shoulders'
  | 'triceps'
  | 'back'
  | 'biceps'
  | 'quads'
  | 'glutes'
  | 'calves'
  | 'lowerBack';

/**
 * Exercise names and descriptions are translation keys under `workoutScreen.exercises.<id>`.
 * `reps` is a range as typed; `holdSeconds` replaces it for timed holds.
 */
interface Exercise {
  id: string;
  sets: number;
  reps?: string;
  holdSeconds?: number;
  tag?: Muscle;
}

interface WorkoutProgram {
  day: WorkoutDay;
  titleKey: 'workoutScreen.pushDay' | 'workoutScreen.pullDay' | 'workoutScreen.legDay';
  muscles: Muscle[];
  minutes: number;
  exercises: Exercise[];
  icon: ImageSourcePropType;
}

const workoutPrograms: WorkoutProgram[] = [
  {
    day: 'push',
    titleKey: 'workoutScreen.pushDay',
    muscles: ['chest', 'shoulders', 'triceps'],
    minutes: 45,
    icon: require('../../assets/images/icon/push.png'),
    exercises: [
      { id: 'pushUps', sets: 3, reps: '8-12', tag: 'chest' },
      { id: 'pikePushUps', sets: 3, reps: '6-10', tag: 'shoulders' },
      { id: 'tricepDips', sets: 3, reps: '8-15', tag: 'triceps' },
      { id: 'inclinePushUps', sets: 2, reps: '10-15', tag: 'chest' },
    ],
  },
  {
    day: 'pull',
    titleKey: 'workoutScreen.pullDay',
    muscles: ['back', 'biceps'],
    minutes: 40,
    icon: require('../../assets/images/icon/pull.png'),
    exercises: [
      { id: 'bodyweightRows', sets: 3, reps: '8-12', tag: 'back' },
      { id: 'superman', sets: 3, reps: '10-15', tag: 'lowerBack' },
      { id: 'wallHandstand', sets: 3, holdSeconds: 30 },
      { id: 'reversePlank', sets: 2, reps: '20-30s', tag: 'back' },
    ],
  },
  {
    day: 'leg',
    titleKey: 'workoutScreen.legDay',
    muscles: ['quads', 'glutes', 'calves'],
    minutes: 50,
    icon: require('../../assets/images/icon/leg.png'),
    exercises: [
      { id: 'bodyweightSquats', sets: 3, reps: '12-20', tag: 'quads' },
      { id: 'calfRaises', sets: 3, reps: '15-25', tag: 'calves' },
      { id: 'gluteBridges', sets: 3, reps: '15-20', tag: 'glutes' },
      { id: 'wallSit', sets: 2, reps: '30-60s', tag: 'quads' },
    ],
  },
];

export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const { colors, tokens } = useTheme();
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>('push');

  const selectedProgram = selectedDay ? workoutPrograms.find((p) => p.day === selectedDay) : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={[styles.titleIconContainer, { backgroundColor: tokens.color.surfaceMuted }]}>
            <Ionicons name="fitness" size={32} color={colors.text} />
          </View>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            {t('workoutScreen.title')}
          </Text>
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t('workoutScreen.description')}
        </Text>
      </View>

      <View style={styles.workoutCards}>
        {workoutPrograms.map((program) => (
          <TouchableOpacity
            key={program.day}
            style={[
              styles.workoutCard,
              {
                backgroundColor: tokens.color.surface,
                borderColor:
                  selectedDay === program.day ? tokens.color.action : tokens.color.border,
              },
              selectedDay === program.day && [
                styles.workoutCardActive,
                { backgroundColor: tokens.color.action },
              ],
            ]}
            onPress={() => setSelectedDay(program.day)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t(program.titleKey)}
            accessibilityState={{ selected: selectedDay === program.day }}
          >
            <AppImage
              source={program.icon}
              noPlaceholder
              contentFit="contain"
              accessible={false}
              style={[styles.workoutIcon, { backgroundColor: 'transparent' }]}
            />
            <Text
              style={[
                styles.workoutTitle,
                { color: selectedDay === program.day ? tokens.color.onAction : colors.text },
                selectedDay === program.day && styles.workoutTitleActive,
              ]}
            >
              {t(program.titleKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedProgram && (
        <View style={[styles.programDetails, { backgroundColor: colors.background }]}>
          <Text style={[styles.programTitle, { color: colors.text }]}>
            {t(selectedProgram.titleKey)} -{' '}
            {selectedProgram.muscles.map((muscle) => t(`workoutScreen.${muscle}`)).join(', ')}
          </Text>

          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={18} color={tokens.color.textSubtle} />
            <Text style={[styles.durationText, { color: colors.textSecondary }]}>
              {selectedProgram.minutes} {t('workoutScreen.mins')}
            </Text>
          </View>

          <View style={styles.exercisesList}>
            {selectedProgram.exercises.map((exercise) => {
              const name = t(`workoutScreen.exercises.${exercise.id}.name`);
              return (
                <View
                  key={exercise.id}
                  style={[
                    styles.exerciseCard,
                    {
                      backgroundColor: tokens.color.surface,
                      borderColor: tokens.color.border,
                    },
                  ]}
                >
                  <View style={styles.exerciseHeader}>
                    <Text style={[styles.exerciseName, { color: colors.text }]}>{name}</Text>
                    {exercise.tag && (
                      <View style={[styles.exerciseTag, { backgroundColor: tokens.color.action }]}>
                        <Text style={[styles.exerciseTagText, { color: tokens.color.onAction }]}>
                          {t(`workoutScreen.${exercise.tag}`)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseStats, { color: colors.textSecondary }]}>
                      {t('workoutScreen.sets')}:{' '}
                      <Text style={[styles.exerciseStatsValue, { color: colors.text }]}>
                        {exercise.sets}
                      </Text>
                      {'  '}
                      {t('workoutScreen.reps')}:{' '}
                      <Text style={[styles.exerciseStatsValue, { color: colors.text }]}>
                        {exercise.holdSeconds !== undefined
                          ? t('workoutScreen.holdSeconds', { seconds: exercise.holdSeconds })
                          : exercise.reps}
                      </Text>
                    </Text>
                  </View>

                  <Text style={[styles.exerciseDescription, { color: colors.textSecondary }]}>
                    {t(`workoutScreen.exercises.${exercise.id}.description`)}
                  </Text>

                  <TouchableOpacity
                    style={[styles.demoButton, { backgroundColor: tokens.color.action }]}
                    disabled
                    accessibilityRole="button"
                    accessibilityState={{ disabled: true }}
                  >
                    <Ionicons name="play-circle" size={16} color={tokens.color.onAction} />
                    <Text style={[styles.demoButtonText, { color: tokens.color.onAction }]}>
                      {t('workoutScreen.demo', { name })}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 24,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  titleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
  },
  description: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
    lineHeight: 22,
    marginBottom: 32,
  },
  workoutCards: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    gap: 8,
    marginBottom: 32,
  },
  workoutCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutCardActive: {
    shadowOpacity: 0.15,
    elevation: 4,
  },
  workoutIcon: {
    width: 62,
    height: 62,
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  workoutTitleActive: {
    fontFamily: Fonts.bold,
  },
  workoutSubtitle: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
    textAlign: 'center',
    lineHeight: 18,
  },
  workoutSubtitleActive: {
    color: Colors.gray[300],
  },
  programDetails: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: 32,
  },
  programTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  durationText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
  exercisesList: {
    gap: 16,
  },
  exerciseCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    flex: 1,
  },
  exerciseTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exerciseTagText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
  exerciseInfo: {
    marginBottom: 8,
  },
  exerciseStats: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  exerciseStatsValue: {
    fontFamily: Fonts.semiBold,
  },
  exerciseDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    marginBottom: 12,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
  },
  demoButtonText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.white,
  },
});
