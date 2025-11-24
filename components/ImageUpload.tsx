import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { imageService } from '../services';
import { useTheme } from '../context/ThemeContext';
import { Colors, Spacing } from '../constants';

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
  const { colors } = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    try {
      const uri = await imageService.pickImage(source);
      if (uri) {
        setImageUri(uri);
        await uploadImage(uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
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

      setImageUri(uploadedUrl);
      onImageUploaded?.(uploadedUrl);
      Alert.alert('Success', 'Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload image');
      setImageUri(null);
    } finally {
      setIsUploading(false);
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      'Select Image Source',
      'Choose where to get your image from',
      [
        {
          text: 'Camera',
          onPress: () => handlePickImage('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => handlePickImage('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
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
            borderColor: colors.textSecondary + '30',
          },
        ]}
        onPress={showImageSourceOptions}
        disabled={isUploading}
      >
        {isUploading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>Uploading...</Text>
          </View>
        ) : imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: size,
                  height: size,
                  borderRadius: rounded ? size / 2 : Spacing.radius.md,
                },
              ]}
            />
            <View style={[styles.editButton, { backgroundColor: Colors.primary }]}>
              <Ionicons name="camera" size={16} color={Colors.white} />
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera" size={32} color={colors.textSecondary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
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
    borderWidth: 2,
    borderStyle: 'dashed',
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
  },
  placeholderText: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: Spacing.sm,
    fontSize: 12,
  },
});
