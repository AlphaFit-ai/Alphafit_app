import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

export default function FoodScanScreen() {
  const { updateDietData } = useDiet();
  const { colors } = useTheme();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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
      setCapturedImage(result.assets[0].uri);
      updateDietData({ foodImage: result.assets[0].uri });
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
    }
  };

  const handleFinish = () => {
    if (capturedImage) {
      updateDietData({ foodImage: capturedImage, isCompleted: true });
    } else {
      updateDietData({ isCompleted: true });
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
          <Text style={[styles.title, { color: colors.text }]}>Smart Diet Plan</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>AI-powered diet guidance</Text>

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
            {capturedImage && (
              <View style={styles.imageOverlay}>
                <TouchableOpacity style={styles.overlayButton} onPress={() => setCapturedImage(null)}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.scanOptions}>
            <TouchableOpacity style={styles.scanOption} onPress={takePhoto}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="camera" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>Scan Food</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanOption} onPress={pickFromLibrary}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="barcode" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>Barcode</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanOption}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="pricetag" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>Food Label</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanOption} onPress={pickFromLibrary}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="image" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>Library</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <View style={styles.cameraButtonOuter}>
              <View style={styles.cameraButtonInner}>
                <Ionicons name="camera" size={32} color={Colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          {capturedImage && (
            <TouchableOpacity 
              style={[styles.finishButton, { backgroundColor: Colors.black }]} 
              onPress={handleFinish}
              activeOpacity={0.7}
            >
              <Text style={styles.finishButtonText}>Finish</Text>
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
    paddingVertical: 40,
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
    backgroundColor: Colors.gray[100],
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
  cameraButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  finishButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: Fonts.sizes.lg,
    fontFamily: Fonts.bold,
    color: Colors.white,
  },
});
