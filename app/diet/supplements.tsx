import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components';
import { Colors, Fonts, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';

export default function SupplementsScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const [takesSupplements, setTakesSupplements] = useState<boolean | null>(null);
  const [supplementsText, setSupplementsText] = useState('');

  const handleContinue = () => {
    updateDietData({
      takesSupplements: takesSupplements || false,
      supplements: takesSupplements ? supplementsText : '',
      isCompleted: true,
    });
    setCurrentStep(4);
    router.replace('/(tabs)/nutrition');
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
        <Text style={SharedStyles.title}>{t('diet.supplements.title')}</Text>

        <Image 
          source={require('../../assets/images/diet/supplements.png')} 
          style={styles.image}
          resizeMode="contain"
        />

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.choiceButton,
              takesSupplements === true && styles.choiceButtonActive,
            ]}
            onPress={() => setTakesSupplements(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.choiceButtonText,
              takesSupplements === true && styles.choiceButtonTextActive,
            ]}>
              {t('diet.supplements.yes')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.choiceButton,
              takesSupplements === false && styles.choiceButtonActive,
            ]}
            onPress={() => {
              setTakesSupplements(false);
              setSupplementsText('');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.choiceButtonText,
              takesSupplements === false && styles.choiceButtonTextActive,
            ]}>
              {t('diet.supplements.no')}
            </Text>
          </TouchableOpacity>
        </View>

        {takesSupplements === true && (
          <TextInput
            style={styles.textArea}
            placeholder={t('diet.supplements.placeholder')}
            placeholderTextColor={Colors.gray[400]}
            value={supplementsText}
            onChangeText={setSupplementsText}
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
          disabled={takesSupplements === null}
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
