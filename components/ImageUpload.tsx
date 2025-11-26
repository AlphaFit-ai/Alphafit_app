import React, { useState, useEffect } from 'react';
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

      console.log('Image uploaded successfully:', uploadedUrl);
      setImageUri(uploadedUrl);
      onImageUploaded?.(uploadedUrl);
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
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: size,
                  height: size,
                  borderRadius: rounded ? size / 2 : Spacing.radius.md,
                },
              ]}
              resizeMode="cover"
              onError={(error) => {
                console.error('Image load error:', error.nativeEvent.error);
                setImageUri(null);
              }}
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
});
