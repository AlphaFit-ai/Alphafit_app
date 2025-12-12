import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

type WorkoutDay = 'push' | 'pull' | 'leg';

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  description: string;
  tag: string;
  demo: string;
}

interface WorkoutProgram {
  day: WorkoutDay;
  title: string;
  subtitle: string;
  duration: string;
  exercises: Exercise[];
  icon: any;
  iconSet: string;
}

const workoutPrograms: WorkoutProgram[] = [
  {
    day: 'push',
    title: 'Push Day',
    subtitle: 'Chest\nShoulders\nTriceps',
    duration: '45 mins',
    icon: require('../../assets/images/icon/push.png'),
    iconSet: 'image',
    exercises: [
      {
        name: 'Push-ups',
        sets: 3,
        reps: '8-12',
        description: 'Keep your body straight, lower until chest nearly touches ground',
        tag: 'Chest',
        demo: 'Push-up demo',
      },
      {
        name: 'Pike Push-ups',
        sets: 3,
        reps: '6-10',
        description: 'Hands shoulder-width apart, walk feet closer to hands',
        tag: 'Shoulders',
        demo: 'Pike Push-up demo',
      },
      {
        name: 'Tricep Dips',
        sets: 3,
        reps: '8-15',
        description: 'Use chair or bench, lower your body by bending elbows',
        tag: 'Triceps',
        demo: 'Tricep dip demo',
      },
      {
        name: 'Incline Push-ups',
        sets: 2,
        reps: '10-15',
        description: 'Use elevated surface like bench or step',
        tag: 'Chest',
        demo: 'Incline Push-up demo',
      },
    ],
  },
  {
    day: 'pull',
    title: 'Pull Day',
    subtitle: 'Back\nBiceps',
    duration: '40 mins',
    icon: require('../../assets/images/icon/pull.png'),
    iconSet: 'image',
    exercises: [
      {
        name: 'Bodyweight Rows',
        sets: 3,
        reps: '8-12',
        description: 'Use table or bar, keep body straight and pull chest to bar',
        tag: 'Back',
        demo: 'Bodyweight row demo',
      },
      {
        name: 'Superman',
        sets: 3,
        reps: '10-15',
        description: 'Lie face down, lift chest and legs simultaneously',
        tag: 'Lower Back',
        demo: 'Superman demo',
      },
      {
        name: 'Wall Handstand',
        sets: 3,
        reps: '30s hold',
        description: 'Face wall, walk feet while in handstand position',
        tag: '',
        demo: 'Wall Handstand demo',
      },
      {
        name: 'Reverse Plank',
        sets: 2,
        reps: '20-30s',
        description: 'Sit with legs extended, lift hips off ground',
        tag: 'Back',
        demo: 'Reverse plank demo',
      },
    ],
  },
  {
    day: 'leg',
    title: 'Leg Day',
    subtitle: 'Quads\nGlutes\nCalves',
    duration: '50 mins',
    icon: require('../../assets/images/icon/leg.png'),
    iconSet: 'image',
    exercises: [
      {
        name: 'Bodyweight Squats',
        sets: 3,
        reps: '12-20',
        description: 'Feet shoulder-width apart, lower until thighs parallel to ground',
        tag: 'Quads',
        demo: 'Lunge demo',
      },
      {
        name: 'Calf Raises',
        sets: 3,
        reps: '15-25',
        description: 'Rise up on toes, hold briefly, lower slowly',
        tag: 'Calves',
        demo: 'Calf raise demo',
      },
      {
        name: 'Glute Bridges',
        sets: 3,
        reps: '15-20',
        description: 'Lie on back, lift hips by squeezing glutes',
        tag: 'Glutes',
        demo: 'Glute bridge demo',
      },
      {
        name: 'Wall Sit',
        sets: 2,
        reps: '30-60s',
        description: 'Back against wall, slide down until thighs parallel to ground',
        tag: 'Quads',
        demo: 'wall sit demo',
      },
    ],
  },
];

export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>('push');


  const selectedProgram = selectedDay ? workoutPrograms.find(p => p.day === selectedDay) : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={[styles.titleIconContainer, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}>
            <Ionicons name="fitness" size={32} color={colors.text} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{t('workoutScreen.title')}</Text>
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
                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                borderColor: selectedDay === program.day ? (isDarkMode ? Colors.primary : Colors.black) : (isDarkMode ? Colors.gray[700] : Colors.gray[100])
              },
              selectedDay === program.day && [
                styles.workoutCardActive,
                { backgroundColor: isDarkMode ? Colors.primary : Colors.black }
              ],
            ]}
            onPress={() => setSelectedDay(program.day)}
            activeOpacity={0.7}
          >
            <Image
              source={program.icon}
              style={[
                styles.workoutIcon,
              ]}
              resizeMode="contain"
            />
            <Text style={[
              styles.workoutTitle,
              { color: selectedDay === program.day ? Colors.white : colors.text },
              selectedDay === program.day && styles.workoutTitleActive,
            ]}>
              {program.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedProgram && (
        <View style={[styles.programDetails, { backgroundColor: colors.background }]}>
          <Text style={[styles.programTitle, { color: colors.text }]}>{selectedProgram.title} - {selectedProgram.subtitle.replace(/\n/g, ', ')}</Text>

          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={18} color={isDarkMode ? Colors.gray[500] : Colors.gray[400]} />
            <Text style={[styles.durationText, { color: colors.textSecondary }]}>{selectedProgram.duration}</Text>
          </View>

          <View style={styles.exercisesList}>
            {selectedProgram.exercises.map((exercise, index) => (
              <View
                key={index}
                style={[
                  styles.exerciseCard,
                  {
                    backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                    borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[100]
                  }
                ]}
              >
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
                  {exercise.tag && (
                    <View style={[styles.exerciseTag, { backgroundColor: isDarkMode ? Colors.primary : Colors.black }]}>
                      <Text style={styles.exerciseTagText}>{exercise.tag}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseStats, { color: colors.textSecondary }]}>
                    Sets: <Text style={[styles.exerciseStatsValue, { color: colors.text }]}>{exercise.sets}</Text>
                    {'  '}
                    Reps: <Text style={[styles.exerciseStatsValue, { color: colors.text }]}>{exercise.reps}</Text>
                  </Text>
                </View>

                <Text style={[styles.exerciseDescription, { color: colors.textSecondary }]}>{exercise.description}</Text>

                <TouchableOpacity
                  style={[
                    styles.demoButton,
                    { backgroundColor: isDarkMode ? Colors.primary : Colors.black }
                  ]}
                  disabled
                >
                  <Ionicons name="play-circle" size={16} color={Colors.white} />
                  <Text style={styles.demoButtonText}>{exercise.demo}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}


    </ScrollView>
  );
} const styles = StyleSheet.create({
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
    paddingHorizontal: Spacing.sm,
    gap: 6,
    marginBottom: 32,
  },
  workoutCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
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
    color: Colors.white,
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
