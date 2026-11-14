import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Fonts, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { Dialog } from '../../src/ui/Dialog';
import { AppImage, type AppImageSource } from '../../src/ui';

interface PhotoSlot {
  id: string;
  translationKey: string;
  image: AppImageSource;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  {
    id: 'front',
    translationKey: 'bodyScan.frontView',
    image: require('../../assets/images/projection/front.png'),
  },
  {
    id: 'side',
    translationKey: 'bodyScan.sideView',
    image: require('../../assets/images/projection/side.png'),
  },
  {
    id: 'back',
    translationKey: 'bodyScan.backView',
    image: require('../../assets/images/projection/back.png'),
  },
];

/**
 * Physique photos. Uploading is not built yet (ROADMAP D2 and MOB-7): tapping a slot or its camera
 * button explains that. The upload call exists in `imageService.uploadProgressPhoto` for when it is.
 */
export default function UploadPhotosScreen() {
  const { t } = useTranslation();
  const { colors, tokens } = useTheme();
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const closeAlert = () => setAlertConfig({ visible: false, title: '', message: '' });

  const pickImage = () => {
    setAlertConfig({
      visible: true,
      title: t('projection.comingSoon'),
      message: t('projection.photoUploadSoon'),
    });
  };

  const takePhoto = () => {
    setAlertConfig({
      visible: true,
      title: t('projection.comingSoon'),
      message: t('projection.photoCaptureSoon'),
    });
  };

  return (
    <>
      <Dialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={closeAlert}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: colors.text }]}>{t('bodyScan.uploadTitle')}</Text>

          <View style={styles.photosContainer}>
            {PHOTO_SLOTS.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={[
                  styles.photoCard,
                  {
                    backgroundColor: tokens.color.bgSubtle,
                    borderColor: tokens.color.border,
                  },
                ]}
                onPress={pickImage}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t(photo.translationKey)}
              >
                <AppImage
                  source={photo.image}
                  noPlaceholder
                  contentFit="contain"
                  accessible={false}
                  style={[styles.photoImage, { backgroundColor: 'transparent' }]}
                />

                <View style={styles.photoInfo}>
                  <View style={styles.photoTextContainer}>
                    <Text style={[styles.photoLabel, { color: colors.text }]}>
                      {t(photo.translationKey)}
                    </Text>
                    <Text style={[styles.photoHint, { color: colors.textSecondary }]}>
                      {t('bodyScan.tapToUpload')}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.uploadIcon,
                      {
                        backgroundColor: tokens.color.border,
                      },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      takePhoto();
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${t(photo.translationKey)}: ${t('imageUpload.camera')}`}
                  >
                    <Ionicons name="camera" size={20} color={colors.text} />
                  </TouchableOpacity>
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
});
