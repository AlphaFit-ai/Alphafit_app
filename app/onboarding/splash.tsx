import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { GradientText } from '../../components';
import { Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { firebaseAuthService, onboardingService } from '../../services';

// Helper function to determine first incomplete onboarding screen
function getFirstIncompleteScreen(data: any): string {
  if (!data) return '/onboarding/intro';
  
  // Check each required field in order
  if (!data.source) return '/onboarding/source';
  if (!data.dateOfBirth) return '/onboarding/age';
  if (!data.gender) return '/onboarding/gender';
  if (!data.height || !data.weight) return '/onboarding/height';
  if (!data.fitnessLevel) return '/onboarding/fitness-level';
  if (!data.activityLevel) return '/onboarding/activity';
  if (!data.workoutsPerWeek) return '/onboarding/workouts';
  if (!data.equipment) return '/onboarding/equipment';
  if (!data.goal) return '/onboarding/goal';
  
  // All onboarding complete
  return '/(tabs)/home';
}

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { loadOnboardingData, setCurrentStep } = useOnboarding();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animate logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Check authentication and onboarding status
    const checkAuthAndNavigate = async () => {
      try {
        const currentUser = await firebaseAuthService.getCurrentUser();
        
        if (!currentUser) {
          // Not logged in - show intro
          router.replace('/onboarding/intro');
          return;
        }
        
        // User is logged in - check onboarding progress
        try {
          const savedData = await onboardingService.getOnboardingData();
          
          if (savedData) {
            // Load saved data into context
            loadOnboardingData(savedData);
            
            // Calculate current step based on completed fields
            let step = 0;
            if (savedData.source) step = 1;
            if (savedData.dateOfBirth) step = 2;
            if (savedData.gender) step = 3;
            if (savedData.height && savedData.weight) step = 4;
            if (savedData.fitnessLevel) step = 5;
            if (savedData.activityLevel) step = 6;
            if (savedData.workoutsPerWeek) step = 7;
            if (savedData.equipment) step = 8;
            if (savedData.goal) step = 9;
            
            setCurrentStep(step);
          }
          
          // Determine where to navigate
          const nextScreen = getFirstIncompleteScreen(savedData);
          router.replace(nextScreen);
          
        } catch (error) {
          console.error('Failed to load onboarding data:', error);
          // If error loading data, start from beginning
          router.replace('/onboarding/source');
        }
        
      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('/onboarding/intro');
      }
    };

    // Wait for animation then check auth
    const timer = setTimeout(() => {
      checkAuthAndNavigate();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <GradientText text="ALPHAFIT AI" style={styles.logoText} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
});
