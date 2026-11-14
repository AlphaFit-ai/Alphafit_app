import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { ProPlanModal } from '../../components/ProPlanModal';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import { barcodeService, foodScanService, imageService, userService } from '../../services';
import { logError, normalizeApiError } from '../../services/apiError';
import { isProductNotFound } from '../../services/barcodeService';
import type { ScanStage } from '../../services/foodScanService';
import { createScanLock } from '../../services/scanLock';
import { ScanProgress } from '../../src/scan/ScanProgress';
import {
  AppImage,
  Button,
  FullScreen,
  haptic,
  PressableScale,
  Screen,
  Text,
  useDialog,
} from '../../src/ui';

// Dev-only (browser preview): the camera cannot read a barcode there, so the digits are typed. In an
// app build this is `null` and the code is not in the bundle.
const preview: typeof import('../../src/preview') | null =
  process.env.EXPO_PUBLIC_PREVIEW === '1'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be a require so a build without the flag drops it
      require('../../src/preview')
    : null;

export default function FoodScanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { updateDietData, setCurrentStep } = useDiet();
  const { tokens } = useTheme();
  const { show, dialog } = useDialog();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false);
  const [hasBarcodeCameraPermission, setHasBarcodeCameraPermission] = useState<boolean>(false);
  const [showManualBarcode, setShowManualBarcode] = useState<boolean>(false);
  // What the scan is doing, for the progress card: the stage, which kind, and the seconds so far.
  const [stage, setStage] = useState<ScanStage>('uploading');
  const [scanKind, setScanKind] = useState<'photo' | 'barcode'>('photo');
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isProcessing) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [isProcessing]);
  // The camera reports one barcode many times a second: only the first report starts a lookup.
  const scanLock = useRef(createScanLock()).current;
  // The photo scan in progress: aborting it stops the upload, the request and the polling.
  const scanAbort = useRef<AbortController | null>(null);
  useEffect(() => () => scanAbort.current?.abort(), []);

  const cancelScan = () => scanAbort.current?.abort();

  const showAlert = (
    title: string,
    message: string,
    buttons: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [{ text: t('common.ok'), style: 'cancel' }]
  ) =>
    show({
      title,
      message,
      feedback: 'error',
      actions: buttons.map((b) => ({ label: b.text, tone: b.style, onPress: b.onPress })),
    });

  // Refresh subscription status every time screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkSubscriptionStatus = async () => {
        try {
          const profile = await userService.getUserProfile();
          setIsPremium(profile.subscriptionPlan === 'PREMIUM');
        } catch (error) {
          logError('foodScan.subscription', error);
          setIsPremium(false);
        }
      };
      void checkSubscriptionStatus();
    }, [])
  );

  const stageText = (stage: ScanStage) => t(`diet.foodScan.progress.${stage}`);

  const showPermissionAlert = (messageKey: 'cameraMealMessage' | 'cameraBarcodeMessage') =>
    showAlert(t('diet.foodScan.alerts.cameraTitle'), t(`diet.foodScan.alerts.${messageKey}`), [
      { text: t('common.cancel'), style: 'cancel' },
      // Send the user to this app's page in the phone's Settings, where the permission can be turned on.
      { text: t('diet.foodScan.alerts.settings'), onPress: () => void Linking.openSettings() },
    ]);

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

    if (preview) {
      // Browser preview: no camera, the barcode is typed and looked up for real.
      scanLock.reset();
      setShowManualBarcode(true);
      return;
    }

    const hasPermission = hasBarcodeCameraPermission || (await requestBarcodeCameraPermission());

    if (!hasPermission) {
      showPermissionAlert('cameraBarcodeMessage');
      return;
    }

    // A new scanning session: the next code is allowed through.
    scanLock.reset();
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    if (!scanLock.tryLock()) return;
    haptic.confirm();

    setShowBarcodeScanner(false);
    setScanKind('barcode');
    setIsProcessing(true);
    setProgressStatus(t('diet.foodScan.progress.lookingUp'));

    try {
      // Use barcode service (handles multiple databases on backend)
      const barcodeResult = await barcodeService.lookupBarcode(data);
      setProgressStatus(t('diet.foodScan.progress.productFound', { source: barcodeResult.source }));

      // Navigate to barcode result screen
      setTimeout(() => {
        setIsProcessing(false);
        // Store barcode data in diet context for the barcode result screen
        void updateDietData({ barcodeData: JSON.stringify(barcodeResult) });
        setCurrentStep(6);
      }, 500);
    } catch (error: unknown) {
      setIsProcessing(false);
      setProgressStatus('');

      if (isProductNotFound(error)) {
        // Product not found in databases - expected behavior
        showAlert(
          t('diet.foodScan.alerts.productNotFoundTitle'),
          t('diet.foodScan.alerts.productNotFoundMessage', { barcode: data }),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('diet.foodScan.scanFood'),
              onPress: () => setTimeout(() => void takePhoto(), 300),
            },
          ]
        );
      } else {
        // Unexpected error - log for debugging
        logError('foodScan.barcode', error);
        showAlert(
          t('diet.foodScan.alerts.connectionTitle'),
          t('diet.foodScan.alerts.connectionMessage')
        );
      }
    }
  };

  const takePhoto = async () => {
    if (!isPremium) {
      setShowProModal(true);
      return;
    }

    const hasPermission = cameraPermission || (await requestCameraPermission());

    if (!hasPermission) {
      showPermissionAlert('cameraMealMessage');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      haptic.shutter();
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
    const controller = new AbortController();
    scanAbort.current = controller;
    setScanKind('photo');
    setStage('uploading');
    setIsProcessing(true);
    setProgressStatus(stageText('uploading'));

    try {
      // Step 1: Upload image to MinIO
      const uploadedImageUrl = await imageService.uploadFoodScanImage(uri);
      setCapturedImage(uri);

      setStage('analyzing');
      setProgressStatus(stageText('analyzing'));

      // Step 2: Create food scan and process with AI
      const result = await foodScanService.scanFood(
        uploadedImageUrl,
        (reported) => {
          setStage(reported);
          setProgressStatus(stageText(reported));
        },
        controller.signal
      );

      void updateDietData({
        foodImage: uploadedImageUrl,
        scanId: result.id,
      });

      // Navigate to diet statistics screen (step 5)
      setStage('complete');
      setProgressStatus(t('diet.foodScan.progress.done'));

      // Small delay to show completion
      setTimeout(() => {
        setCurrentStep(5);
      }, 500);
    } catch (error: unknown) {
      // Clear loading state first
      setIsProcessing(false);
      setProgressStatus('');

      const normalized = normalizeApiError(error);

      // The user cancelled, or left the screen: nothing to report.
      if (normalized.kind === 'cancelled') return;

      // The api marks "nothing to eat in this photo" with this text (CONTRACTS section 2).
      if (normalized.message.includes('No food detected')) {
        setTimeout(() => {
          showAlert(
            t('diet.foodScan.alerts.noFoodTitle'),
            t('diet.foodScan.alerts.noFoodMessage'),
            [
              {
                text: t('diet.foodScan.alerts.tryAgain'),
                onPress: () => setCapturedImage(null),
              },
            ]
          );
        }, 100);
      } else if (normalized.kind === 'offline' || normalized.kind === 'timeout') {
        // Network/connection error
        setTimeout(() => {
          showAlert(
            t('diet.foodScan.alerts.connectionTitle'),
            t('diet.foodScan.alerts.connectionMessage')
          );
        }, 100);
      } else {
        // Other errors: a scan that failed carries the api's own explanation; a failed request does not.
        logError('foodScan.scan', error);
        setTimeout(() => {
          showAlert(
            t('diet.foodScan.alerts.errorTitle'),
            normalized.kind === 'unknown' && normalized.message
              ? normalized.message
              : t('diet.foodScan.alerts.errorMessage')
          );
        }, 100);
      }
    }
  };

  const c = tokens.color;

  return (
    <Screen scroll noTopInset contentStyle={styles.content} style={styles.root}>
      <ProPlanModal visible={showProModal} onClose={() => setShowProModal(false)} />
      {dialog}
      {preview ? (
        <preview.ManualBarcodeDialog
          visible={showManualBarcode}
          onClose={() => setShowManualBarcode(false)}
          onSubmit={(barcode) => void handleBarcodeScanned({ type: 'manual', data: barcode })}
        />
      ) : null}

      {/* The barcode camera: one full-screen layer, closed by the button or the back key */}
      <FullScreen visible={showBarcodeScanner} onRequestClose={() => setShowBarcodeScanner(false)}>
        <CameraView
          style={styles.fill}
          facing="back"
          onBarcodeScanned={showBarcodeScanner ? handleBarcodeScanned : undefined}
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
              'datamatrix',
            ],
          }}
        >
          <View style={styles.cameraOverlay}>
            <PressableScale
              onPress={() => setShowBarcodeScanner(false)}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={styles.cameraClose}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </PressableScale>
            <View style={styles.frame} accessible={false} />
            <Text variant="bodyStrong" style={styles.cameraHint}>
              {t('diet.foodScan.barcodeHint')}
            </Text>
          </View>
        </CameraView>
      </FullScreen>

      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text variant="title" accessibilityRole="header">
            {t('diet.foodScan.title')}
          </Text>
          <Text tone="muted">{t('diet.foodScan.subtitle')}</Text>
        </View>
        <PressableScale
          onPress={() => router.push('/history')}
          accessibilityRole="button"
          accessibilityLabel={t('history.title')}
          style={[styles.historyButton, { backgroundColor: c.surfaceMuted }]}
        >
          <Ionicons name="time-outline" size={24} color={c.text} />
        </PressableScale>
      </View>

      <View style={[styles.photo, { backgroundColor: c.surfaceMuted }]}>
        <AppImage
          source={
            capturedImage
              ? { uri: capturedImage }
              : require('../../assets/images/diet/scan_diet.png')
          }
          accessible={false}
          noPlaceholder={!capturedImage}
          contentFit={capturedImage ? 'cover' : 'contain'}
          style={styles.fill}
        />
      </View>

      {isProcessing ? (
        scanKind === 'photo' ? (
          <ScanProgress stage={stage} seconds={elapsed} onCancel={cancelScan} />
        ) : (
          <View
            style={[styles.lookup, { backgroundColor: c.surface, borderColor: c.border }]}
            accessibilityLiveRegion="polite"
          >
            <ActivityIndicator color={c.accent} />
            <Text variant="bodyStrong">{progressStatus}</Text>
          </View>
        )
      ) : (
        <>
          <Button
            variant="accent"
            size="large"
            icon="camera"
            iconPosition="left"
            title={t('diet.foodScan.scanFood')}
            onPress={takePhoto}
          />
          <View style={styles.secondary}>
            <View style={styles.flex}>
              <Button
                variant="secondary"
                size="medium"
                icon="images-outline"
                iconPosition="left"
                title={capturedImage ? t('scan.retake') : t('diet.foodScan.library')}
                onPress={pickFromLibrary}
              />
            </View>
            <View style={styles.flex}>
              <Button
                variant="secondary"
                size="medium"
                icon="barcode-outline"
                iconPosition="left"
                title={t('diet.foodScan.barcode')}
                onPress={openBarcodeScanner}
              />
            </View>
          </View>
          <Text variant="caption" tone="subtle" style={styles.tip}>
            {t('scan.tip')}
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 32, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', aspectRatio: 1, maxHeight: 360, borderRadius: 24, overflow: 'hidden' },
  secondary: { flexDirection: 'row', gap: 12 },
  tip: { textAlign: 'center' },
  lookup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 64,
  },
  cameraClose: {
    alignSelf: 'flex-end',
    marginRight: 20,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: { width: 260, height: 260, borderRadius: 24, borderWidth: 3, borderColor: '#FFFFFF' },
  cameraHint: { color: '#FFFFFF', textAlign: 'center', paddingHorizontal: 32 },
});
