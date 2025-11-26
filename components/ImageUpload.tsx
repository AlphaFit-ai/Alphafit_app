import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { imageService } from '../services';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing, Fonts } from '../constants';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded?: (imageUrl: string) => void;
  uploadType: 'profile' | 'progress' | 'food';
  progressType?: 'front' | 'side' | 'back';
  label?: string;
  size?: number;
  rounded?: boolean;
}

export default function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  uploadType,
  progressType = 'front',
  label,
  size = 120,
  rounded = true,
}: ImageUploadProps) {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [imageUri, setImageUri] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setImageUri(currentImageUrl || null);
  }, [currentImageUrl]);

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    try {
      const uri = await imageService.pickImage(source);
      if (uri) {
        setImageUri(uri);
        await uploadImage(uri);
      }
    } catch (error: any) {
      // Error handling - could be enhanced with custom alert
      console.error('Pick image error:', error);
    }
  };

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

      // Add cache busting timestamp to force refresh
      const urlWithTimestamp = uploadedUrl.includes('?') 
        ? `${uploadedUrl}&t=${Date.now()}` 
        : `${uploadedUrl}?t=${Date.now()}`;
      
      setImageUri(urlWithTimestamp);
      onImageUploaded?.(urlWithTimestamp);
    } catch (error: any) {
      console.error('Upload error:', error);
      setImageUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const showImageSourceOptions = () => {
    setShowAlert(true);
  };

  const handleAlertOption = (option: 'camera' | 'gallery' | 'cancel') => {
    setShowAlert(false);
    if (option !== 'cancel') {
      setTimeout(() => handlePickImage(option), 300);
    }
  };

  return (
    <>
      <View style={styles.container}>
        {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
        
        <TouchableOpacity
        style={[
          styles.imageContainer,
          {
            width: size,
            height: size,
            borderRadius: rounded ? size / 2 : Spacing.radius.md,
            backgroundColor: colors.card,
            borderColor: imageUri ? Colors.primary + '40' : colors.textSecondary + '30',
          },
        ]}
        onPress={showImageSourceOptions}
        disabled={isUploading}
        activeOpacity={0.8}
      >
        {isUploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>Uploading...</Text>
          </View>
        ) : imageUri ? (
          <>
            <Image
              source={{ 
                uri: imageUri,
                cache: 'reload'
              }}
              style={[
                styles.image,
                {
                  width: size,
                  height: size,
                  borderRadius: rounded ? size / 2 : Spacing.radius.md,
                },
              ]}
              resizeMode="cover"
            />
            <View style={[styles.editButton, { backgroundColor: Colors.primary }]}>
              <Ionicons name="camera" size={18} color={Colors.white} />
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <View style={[styles.placeholderIconWrapper, { backgroundColor: colors.textSecondary + '20' }]}>
              <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>
      </View>

      {/* iOS-style Alert Modal */}
      <Modal
        visible={showAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAlert(false)}
      >
        <TouchableOpacity 
          style={styles.alertOverlay} 
          activeOpacity={1}
          onPress={() => setShowAlert(false)}
        >
          <View style={[styles.alertContainer, { backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              {t('imageUpload.selectSource')}
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {t('imageUpload.selectSourceMessage')}
            </Text>
            
            <View style={[styles.alertButtonContainer, { borderTopColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : 'rgba(60, 60, 67, 0.29)' }]}>
              <TouchableOpacity
                style={[styles.alertButton, { borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : 'rgba(60, 60, 67, 0.29)' }]}
                onPress={() => handleAlertOption('camera')}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, { color: '#007AFF' }]}>
                  {t('imageUpload.camera')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.alertButton, { borderBottomColor: isDarkMode ? 'rgba(84, 84, 88, 0.6)' : 'rgba(60, 60, 67, 0.29)' }]}
                onPress={() => handleAlertOption('gallery')}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, { color: '#007AFF' }]}>
                  {t('imageUpload.gallery')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => handleAlertOption('cancel')}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonTextBold, { color: '#007AFF' }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    overflow: 'hidden',
    borderWidth: 3,
    borderStyle: 'solid',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: Spacing.sm,
    fontSize: 12,
  },
  // iOS-style Alert Modal
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  alertTitle: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 19,
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 20,
    lineHeight: 18,
  },
  alertButtonContainer: {
    borderTopWidth: 0.5,
  },
  alertButton: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
  },
  alertButtonText: {
    fontSize: 17,
    fontFamily: Fonts.regular,
  },
  alertButtonTextBold: {
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
});
