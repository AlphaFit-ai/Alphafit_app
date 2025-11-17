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

export default function SupplementsScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const { colors, isDarkMode } = useTheme();
  const [takesSupplements, setTakesSupplements] = useState<boolean | null>(null);
  const [supplementsText, setSupplementsText] = useState('');

  const handleContinue = () => {
    if (takesSupplements === true && !supplementsText.trim()) {
      return; // Don't continue if Yes is selected but no text entered
    }
    updateDietData({
      takesSupplements: takesSupplements || false,
      supplements: takesSupplements ? supplementsText : '',
      isCompleted: true,
    });
    setCurrentStep(4);
    router.replace('/(tabs)/diet');
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
          <Text style={[SharedStyles.title, { color: colors.text }]}>{t('diet.supplements.title')}</Text>

          <Image 
            source={require('../../assets/images/diet/supplements.png')} 
            style={SharedStyles.fullWidthImage}
            resizeMode="contain"
          />

          <View style={SharedStyles.buttonGroup}>
          <TouchableOpacity
            style={[
              SharedStyles.choiceButton,
              { backgroundColor: takesSupplements === true ? Colors.black : (isDarkMode ? Colors.gray[800] : Colors.gray[100]), borderColor: takesSupplements === true ? Colors.black : colors.border },
            ]}
            onPress={() => setTakesSupplements(true)}
            activeOpacity={0.7}
          >
            <Text style={[
              SharedStyles.choiceButtonText,
              { color: takesSupplements === true ? Colors.white : colors.text },
            ]}>
              {t('diet.supplements.yes')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              SharedStyles.choiceButton,
              { backgroundColor: takesSupplements === false ? Colors.black : (isDarkMode ? Colors.gray[800] : Colors.gray[100]), borderColor: takesSupplements === false ? Colors.black : colors.border },
            ]}
            onPress={() => {
              setTakesSupplements(false);
              setSupplementsText('');
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              SharedStyles.choiceButtonText,
              { color: takesSupplements === false ? Colors.white : colors.text },
            ]}>
              {t('diet.supplements.no')}
            </Text>
          </TouchableOpacity>
        </View>

        {takesSupplements === true && (
          <TextInput
            style={[SharedStyles.textArea, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100], color: colors.text, borderColor: colors.border }]}
            placeholder={t('diet.supplements.placeholder')}
            placeholderTextColor={Colors.gray[400]}
            value={supplementsText}
            onChangeText={setSupplementsText}
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
          disabled={takesSupplements === null || (takesSupplements === true && !supplementsText.trim())}
          floating
        />
      </View>
    </SafeAreaView>
  );
}