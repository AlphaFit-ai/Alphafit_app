import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Platform, Modal } from 'react-native';

import { Colors, Fonts, Spacing } from '../../constants';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import { imageService, onboardingService } from '../../services';

interface PhotoSlot {
  id: string;
  label: string;
  translationKey: string;
  image: any;
  uri?: string;
  uploadedUrl?: string;
}

export default function UploadPhotosScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const { projectionData, setCurrentStep, updateProjectionData } = useProjection();

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


  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const pickImage = async (photoId: string) => {
    showAlert('Coming Soon', 'Photo upload feature is coming soon!');
  };

  const takePhoto = async (photoId: string) => {
    showAlert('Coming Soon', 'Photo capture feature is coming soon!');
  };

  const uploadPhoto = async (photoId: string, uri: string) => {
    setIsUploading(photoId);
    try {
      // Map photoId to progress type
      const progressType = photoId as 'front' | 'side' | 'back';

      // Upload to MinIO
      const uploadedUrl = await imageService.uploadProgressPhoto(uri, progressType);

      // Update local state
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId
            ? { ...photo, uri, uploadedUrl }
            : photo
        )
      );

      // Save URL to projection context (auto-saves to backend)
      await updateProjectionData({
        [`${photoId}PhotoUrl`]: uploadedUrl,
      });

      Alert.alert('Success', `${progressType} photo uploaded successfully`);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload photo');
    } finally {
      setIsUploading(null);
    }
  };

  const allPhotosUploaded = photos.every((photo) => photo.uploadedUrl);

  const handleAnalyze = () => {
    if (allPhotosUploaded) {
      // Navigate to statistics screen
      // All data is already saved via auto-save in context
      setCurrentStep(0);
    }
  };

  return (
    <>
      {/* iOS-style Alert Modal */}
      <Modal
        visible={alertConfig.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertConfig({ visible: false, title: '', message: '' })}
      >
        <TouchableOpacity
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={() => setAlertConfig({ visible: false, title: '', message: '' })}
        >
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {alertConfig.title}
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {alertConfig.message}
            </Text>

            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setAlertConfig({ visible: false, title: '', message: '' })}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonTextBold]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
                    backgroundColor: photo.uploadedUrl
                      ? Colors.success + '20'
                      : isDarkMode
                        ? Colors.gray[800]
                        : Colors.gray[50],
                    borderColor: photo.uploadedUrl
                      ? Colors.success
                      : isDarkMode
                        ? Colors.gray[700]
                        : Colors.gray[200],
                  },
                ]}
                onPress={() => pickImage(photo.id)}
                activeOpacity={0.7}
                disabled={isUploading === photo.id}
              >
                <Image source={photo.image} style={styles.photoImage} resizeMode="contain" />

                {isUploading === photo.id && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>
                      {t('common.uploading')}
                    </Text>
                  </View>
                )}

                <View style={styles.photoInfo}>
                  <View style={styles.photoTextContainer}>
                    <Text style={[styles.photoLabel, { color: colors.text }]}>
                      {t(photo.translationKey)}
                    </Text>
                    <Text style={[styles.photoHint, { color: colors.textSecondary }]}>
                      {photo.uploadedUrl ? t('bodyScan.uploaded') : t('bodyScan.tapToUpload')}
                    </Text>
                  </View>

                  {!photo.uploadedUrl && isUploading !== photo.id && (
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

                  {photo.uploadedUrl && (
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
        </ScrollView>
      </View>
    </>
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
  },
  // iOS-style Alert
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: 270,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    lineHeight: 18,
  },
  alertButtonContainer: {
    borderTopWidth: 0.5,
    flexDirection: 'row',
  },
  alertButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonText: {
    fontSize: 17,
    fontFamily: Fonts.regular,
    color: Colors.primary,
  },
  alertButtonTextBold: {
    fontFamily: Fonts.semiBold,
  },

});
