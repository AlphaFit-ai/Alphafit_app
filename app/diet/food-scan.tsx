import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, Camera } from 'expo-camera';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProPlanModal } from '../../components/ProPlanModal';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import { barcodeService, foodScanService, imageService, userService } from '../../services';
import type { FoodScanDto } from '../../services';

export default function FoodScanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { dietData, updateDietData, setCurrentStep } = useDiet();
  const { colors } = useTheme();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressValue, setProgressValue] = useState<number>(0);
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<FoodScanDto | null>(null);
  const [showNoFoodAlert, setShowNoFoodAlert] = useState<boolean>(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [hasBarcodeCameraPermission, setHasBarcodeCameraPermission] = useState<boolean>(false);
  const [showCameraPermissionAlert, setShowCameraPermissionAlert] = useState<boolean>(false);
  const [showBarcodePermissionAlert, setShowBarcodePermissionAlert] = useState<boolean>(false);
  const [showProductNotFoundAlert, setShowProductNotFoundAlert] = useState<boolean>(false);
  const [productNotFoundBarcode, setProductNotFoundBarcode] = useState<string>('');
  const [showConnectionErrorAlert, setShowConnectionErrorAlert] = useState<boolean>(false);
  const [showGeneralErrorAlert, setShowGeneralErrorAlert] = useState<boolean>(false);
  const [generalErrorMessage, setGeneralErrorMessage] = useState<string>('');
  const [showNoResultsAlert, setShowNoResultsAlert] = useState<boolean>(false);

  // Refresh subscription status every time screen is focused
  useFocusEffect(
    useCallback(() => {
      checkSubscriptionStatus();
    }, [])
  );

  const checkSubscriptionStatus = async () => {
    try {
      const profile = await userService.getUserProfile();
      setIsPremium(profile.subscriptionPlan === 'PREMIUM');
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsPremium(false);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const requestBarcodeCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasBarcodeCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const openBarcodeScanner = async () => {
    if (!isPremium) {
      setShowProModal(true);
      return;
    }

    const hasPermission = hasBarcodeCameraPermission || await requestBarcodeCameraPermission();
    
    if (!hasPermission) {
      setShowBarcodePermissionAlert(true);
      return;
    }

    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScannedBarcode(data);
    setShowBarcodeScanner(false);
    setIsProcessing(true);
    setProgressStatus('Looking up product...');
    setProgressValue(30);

    try {
      // Use barcode service (handles multiple databases on backend)
      const barcodeResult = await barcodeService.lookupBarcode(data);

      setProgressValue(100);
      setProgressStatus(`Product found in ${barcodeResult.source}!`);
      setScanResult(barcodeResult as any);
      
      // Navigate to barcode result screen
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep(6);
        // Store barcode data in diet context for the barcode result screen
        updateDietData({ barcodeData: JSON.stringify(barcodeResult) });
      }, 500);
    } catch (error: any) {
      setIsProcessing(false);
      
      if (error.message?.includes('Product not found')) {
        // Product not found in databases - expected behavior
        setProductNotFoundBarcode(data);
        setShowProductNotFoundAlert(true);
      } else {
        // Unexpected error - log for debugging
        console.error('Barcode lookup error:', error);
        setShowConnectionErrorAlert(true);
      }
    }
  };

  const takePhoto = async () => {
    if (!isPremium) {
      setShowProModal(true);
      return;
    }

    const hasPermission = cameraPermission || await requestCameraPermission();
    
    if (!hasPermission) {
      setShowCameraPermissionAlert(true);
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
    if (!isPremium) {
      setShowProModal(true);
      return;
    }

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
    setIsProcessing(true);
    setProgressStatus('Uploading image...');
    setProgressValue(0.1);

    try {
      // Step 1: Upload image to MinIO
      const uploadedImageUrl = await imageService.uploadFoodScanImage(uri);
      setCapturedImage(uri);
      setUploadedUrl(uploadedImageUrl);
      
      setProgressStatus('Analyzing with AI...');
      setProgressValue(0.3);

      // Step 2: Create food scan and process with AI
      const result = await foodScanService.scanFood(
        uploadedImageUrl,
        (status, progress) => {
          setProgressStatus(status);
          setProgressValue(progress);
        }
      );

      setScanResult(result);
      updateDietData({ 
        foodImage: uploadedImageUrl,
        scanId: result.id 
      });

      // Navigate to diet statistics screen (step 5)
      setProgressStatus('Complete!');
      setProgressValue(1);
      
      // Small delay to show completion
      setTimeout(() => {
        setCurrentStep(5);
      }, 500);

    } catch (error: any) {
      // Clear loading state first
      setIsProcessing(false);
      setProgressStatus('');
      setProgressValue(0);
      
      // Check if it's a "no food detected" error
      if (error.message?.includes('No food detected')) {
        setTimeout(() => {
          setShowNoFoodAlert(true);
        }, 100);
      } else if (error.message?.includes('timeout') || error.message?.includes('network') || error.code === 'ECONNABORTED') {
        // Network/connection error
        setTimeout(() => {
          setShowConnectionErrorAlert(true);
        }, 100);
      } else {
        // Other errors
        setTimeout(() => {
          setGeneralErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
          setShowGeneralErrorAlert(true);
        }, 100);
      }
    }
  };

  const handleFinish = () => {
    if (scanResult) {
      // Navigate to statistics screen
      setCurrentStep(5);
    } else {
      setShowNoResultsAlert(true);
    }
  };

  return (
    <>
      <ProPlanModal visible={showProModal} onClose={() => setShowProModal(false)} />
      
      {/* Barcode Scanner Modal */}
      <Modal
        visible={showBarcodeScanner}
        animationType="slide"
        onRequestClose={() => setShowBarcodeScanner(false)}
      >
        <View style={styles.barcodeScannerContainer}>
          <CameraView
            style={styles.barcodeCamera}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'code128',
                'code39',
                'code93',
                'codabar',
                'itf14',
                'pdf417',
                'aztec',
                'datamatrix'
              ],
            }}
          >
            <View style={styles.barcodeScannerOverlay}>
              <View style={styles.barcodeScannerHeader}>
                <TouchableOpacity
                  style={styles.barcodeScannerClose}
                  onPress={() => setShowBarcodeScanner(false)}
                >
                  <Ionicons name="close" size={28} color={Colors.white} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.barcodeScannerFrame}>
                <View style={styles.barcodeScannerCorner} />
              </View>
              
              <View style={styles.barcodeScannerInfo}>
                <Text style={styles.barcodeScannerText}>
                  Position barcode or QR code within frame
                </Text>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
      
      {/* iOS-style No Food Alert */}
      <Modal
        visible={showNoFoodAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoFoodAlert(false)}
      >
        <TouchableOpacity 
          style={styles.alertOverlay} 
          activeOpacity={1}
          onPress={() => setShowNoFoodAlert(false)}
        >
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              No Food Detected
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              Please upload a clear photo of food items. Make sure the food is well-lit and centered.
            </Text>
            
            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  setShowNoFoodAlert(false);
                  setCapturedImage(null);
                  setUploadedUrl(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonTextBold]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Camera Permission Alert */}
      <Modal
        visible={showCameraPermissionAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCameraPermissionAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              Camera Access Required
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              AlphaFit needs access to your camera to take photos of your meals. Please enable camera access in Settings.
            </Text>
            
            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowCameraPermissionAlert(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.alertButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <View style={[styles.alertButtonDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  setShowCameraPermissionAlert(false);
                  // Open settings - implement later
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonTextBold]}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Barcode Camera Permission Alert */}
      <Modal
        visible={showBarcodePermissionAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBarcodePermissionAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              Camera Access Required
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              AlphaFit needs access to your camera to scan barcodes. Please enable camera access in Settings.
            </Text>
            
            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowBarcodePermissionAlert(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.alertButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <View style={[styles.alertButtonDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  setShowBarcodePermissionAlert(false);
                  // Open settings - implement later
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonTextBold]}>
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Product Not Found Alert */}
      <Modal
        visible={showProductNotFoundAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProductNotFoundAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              Product Not Found
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              Barcode: {productNotFoundBarcode}{'\n\n'}This product is not in our databases. Please try scanning the food with the camera for better results.
            </Text>
            
            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowProductNotFoundAlert(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.alertButtonText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <View style={[styles.alertButtonDivider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => {
                  setShowProductNotFoundAlert(false);
                  setTimeout(() => takePhoto(), 300);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.alertButtonText, styles.alertButtonTextBold]}>
                  Scan Food
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Connection Error Alert */}
      <Modal
        visible={showConnectionErrorAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConnectionErrorAlert(false)}
      >
        <TouchableOpacity 
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={() => setShowConnectionErrorAlert(false)}
        >
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              Connection Failed
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              Unable to connect to the server. Please check your internet connection and try again.
            </Text>
            
            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowConnectionErrorAlert(false)}
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

      {/* General Error Alert */}
      <Modal
        visible={showGeneralErrorAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGeneralErrorAlert(false)}
      >
        <TouchableOpacity 
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={() => setShowGeneralErrorAlert(false)}
        >
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              Error
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              {generalErrorMessage}
            </Text>
            
            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowGeneralErrorAlert(false)}
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

      {/* No Results Alert */}
      <Modal
        visible={showNoResultsAlert}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoResultsAlert(false)}
      >
        <TouchableOpacity 
          style={styles.alertOverlay}
          activeOpacity={1}
          onPress={() => setShowNoResultsAlert(false)}
        >
          <View style={[styles.alertContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.alertTitle, { color: colors.text }]}>
              No Results
            </Text>
            <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
              Please scan a food image first.
            </Text>
            
            <View style={[styles.alertButtonContainer, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowNoResultsAlert(false)}
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
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{t('diet.foodScan.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('diet.foodScan.subtitle')}</Text>

                    <TouchableOpacity style={styles.imageContainer} onPress={takePhoto} activeOpacity={0.8} disabled={isProcessing}>
            {capturedImage ? (
              <Image source={{ uri: capturedImage }} style={styles.foodImage} />
            ) : (
              <Image 
                source={require('../../assets/images/diet/scan_diet.png')} 
                style={styles.foodImage}
                resizeMode="cover"
              />
            )}
            {isProcessing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>{progressStatus}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progressValue * 100}%` }]} />
                </View>
              </View>
            )}
            {capturedImage && !isProcessing && (
              <View style={styles.imageOverlay}>
                <TouchableOpacity style={styles.overlayButton} onPress={() => {
                  setCapturedImage(null);
                  setUploadedUrl(null);
                  setScanResult(null);
                }}>
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.scanOptions}>
            <TouchableOpacity style={styles.scanOption} onPress={openBarcodeScanner} disabled={isProcessing}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="barcode" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>{t('diet.foodScan.barcode')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanOption} onPress={takePhoto} disabled={isProcessing}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="camera" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>{t('diet.foodScan.scanFood')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.scanOption} onPress={pickFromLibrary} disabled={isProcessing}>
              <View style={[styles.scanIconContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="image" size={24} color={colors.text} />
              </View>
              <Text style={[styles.scanOptionText, { color: colors.text }]}>{t('diet.foodScan.library')}</Text>
            </TouchableOpacity>
          </View>
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
  progressBarContainer: {
    width: '70%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
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
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonDivider: {
    width: 0.5,
  },
  alertButtonText: {
    fontSize: 17,
    fontFamily: Fonts.regular,
    color: '#007AFF',
  },
  alertButtonTextBold: {
    fontFamily: Fonts.semiBold,
  },
  // Barcode Scanner Styles
  barcodeScannerContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  barcodeCamera: {
    flex: 1,
  },
  barcodeScannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  barcodeScannerHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  barcodeScannerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeScannerFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  barcodeScannerCorner: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: Colors.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  barcodeScannerInfo: {
    paddingBottom: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  barcodeScannerText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
