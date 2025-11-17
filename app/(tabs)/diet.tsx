import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { BackHandler, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import AllergiesScreen from '../diet/allergies';
import DietPreferenceScreen from '../diet/diet-preference';
import FoodScanScreen from '../diet/food-scan';
import MealsScreen from '../diet/meals';
import SupplementsScreen from '../diet/supplements';

export default function DietScreen() {
  const { dietData, currentStep, setCurrentStep } = useDiet();
  const { colors } = useTheme();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Handle back button during onboarding
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // If in onboarding and not at first step, go to previous step
        if (!dietData.isCompleted && currentStep > 0) {
          setCurrentStep(currentStep - 1);
          return true; // Prevent default back behavior
        }
        // Otherwise, allow default back behavior (exit tab)
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [dietData.isCompleted, currentStep, setCurrentStep])
  );

  // Show onboarding steps if not completed
  if (!dietData.isCompleted) {
    switch (currentStep) {
      case 0:
        return <DietPreferenceScreen />;
      case 1:
        return <AllergiesScreen />;
      case 2:
        return <MealsScreen />;
      case 3:
        return <SupplementsScreen />;
      case 4:
        return <FoodScanScreen />;
      default:
        return <DietPreferenceScreen />;
    }
  }

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  if (!dietData.isCompleted) {
    return null;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Diet Overview</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your personalized nutrition plan</Text>
      </View>

      <View style={styles.content}>
        {capturedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.foodImage} />
            <TouchableOpacity 
              style={styles.removeButton} 
              onPress={() => setCapturedImage(null)}
            >
              <Ionicons name="close" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.addPhotoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={pickFromLibrary}
        >
          <Ionicons name="add" size={32} color={colors.text} />
          <Text style={[styles.addPhotoText, { color: colors.text }]}>Add meal photo</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
  },
  content: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.gray[100],
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: '100%',
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
  },
});
