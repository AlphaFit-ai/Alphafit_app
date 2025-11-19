import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components';
import { Colors, Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';

interface PhotoSlot {
  id: string;
  label: string;
  translationKey: string;
  image: any;
  uri?: string;
}

export default function UploadPhotosScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const { setCurrentStep } = useProjection();

  const [photos, setPhotos] = useState<PhotoSlot[]>([
    {
      id: 'front',
      label: 'Front view',
      translationKey: 'bodyScan.frontView',
      image: require('../../assets/images/projection/front.png'),
    },
    {
      id: 'side',
      label: 'Side view',
      translationKey: 'bodyScan.sideView',
      image: require('../../assets/images/projection/side.png'),
    },
    {
      id: 'back',
      label: 'Back view',
      translationKey: 'bodyScan.backView',
      image: require('../../assets/images/projection/back.png'),
    },
  ]);

  const pickImage = async (photoId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId ? { ...photo, uri: result.assets[0].uri } : photo
        )
      );
    }
  };

  const takePhoto = async (photoId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId ? { ...photo, uri: result.assets[0].uri } : photo
        )
      );
    }
  };

  const allPhotosUploaded = photos.every((photo) => photo.uri);

  const handleAnalyze = () => {
    // Complete projection onboarding, go back to statistics screen
    setCurrentStep(0);
  };  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t('bodyScan.uploadTitle')}
        </Text>

        <View style={styles.photosContainer}>
          {photos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              style={[
                styles.photoCard,
                {
                  backgroundColor: photo.uri
                    ? Colors.success + '20'
                    : isDarkMode
                    ? Colors.gray[800]
                    : Colors.gray[50],
                  borderColor: photo.uri
                    ? Colors.success
                    : isDarkMode
                    ? Colors.gray[700]
                    : Colors.gray[200],
                },
              ]}
              onPress={() => pickImage(photo.id)}
              activeOpacity={0.7}
            >
              <Image source={photo.image} style={styles.photoImage} resizeMode="contain" />
              
              <View style={styles.photoInfo}>
                <View style={styles.photoTextContainer}>
                  <Text style={[styles.photoLabel, { color: colors.text }]}>
                    {t(photo.translationKey)}
                  </Text>
                  <Text style={[styles.photoHint, { color: colors.textSecondary }]}>
                    {photo.uri ? t('bodyScan.uploaded') : t('bodyScan.tapToUpload')}
                  </Text>
                </View>
                
                {!photo.uri && (
                  <TouchableOpacity
                    style={[
                      styles.uploadIcon,
                      {
                        backgroundColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                      },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      takePhoto(photo.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="camera" size={20} color={colors.text} />
                  </TouchableOpacity>
                )}
                
                {photo.uri && (
                  <View
                    style={[
                      styles.uploadIcon,
                      {
                        backgroundColor: Colors.success,
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={Colors.white}
                    />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={
              allPhotosUploaded
                ? t('bodyScan.startAnalysis')
                : t('bodyScan.uploadMore', { count: photos.filter((p) => !p.uri).length })
            }
            onPress={handleAnalyze}
            disabled={!allPhotosUploaded}
            icon={allPhotosUploaded ? 'sparkles' : undefined}
            iconPosition="left"
          />
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
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 24,
  },
  title: {
    fontSize: Fonts.sizes['3xl'],
    fontFamily: Fonts.bold,
    marginBottom: 32,
  },
  photosContainer: {
    gap: 16,
    marginBottom: 32,
  },
  photoCard: {
    flexDirection: 'row',
    borderRadius: Spacing.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
  },
  photoImage: {
    width: 80,
    height: 100,
    marginRight: 16,
  },
  photoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoTextContainer: {
    flex: 1,
  },
  photoLabel: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  photoHint: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
  },
  uploadIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: 'auto',
  },
});
