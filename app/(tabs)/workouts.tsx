import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProPlanModal } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';

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
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | null>(null);
  const [showProModal, setShowProModal] = useState(false);

  const selectedProgram = selectedDay ? workoutPrograms.find(p => p.day === selectedDay) : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.titleIconContainer}>
            <Ionicons name="fitness" size={32} color={Colors.black} />
          </View>
          <Text style={styles.title}>{t('workoutScreen.title')}</Text>
        </View>
        <Text style={styles.description}>
          {t('workoutScreen.description')}
        </Text>
      </View>

      <View style={styles.workoutCards}>
        {workoutPrograms.map((program) => (
          <TouchableOpacity
            key={program.day}
            style={[
              styles.workoutCard,
              selectedDay === program.day && styles.workoutCardActive,
            ]}
            onPress={() => setSelectedDay(program.day)}
            activeOpacity={0.7}
          >
            <Image 
              source={program.icon} 
              style={[
                styles.workoutIcon,
                selectedDay === program.day && styles.workoutIconActive,
              ]}
              resizeMode="contain"
            />
            <Text style={[
              styles.workoutTitle,
              selectedDay === program.day && styles.workoutTitleActive,
            ]}>
              {program.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedProgram && (
        <View style={styles.programDetails}>
          <Text style={styles.programTitle}>{selectedProgram.title} - {selectedProgram.subtitle.replace(/\n/g, ', ')}</Text>
          
          <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={18} color={Colors.gray[400]} />
            <Text style={styles.durationText}>{selectedProgram.duration}</Text>
          </View>

          <View style={styles.exercisesList}>
            {selectedProgram.exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.tag && (
                    <View style={styles.exerciseTag}>
                      <Text style={styles.exerciseTagText}>{exercise.tag}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseStats}>
                    Sets: <Text style={styles.exerciseStatsValue}>{exercise.sets}</Text>
                    {'  '}
                    Reps: <Text style={styles.exerciseStatsValue}>{exercise.reps}</Text>
                  </Text>
                </View>

                <Text style={styles.exerciseDescription}>{exercise.description}</Text>

                <TouchableOpacity style={styles.demoButton} disabled>
                  <Ionicons name="play-circle" size={16} color={Colors.white} />
                  <Text style={styles.demoButtonText}>{exercise.demo}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.proSection}>
        <View style={styles.lockIconContainer}>
          <Ionicons name="lock-closed" size={28} color={Colors.black} />
        </View>
        <Text style={styles.proTitle}>{t('workoutScreen.unlockProTitle')}</Text>
        <Text style={styles.proDescription}>
          {t('workoutScreen.unlockProDescription')}
        </Text>

        <View style={styles.proFeatures}>
          <View style={styles.proFeature}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.black} />
            <View style={styles.proFeatureText}>
              <Text style={styles.proFeatureTitle}>{t('workoutScreen.customPlans')}</Text>
              <Text style={styles.proFeatureSubtitle}>{t('workoutScreen.customPlansSubtitle')}</Text>
            </View>
          </View>
          <View style={styles.proFeature}>
            <Ionicons name="trending-up" size={24} color={Colors.black} />
            <View style={styles.proFeatureText}>
              <Text style={styles.proFeatureTitle}>{t('workoutScreen.progressTraining')}</Text>
              <Text style={styles.proFeatureSubtitle}>{t('workoutScreen.progressTrainingSubtitle')}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={{ width: '100%' }} onPress={() => setShowProModal(true)}>
          <LinearGradient
            colors={[Colors.gold, Colors.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeToProButton}
          >
            <Ionicons name="trophy" size={20} color={Colors.white} />
            <Text style={styles.upgradeToProText}>{t('workoutScreen.upgradeToPro')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
      <ProPlanModal visible={showProModal} onClose={() => setShowProModal(false)} />
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
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.gray[100],
    padding: 20,
    alignItems: 'center',
  },
  workoutCardActive: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  workoutIcon: {
    width: 62,
    height: 62,
    marginBottom: 12,
  },
  workoutIconActive: {
    tintColor: Colors.white,
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
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[100],
    padding: 16,
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
    color: Colors.black,
    flex: 1,
  },
  exerciseTag: {
    backgroundColor: Colors.black,
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
    color: Colors.gray[500],
  },
  exerciseStatsValue: {
    fontFamily: Fonts.semiBold,
    color: Colors.black,
  },
  exerciseDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
    lineHeight: 18,
    marginBottom: 12,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black,
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
  proSection: {
    marginHorizontal: Spacing.screenPaddingHorizontal,
    alignItems: 'center',
    paddingVertical: 32,
  },
  lockIconContainer: {
    marginBottom: 16,
  },
  proTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  proDescription: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  proFeatures: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
  },
  proFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proFeatureText: {
    gap: 2,
  },
  proFeatureTitle: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
  },
  proFeatureSubtitle: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
  upgradeToProButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 24,
    gap: 8,
    width: '100%',
  },
  upgradeToProText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.white,
  },
});
