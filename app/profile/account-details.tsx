import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';
import { profileQuery } from '../../hooks/queries';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services';
import { logError, normalizeApiError, NormalizedError } from '../../services/apiError';
import { queryKeys } from '../../services/queryKeys';
import { getSessionEpoch, isSessionCurrent, signOut } from '../../services/session';
import type { UserProfile } from '../../services/userService';
import {
  Button,
  Dialog,
  ErrorState,
  Input,
  Screen,
  Skeleton,
  SkeletonGroup,
  Text,
  useToast,
  WheelPicker,
} from '../../src/ui';
import type { WheelItem } from '../../src/ui';

const range = (from: number, count: number, unit: string): WheelItem[] =>
  Array.from({ length: count }, (_, i) => ({
    key: String(from + i),
    label: `${from + i} ${unit}`,
  }));
const CM_ITEMS = range(60, 191, 'cm');
const FEET_ITEMS = range(2, 7, 'ft');
const INCH_ITEMS = range(0, 12, 'in');
const KG_ITEMS = range(30, 171, 'kg');
const LB_ITEMS = range(60, 381, 'lb');

function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
  } else if (cleaned.length <= 10) {
    return cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6) + ' ' + cleaned.slice(6);
  }
  return cleaned.slice(0, 10);
}

export default function AccountDetailsScreen() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { tokens } = useTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const callingCode = '+212';
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<NormalizedError | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isMetric, setIsMetric] = useState(true);
  const [selectedFeet, setSelectedFeet] = useState(5);
  const [selectedInches, setSelectedInches] = useState(7);
  const [selectedCm, setSelectedCm] = useState(170);
  const [selectedLbs, setSelectedLbs] = useState(150);
  const [selectedKg, setSelectedKg] = useState(70);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const loadUserData = useCallback(async () => {
    const epoch = getSessionEpoch();
    try {
      setIsLoading(true);
      setLoadError(null);
      // From the query cache when it is fresh (Profile just loaded it), from the api otherwise.
      const profile = await client.fetchQuery(profileQuery);
      if (!isSessionCurrent(epoch)) return;

      // Set basic info
      setName(profile.fullName || '');
      setEmail(profile.email || '');

      // Set phone number
      if (profile.phoneNumber) {
        // Remove any non-digit characters and format
        const cleanPhone = profile.phoneNumber.replace(/\D/g, '');
        // Remove the Morocco country code if present
        const localNumber = cleanPhone.startsWith('212') ? cleanPhone.substring(3) : cleanPhone;
        setPhone(formatPhoneNumber(localNumber));
      }

      // Set height from onboardingData
      const heightData = profile.onboardingData?.height;
      if (heightData) {
        if (heightData.unit === 'metric' && heightData.cm) {
          setIsMetric(true);
          setSelectedCm(Math.round(heightData.cm));
        } else if (
          heightData.unit === 'imperial' &&
          heightData.feet &&
          heightData.inches !== undefined
        ) {
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
    } catch (error: unknown) {
      if (!isSessionCurrent(epoch)) return;
      const normalized = normalizeApiError(error);
      if (normalized.status === 404) {
        // The account no longer exists: leave cleanly (an expired session signs out in the api client).
        await signOut();
        router.replace('/');
        return;
      }
      logError('account.load', error);
      setLoadError(normalized);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void loadUserData();
  }, [loadUserData]);

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

  const handleSave = async () => {
    if (!validateEmail(email)) {
      return;
    }

    try {
      setIsSaving(true);

      // Prepare height data
      const heightData = isMetric
        ? {
            value: selectedCm,
            unit: 'metric' as const,
            cm: selectedCm,
          }
        : {
            value: selectedFeet * 12 + selectedInches,
            unit: 'imperial' as const,
            feet: selectedFeet,
            inches: selectedInches,
          };

      // Prepare weight data
      const weightData = isMetric
        ? {
            value: selectedKg,
            unit: 'metric' as const,
            kg: selectedKg,
          }
        : {
            value: selectedLbs,
            unit: 'imperial' as const,
            lbs: selectedLbs,
          };

      // Prepare update data with onboardingData structure
      const updateData: Partial<UserProfile> = {
        fullName: name,
        email: email,
        phoneNumber: phone.replace(/\s/g, ''), // Remove spaces
        onboardingData: {
          height: heightData,
          weight: weightData,
        },
      };

      const saved = await userService.updateUserProfile(updateData);
      // Profile and Home read the same cache: show the new values there without another request.
      client.setQueryData(queryKeys.profile, saved);
      setShowSuccessModal(true);
    } catch (error: unknown) {
      logError('account.save', error);
      const normalized = normalizeApiError(error);
      toast.show(
        normalized.kind === 'offline'
          ? t('errors.offline')
          : t('profile.accountDetailsForm.saveError'),
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleModalClose = () => {
    router.back();
  };

  const emailInvalid = !validateEmail(email) && email.length > 0;

  if (isLoading) {
    return (
      <Screen scroll noTopInset>
        <SkeletonGroup label={t('common.loading')} style={styles.skeleton}>
          <Skeleton height={56} radius={12} />
          <Skeleton height={56} radius={12} />
          <Skeleton height={56} radius={12} />
          <Skeleton height={250} radius={16} />
        </SkeletonGroup>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen noTopInset>
        <ErrorState kind={loadError.kind} onRetry={() => void loadUserData()} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      keyboard
      noTopInset
      contentStyle={styles.content}
      footer={
        <Button
          title={
            isSaving
              ? t('profile.accountDetailsForm.saving')
              : t('profile.accountDetailsForm.saveChanges')
          }
          onPress={handleSave}
          disabled={!validateEmail(email) || !name.trim() || isSaving}
        />
      }
    >
      <Input
        label={t('profile.accountDetailsForm.fullName')}
        value={name}
        onChangeText={setName}
        placeholder={t('profile.accountDetailsForm.fullNamePlaceholder')}
        autoComplete="name"
      />
      <Input
        label={t('profile.accountDetailsForm.email')}
        value={email}
        onChangeText={handleEmailChange}
        placeholder={t('profile.accountDetailsForm.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        error={emailInvalid ? t('profile.accountDetailsForm.emailError') : undefined}
      />
      <Input
        label={t('profile.accountDetailsForm.phoneNumber')}
        value={phone}
        onChangeText={handlePhoneChange}
        placeholder={t('profile.accountDetailsForm.phonePlaceholder')}
        keyboardType="phone-pad"
        maxLength={12}
        leftIcon={<Text variant="bodyStrong">{`🇲🇦 ${callingCode}`}</Text>}
      />

      <View style={styles.switchRow}>
        <Text tone={isMetric ? 'subtle' : 'default'} variant={isMetric ? 'label' : 'bodyStrong'}>
          {t('onboarding.height.imperial')}
        </Text>
        <Switch
          value={isMetric}
          onValueChange={setIsMetric}
          accessibilityLabel={t('onboarding.height.metric')}
          trackColor={{ false: tokens.color.borderStrong, true: tokens.color.borderStrong }}
          thumbColor={tokens.color.action}
        />
        <Text tone={isMetric ? 'default' : 'subtle'} variant={isMetric ? 'bodyStrong' : 'label'}>
          {t('onboarding.height.metric')}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.column}>
          <Text variant="label" style={styles.center}>
            {t('onboarding.height.heightLabel')}
          </Text>
          {isMetric ? (
            <WheelPicker
              label={t('onboarding.height.heightLabel')}
              items={CM_ITEMS}
              selectedIndex={selectedCm - 60}
              onChange={(i) => setSelectedCm(60 + i)}
            />
          ) : (
            <View style={styles.row}>
              <View style={styles.column}>
                <WheelPicker
                  label={`${t('onboarding.height.heightLabel')} ft`}
                  items={FEET_ITEMS}
                  selectedIndex={selectedFeet - 2}
                  onChange={(i) => setSelectedFeet(2 + i)}
                />
              </View>
              <View style={styles.column}>
                <WheelPicker
                  label={`${t('onboarding.height.heightLabel')} in`}
                  items={INCH_ITEMS}
                  selectedIndex={selectedInches}
                  onChange={setSelectedInches}
                />
              </View>
            </View>
          )}
        </View>
        <View style={styles.column}>
          <Text variant="label" style={styles.center}>
            {t('onboarding.height.weightLabel')}
          </Text>
          {isMetric ? (
            <WheelPicker
              key="kg"
              label={t('onboarding.height.weightLabel')}
              items={KG_ITEMS}
              selectedIndex={selectedKg - 30}
              onChange={(i) => setSelectedKg(30 + i)}
            />
          ) : (
            <WheelPicker
              key="lb"
              label={t('onboarding.height.weightLabel')}
              items={LB_ITEMS}
              selectedIndex={selectedLbs - 60}
              onChange={(i) => setSelectedLbs(60 + i)}
            />
          )}
        </View>
      </View>

      <Dialog
        visible={showSuccessModal}
        title={t('profile.accountDetailsForm.successTitle')}
        message={t('profile.accountDetailsForm.successMessage')}
        feedback="confirm"
        dismissable={false}
        actions={[{ label: t('profile.accountDetailsForm.ok'), onPress: handleModalClose }]}
        onClose={() => setShowSuccessModal(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 24 },
  skeleton: { paddingTop: 16, gap: 16 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 16,
  },
  row: { flexDirection: 'row', gap: 12 },
  column: { flex: 1, gap: 8 },
  center: { textAlign: 'center' },
});
