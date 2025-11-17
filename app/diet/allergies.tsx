import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { Colors, SharedStyles } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

export default function AllergiesScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const { colors, isDarkMode } = useTheme();
  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);
  const [allergiesText, setAllergiesText] = useState('');

  const handleContinue = () => {
    if (hasAllergies === true && !allergiesText.trim()) {
      return; // Don't continue if Yes is selected but no text entered
    }
    updateDietData({
      hasAllergies: hasAllergies || false,
      allergies: hasAllergies ? allergiesText : '',
    });
    setCurrentStep(2);
    router.push('/diet/meals');
  };

  return (
    <SafeAreaView style={[SharedStyles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity 
        style={SharedStyles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={colors.icon} />
      </TouchableOpacity>

      <ScrollView 
        style={SharedStyles.scrollView}
        contentContainerStyle={SharedStyles.scrollContentCentered}
        showsVerticalScrollIndicator={false}
      >
        <View style={SharedStyles.innerContent}>
          <Text style={[SharedStyles.title, { color: colors.text }]}>{t('diet.allergies.title')}</Text>

          <Image 
            source={require('../../assets/images/diet/food allergy.png')} 
            style={SharedStyles.fullWidthImage}
            resizeMode="contain"
          />

          <View style={SharedStyles.buttonGroup}>
          <TouchableOpacity
            style={[
              SharedStyles.choiceButton,
              { backgroundColor: hasAllergies === true ? Colors.black : (isDarkMode ? Colors.gray[800] : Colors.gray[100]), borderColor: hasAllergies === true ? Colors.black : colors.border },
            ]}
            onPress={() => setHasAllergies(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              SharedStyles.choiceButtonText,
              { color: hasAllergies === true ? Colors.white : colors.text },
            ]}>
              {t('diet.allergies.yes')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              SharedStyles.choiceButton,
              { backgroundColor: hasAllergies === false ? Colors.black : (isDarkMode ? Colors.gray[800] : Colors.gray[100]), borderColor: hasAllergies === false ? Colors.black : colors.border },
            ]}
            onPress={() => {
              setHasAllergies(false);
              setAllergiesText('');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              SharedStyles.choiceButtonText,
              { color: hasAllergies === false ? Colors.white : colors.text },
            ]}>
              {t('diet.allergies.no')}
            </Text>
          </TouchableOpacity>
        </View>

        {hasAllergies === true && (
          <TextInput
            style={[SharedStyles.textArea, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100], color: colors.text, borderColor: colors.border }]}
            placeholder={t('diet.allergies.placeholder')}
            placeholderTextColor={Colors.gray[400]}
            value={allergiesText}
            onChangeText={setAllergiesText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        )}
        </View>
      </ScrollView>

      <View style={SharedStyles.footerFloating}>
        <Button 
          title={t('onboarding.continue')} 
          onPress={handleContinue} 
          disabled={hasAllergies === null || (hasAllergies === true && !allergiesText.trim())}
          floating
        />
      </View>
    </SafeAreaView>
  );
}
