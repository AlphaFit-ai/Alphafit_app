import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';

export default function DietScreen() {
  const { dietData } = useDiet();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      // Check if diet onboarding is completed
      if (!dietData.isCompleted) {
        router.replace('/diet/diet-preference');
      }
    }, [dietData.isCompleted])
  );

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
      setCapturedImage(result.assets[0].uri);
      // TODO: Send image to AI model for analysis
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
      setCapturedImage(result.assets[0].uri);
      // TODO: Send image to AI model for analysis
    }
  };

  if (!dietData.isCompleted) {
    return null;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="restaurant" size={32} color={Colors.black} />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              <Text style={styles.forgeText}>FORGE</Text>{' '}
              <Text style={styles.aiText}>AI</Text>
            </Text>
          </View>
        </View>
        <Text style={styles.title}>Smart Diet Plan</Text>
        <Text style={styles.subtitle}>AI-powered diet guidance</Text>
      </View>

      <View style={styles.scanSection}>
        <View style={styles.imageContainer}>
          {capturedImage ? (
            <Image source={{ uri: capturedImage }} style={styles.foodImage} />
          ) : (
            <Image 
              source={require('../../assets/images/diet/Balanced.png')} 
              style={styles.foodImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.imageOverlay}>
            <TouchableOpacity style={styles.overlayButton} onPress={() => setCapturedImage(null)}>
              <Ionicons name="remove" size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.overlayButton}>
              <Ionicons name="add" size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.overlayButton}>
              <Ionicons name="remove" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.scanOptions}>
          <TouchableOpacity style={styles.scanOption} onPress={takePhoto}>
            <Ionicons name="camera" size={24} color={Colors.black} />
            <Text style={styles.scanOptionText}>scan food</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanOption} onPress={pickFromLibrary}>
            <Ionicons name="barcode" size={24} color={Colors.black} />
            <Text style={styles.scanOptionText}>Barcode</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanOption}>
            <Ionicons name="pricetag" size={24} color={Colors.black} />
            <Text style={styles.scanOptionText}>Food Label</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.scanOption} onPress={pickFromLibrary}>
            <Ionicons name="image" size={24} color={Colors.black} />
            <Text style={styles.scanOptionText}>Library</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
          <View style={styles.cameraButtonOuter}>
            <View style={styles.cameraButtonInner}>
              <Ionicons name="camera" size={32} color={Colors.white} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 24,
    paddingBottom: 32,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  forgeText: {
    color: Colors.primary,
  },
  aiText: {
    color: '#93C5FD',
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
  scanSection: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 32,
    backgroundColor: Colors.gray[100],
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  overlayButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  scanOption: {
    alignItems: 'center',
    gap: 8,
  },
  scanOptionText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.black,
  },
  cameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButtonOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  cameraButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
