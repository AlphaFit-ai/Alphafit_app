import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { firebaseAuthService, userService } from '../../services';
import type { UserProfile } from '../../services/userService';

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

const SuccessModal = ({ visible, onClose }: SuccessModalProps) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('profile.accountDetailsForm.successTitle')}</Text>
          <Text style={styles.modalMessage}>
            {t('profile.accountDetailsForm.successMessage')}
          </Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.modalButtonText}>{t('profile.accountDetailsForm.ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function AccountDetailsScreen() {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [callingCode, setCallingCode] = useState('+212');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isMetric, setIsMetric] = useState(true);
  const [selectedFeet, setSelectedFeet] = useState(5);
  const [selectedInches, setSelectedInches] = useState(7);
  const [selectedCm, setSelectedCm] = useState(170);
  const [selectedLbs, setSelectedLbs] = useState(150);
  const [selectedKg, setSelectedKg] = useState(70);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const ITEM_HEIGHT = 50;

  const cmScrollRef = useRef<ScrollView>(null);
  const feetScrollRef = useRef<ScrollView>(null);
  const inchesScrollRef = useRef<ScrollView>(null);
  const weightScrollRef = useRef<ScrollView>(null);

  const formatPhoneNumber = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
    } else if (cleaned.length <= 10) {
      return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6);
    }
    return cleaned.slice(0, 10);
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const profile = await userService.getUserProfile();

      // Set basic info
      setName(profile.fullName || '');
      setEmail(profile.email || '');

      // Set phone number
      if (profile.phoneNumber) {
        // Remove any non-digit characters and format
        const cleanPhone = profile.phoneNumber.replace(/\D/g, '');
        // Check if it starts with country code
        if (cleanPhone.startsWith('212')) {
          // Remove Morocco country code if present
          const localNumber = cleanPhone.substring(3);
          setPhone(formatPhoneNumber(localNumber));
        } else if (cleanPhone.startsWith('+')) {
          // Handle other formats
          setPhone(formatPhoneNumber(cleanPhone));
        } else {
          setPhone(formatPhoneNumber(cleanPhone));
        }
      }

      // Set height from onboardingData
      const heightData = profile.onboardingData?.height;
      if (heightData) {
        if (heightData.unit === 'metric' && heightData.cm) {
          setIsMetric(true);
          setSelectedCm(Math.round(heightData.cm));
        } else if (heightData.unit === 'imperial' && heightData.feet && heightData.inches !== undefined) {
          setIsMetric(false);
          setSelectedFeet(heightData.feet);
          setSelectedInches(heightData.inches);
        }
      }

      // Set weight from onboardingData
      const weightData = profile.onboardingData?.weight;
      if (weightData) {
        if (weightData.unit === 'metric' && weightData.kg) {
          setSelectedKg(Math.round(weightData.kg));
        } else if (weightData.unit === 'imperial' && weightData.lbs) {
          setSelectedLbs(Math.round(weightData.lbs));
        }
      }
    } catch (error: any) {
      const is404 = error?.response?.status === 404;
      const is401 = error?.response?.status === 401;

      if (is404 || is401) {
        // User doesn't exist or token expired - sign out and redirect to login
        await firebaseAuthService.signOut();
        router.replace('/onboarding/login');
      } else {
        console.error('Failed to load user data:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll pickers to correct position when unit system changes or when data loads
  useEffect(() => {
    setTimeout(() => {
      if (isMetric) {
        cmScrollRef.current?.scrollTo({ y: (selectedCm - 60) * ITEM_HEIGHT, animated: false });
        weightScrollRef.current?.scrollTo({ y: (selectedKg - 30) * ITEM_HEIGHT, animated: false });
      } else {
        feetScrollRef.current?.scrollTo({ y: (selectedFeet - 2) * ITEM_HEIGHT, animated: false });
        inchesScrollRef.current?.scrollTo({ y: selectedInches * ITEM_HEIGHT, animated: false });
        weightScrollRef.current?.scrollTo({ y: (selectedLbs - 60) * ITEM_HEIGHT, animated: false });
      }
    }, 100);
  }, [isMetric, selectedCm, selectedKg, selectedFeet, selectedInches, selectedLbs]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text.toLowerCase().trim());
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      let formatted = cleaned;
      if (cleaned.length > 3 && cleaned.length <= 6) {
        formatted = cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
      } else if (cleaned.length > 6) {
        formatted = cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6);
      }
      setPhone(formatted);
    }
  };



  const handleCmScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    const newCm = Math.max(60, Math.min(250, index + 60));
    setSelectedCm(newCm);
  };

  const handleFeetScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    const newFeet = Math.max(2, Math.min(8, index + 2));
    setSelectedFeet(newFeet);
  };

  const handleInchesScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    const newInches = Math.max(0, Math.min(11, index));
    setSelectedInches(newInches);
  };

  const handleWeightScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    const index = Math.round(yOffset / ITEM_HEIGHT);
    if (isMetric) {
      const newKg = Math.max(30, Math.min(200, index + 30));
      setSelectedKg(newKg);
    } else {
      const newLbs = Math.max(60, Math.min(440, index + 60));
      setSelectedLbs(newLbs);
    }
  };

  const handleSave = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      setIsSaving(true);

      // Prepare height data
      const heightData = isMetric ? {
        value: selectedCm,
        unit: 'metric' as const,
        cm: selectedCm
      } : {
        value: selectedFeet * 12 + selectedInches,
        unit: 'imperial' as const,
        feet: selectedFeet,
        inches: selectedInches
      };

      // Prepare weight data
      const weightData = isMetric ? {
        value: selectedKg,
        unit: 'metric' as const,
        kg: selectedKg
      } : {
        value: selectedLbs,
        unit: 'imperial' as const,
        lbs: selectedLbs
      };

      // Prepare update data with onboardingData structure
      const updateData: Partial<UserProfile> = {
        fullName: name,
        email: email,
        phoneNumber: phone.replace(/\s/g, ''), // Remove spaces
        onboardingData: {
          height: heightData,
          weight: weightData
        }
      }

      await userService.updateUserProfile(updateData);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to save user data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={false}
      >
        <View style={styles.innerContent}>
          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>{t('profile.accountDetailsForm.fullName')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100], color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder={t('profile.accountDetailsForm.fullNamePlaceholder')}
              placeholderTextColor={Colors.gray[400]}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>{t('profile.accountDetailsForm.email')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100], color: colors.text }, !validateEmail(email) && email.length > 0 && styles.inputError]}
              value={email}
              onChangeText={handleEmailChange}
              placeholder={t('profile.accountDetailsForm.emailPlaceholder')}
              placeholderTextColor={Colors.gray[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!validateEmail(email) && email.length > 0 && (
              <Text style={styles.errorText}>{t('profile.accountDetailsForm.emailError')}</Text>
            )}
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: colors.text }]}>{t('profile.accountDetailsForm.phoneNumber')}</Text>
            <View style={styles.phoneContainer}>
              <TouchableOpacity
                style={[styles.countryCodeContainer, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100] }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.countryFlag, { color: colors.text }]}>🇲🇦</Text>
                <Text style={[styles.countryCode, { color: colors.text }]}>{callingCode}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.phoneInput, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100], color: colors.text }]}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder={t('profile.accountDetailsForm.phonePlaceholder')}
                placeholderTextColor={Colors.gray[400]}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, !isMetric && [styles.switchLabelActive, { color: colors.text }]]}>
              {t('onboarding.height.imperial')}
            </Text>
            <Switch
              value={isMetric}
              onValueChange={setIsMetric}
              trackColor={{ false: Colors.gray[300], true: Colors.gray[300] }}
              thumbColor={colors.icon}
            />
            <Text style={[styles.switchLabel, isMetric && [styles.switchLabelActive, { color: colors.text }]]}>
              {t('onboarding.height.metric')}
            </Text>
          </View>

          <View style={styles.pickerRow}>
            <View style={styles.column}>
              <Text style={[styles.columnLabel, { color: colors.text }]}>{t('onboarding.height.heightLabel')}</Text>
              <View style={styles.pickerContainer}>
                {isMetric ? (
                  <View style={styles.pickerWrapper}>
                    <View style={styles.highlightBar} />
                    <ScrollView
                      ref={cmScrollRef}
                      style={styles.pickerScrollView}
                      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={ITEM_HEIGHT}
                      decelerationRate="fast"
                      onMomentumScrollEnd={handleCmScroll}
                      onScrollEndDrag={handleCmScroll}
                      nestedScrollEnabled={true}
                    >
                      {Array.from({ length: 191 }, (_, i) => i + 60).map((cm) => (
                        <View key={cm} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                          <Text style={[
                            styles.dateText,
                            cm === selectedCm && styles.dateTextSelected
                          ]}>
                            {cm} cm
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <>
                    <View style={styles.pickerWrapper}>
                      <View style={styles.highlightBar} />
                      <ScrollView
                        ref={feetScrollRef}
                        style={styles.pickerScrollView}
                        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={ITEM_HEIGHT}
                        decelerationRate="fast"
                        onMomentumScrollEnd={handleFeetScroll}
                        onScrollEndDrag={handleFeetScroll}
                        nestedScrollEnabled={true}
                      >
                        {Array.from({ length: 7 }, (_, i) => i + 2).map((ft) => (
                          <View key={ft} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                            <Text style={[
                              styles.dateText,
                              ft === selectedFeet && styles.dateTextSelected
                            ]}>
                              {ft} ft
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.pickerWrapper}>
                      <View style={styles.highlightBar} />
                      <ScrollView
                        ref={inchesScrollRef}
                        style={styles.pickerScrollView}
                        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={ITEM_HEIGHT}
                        decelerationRate="fast"
                        onMomentumScrollEnd={handleInchesScroll}
                        onScrollEndDrag={handleInchesScroll}
                        nestedScrollEnabled={true}
                      >
                        {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                          <View key={inch} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                            <Text style={[
                              styles.dateText,
                              inch === selectedInches && styles.dateTextSelected
                            ]}>
                              {inch} in
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.column}>
              <Text style={[styles.columnLabel, { color: colors.text }]}>{t('onboarding.height.weightLabel')}</Text>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerWrapper}>
                  <View style={styles.highlightBar} />
                  <ScrollView
                    ref={weightScrollRef}
                    style={styles.pickerScrollView}
                    contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onMomentumScrollEnd={handleWeightScroll}
                    onScrollEndDrag={handleWeightScroll}
                    nestedScrollEnabled={true}
                  >
                    {isMetric
                      ? Array.from({ length: 171 }, (_, i) => i + 30).map((kg) => (
                        <View key={kg} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                          <Text style={[
                            styles.dateText,
                            kg === selectedKg && styles.dateTextSelected
                          ]}>
                            {kg} kg
                          </Text>
                        </View>
                      ))
                      : Array.from({ length: 381 }, (_, i) => i + 60).map((lbs) => (
                        <View key={lbs} style={[styles.dateOption, { height: ITEM_HEIGHT }]}>
                          <Text style={[
                            styles.dateText,
                            lbs === selectedLbs && styles.dateTextSelected
                          ]}>
                            {lbs} lbs
                          </Text>
                        </View>
                      ))
                    }
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={SharedStyles.footerFloating}>
        <Button
          title={isSaving ? t('profile.accountDetailsForm.saving', 'Saving...') : t('profile.accountDetailsForm.saveChanges')}
          onPress={handleSave}
          disabled={!validateEmail(email) || !name.trim() || isSaving}
          floating
        />
      </View>

      <SuccessModal visible={showSuccessModal} onClose={handleModalClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  pickerScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  innerContent: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
  formSection: {
    marginBottom: 24,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.black,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    color: Colors.black,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.red,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.red,
    marginTop: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  countryPickerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryFlag: {
    fontSize: 24,
  },
  flag: {
    fontSize: 24,
  },
  countryCode: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    color: Colors.black,
  },
  phoneInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  switchLabel: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
  switchLabelActive: {
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 50,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: Colors.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerWrapper: {
    flex: 1,
    height: 250,
    position: 'relative',
    overflow: 'visible',
  },
  highlightBar: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 50,
    marginTop: -25,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    zIndex: 0,
  },
  dateOption: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  dateText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: Colors.gray[400],
  },
  dateTextSelected: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.black,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    width: 270,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.black,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    lineHeight: 18,
  },
  modalButton: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.gray[300],
    paddingVertical: 11,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 17,
    fontFamily: Fonts.semiBold,
    color: '#007AFF',
  },
});
