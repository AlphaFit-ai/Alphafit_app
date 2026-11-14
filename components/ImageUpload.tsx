import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { imageService } from '../services';
import { logError } from '../services/apiError';
import { AppImage, Dialog, PressableScale, Text, useToast } from '../src/ui';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded?: (imageUrl: string) => void;
  uploadType: 'profile' | 'progress' | 'food';
  progressType?: 'front' | 'side' | 'back';
  label?: string;
  size?: number;
  rounded?: boolean;
}

/**
 * A photo slot: shows the current picture, asks where the new one comes from (camera or library) in a
 * dialog, uploads it (shrunk first, see `services/imagePrep`) and tells the user if that failed.
 */
export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  uploadType,
  progressType = 'front',
  label,
  size = 120,
  rounded = true,
}: ImageUploadProps) {
  const { tokens } = useTheme();
  const c = tokens.color;
  const { t } = useTranslation();
  const toast = useToast();
  const [imageUri, setImageUri] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const radius = rounded ? size / 2 : tokens.radius.md;

  // Sync local state with prop changes
  useEffect(() => {
    setImageUri(currentImageUrl || null);
  }, [currentImageUrl]);

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      let uploadedUrl: string;
      switch (uploadType) {
        case 'profile':
          uploadedUrl = await imageService.uploadProfilePicture(uri);
          break;
        case 'progress':
          uploadedUrl = await imageService.uploadProgressPhoto(uri, progressType);
          break;
        case 'food':
          uploadedUrl = await imageService.uploadFoodScanImage(uri);
          break;
        default:
          throw new Error('Invalid upload type');
      }

      // A new query string makes the image component fetch the new picture.
      const fresh = `${uploadedUrl}${uploadedUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      setImageUri(fresh);
      onImageUploaded?.(fresh);
    } catch (error: unknown) {
      logError('imageUpload.upload', error);
      // Put the previous picture back and say that the upload did not work.
      setImageUri(currentImageUrl || null);
      toast.show(t('imageUpload.uploadFailed'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    try {
      const uri = await imageService.pickImage(source);
      if (uri) {
        setImageUri(uri);
        await uploadImage(uri);
      }
    } catch (error: unknown) {
      // Most often the camera or photo permission was refused.
      logError('imageUpload.pick', error);
      toast.show(t('imageUpload.pickFailed'), 'error');
    }
  };

  const choose = (source: 'camera' | 'gallery') => {
    // The dialog is closing: let it finish before the system picker opens.
    setTimeout(() => void handlePickImage(source), 300);
  };

  return (
    <>
      <View style={styles.container}>
        {label ? <Text variant="label">{label}</Text> : null}
        <PressableScale
          onPress={() => setShowSources(true)}
          disabled={isUploading}
          feedback
          accessibilityRole="button"
          accessibilityLabel={label ?? t('imageUpload.addPhoto')}
          accessibilityState={{ busy: isUploading, disabled: isUploading }}
          style={[
            styles.slot,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: c.surfaceMuted,
              borderColor: c.border,
            },
          ]}
        >
          {isUploading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={c.accent} />
              <Text variant="caption" tone="muted">
                {t('common.uploading')}
              </Text>
            </View>
          ) : imageUri ? (
            <>
              <AppImage
                source={{ uri: imageUri }}
                accessible={false}
                style={{ width: size, height: size, borderRadius: radius }}
              />
              <View style={[styles.edit, { backgroundColor: c.accent }]}>
                <Ionicons name="camera" size={18} color={c.onAccent} />
              </View>
            </>
          ) : (
            <View style={styles.center}>
              <Ionicons name="camera-outline" size={32} color={c.textMuted} />
              <Text variant="label" tone="muted">
                {t('imageUpload.addPhoto')}
              </Text>
            </View>
          )}
        </PressableScale>
      </View>

      <Dialog
        visible={showSources}
        title={t('imageUpload.selectSource')}
        message={t('imageUpload.selectSourceMessage')}
        onClose={() => setShowSources(false)}
        actions={[
          { label: t('imageUpload.camera'), onPress: () => choose('camera') },
          { label: t('imageUpload.gallery'), onPress: () => choose('gallery') },
          { label: t('common.cancel'), tone: 'cancel' },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  slot: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  edit: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
