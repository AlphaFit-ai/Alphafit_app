import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';

export default function AllergiesScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);
  const [allergiesText, setAllergiesText] = useState('');

  const handleContinue = () => {
    updateDietData({
      hasAllergies: hasAllergies || false,
      allergies: hasAllergies ? allergiesText : '',
    });
    setCurrentStep(2);
    router.push('/diet/meals');
  };

  return (
    <View style={SharedStyles.container}>
      <TouchableOpacity 
        style={SharedStyles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.black} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={SharedStyles.title}>{t('diet.allergies.title')}</Text>

        <Image 
          source={require('../../assets/images/diet/food allergy.png')} 
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              hasAllergies === true && styles.choiceButtonActive,
            ]}
            onPress={() => setHasAllergies(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.choiceButtonText,
              hasAllergies === true && styles.choiceButtonTextActive,
            ]}>
              {t('diet.allergies.yes')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.choiceButton,
              hasAllergies === false && styles.choiceButtonActive,
            ]}
            onPress={() => {
              setHasAllergies(false);
              setAllergiesText('');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.choiceButtonText,
              hasAllergies === false && styles.choiceButtonTextActive,
            ]}>
              {t('diet.allergies.no')}
            </Text>
          </TouchableOpacity>
        </View>

        {hasAllergies === true && (
          <TextInput
            style={styles.textArea}
            placeholder={t('diet.allergies.placeholder')}
            placeholderTextColor={Colors.gray[400]}
            value={allergiesText}
            onChangeText={setAllergiesText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        )}
      </ScrollView>

      <View style={SharedStyles.footerFloating}>
        <Button 
          title={t('onboarding.continue')} 
          onPress={handleContinue} 
          disabled={hasAllergies === null}
          floating
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 60,
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 32,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  choiceButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    alignItems: 'center',
  },
  choiceButtonActive: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  choiceButtonText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.bold,
    color: Colors.black,
  },
  choiceButtonTextActive: {
    color: Colors.white,
  },
  textArea: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 16,
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    color: Colors.black,
    minHeight: 120,
  },
});
