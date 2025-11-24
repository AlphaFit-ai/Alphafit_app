import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import { imageService, onboardingService } from '../../services';

export default function FoodScanScreen() {
  const { t } = useTranslation();
  const { dietData, updateDietData, setCurrentStep } = useDiet();
  const { colors } = useTheme();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const takePhoto = async () => {
    const hasPermission = cameraPermission || await requestCameraPermission();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos of your meals.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadFoodImage(result.assets[0].uri);
    }
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadFoodImage(result.assets[0].uri);
    }
  };

  const uploadFoodImage = async (uri: string) => {
    setIsUploading(true);
    try {
      const uploadedImageUrl = await imageService.uploadFoodScanImage(uri);
      
      setCapturedImage(uri);
      setUploadedUrl(uploadedImageUrl);
      updateDietData({ foodImage: uploadedImageUrl });

      Alert.alert('Success', 'Food image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload food image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinish = async () => {
    if (uploadedUrl) {
      try {
        // Complete diet onboarding
        await onboardingService.completeDietOnboarding(dietData);
        console.log('Diet onboarding completed');
      } catch (error) {
        console.error('Failed to complete diet onboarding:', error);
      }
      setCurrentStep(5); // Navigate to diet statistics screen
    } else {
      Alert.alert('No Image', 'Please capture or select a food image first');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{t('diet.foodScan.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('diet.foodScan.subtitle')}</Text>

                    <TouchableOpacity style={styles.imageContainer} onPress={takePhoto} activeOpacity={0.8} disabled={isUploading}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.foodImage} />
            ) : (
              <Image 
                source={require('../../assets/images/diet/scan_diet.png')} 
                style={styles.foodImage}
                resizeMode="cover"
              />
            )}
            {isUploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>{t('common.uploading')}</Text>
              </View>
            )}
            {capturedImage && !isUploading && (
              <View style={styles.imageOverlay}>
                <TouchableOpacity style={styles.overlayButton} onPress={() => {
                  setCapturedImage(null);
                  setUploadedUrl(null);
                }}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.scanOptions}>
            <TouchableOpacity style={styles.scanOption} onPress={takePhoto} disabled={isUploading}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="barcode" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>{t('diet.foodScan.barcode')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanOption} onPress={takePhoto} disabled={isUploading}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="camera" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>{t('diet.foodScan.scanFood')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanOption} onPress={pickFromLibrary} disabled={isUploading}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="image" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>{t('diet.foodScan.library')}</Text>
            </TouchableOpacity>
          </View>

          {capturedImage && (
            <TouchableOpacity 
              style={[styles.finishButton, { backgroundColor: Colors.black }]} 
              onPress={handleFinish}
              activeOpacity={0.7}
            >
              <View style={styles.finishButtonContent}>
                <Ionicons name="sparkles" size={20} color={Colors.white} />
                <Text style={styles.finishButtonText}>{t('diet.foodScan.generate')}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  overlayButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.radius.lg,
  },
  loadingText: {
    marginTop: 8,
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.medium,
    color: Colors.white,
  },
  scanOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  scanOption: {
    alignItems: 'center',
    gap: 8,
  },
  scanIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanOptionText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  finishButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  finishButtonText: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
});
