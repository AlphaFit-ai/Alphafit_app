import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components';
import { Colors, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

export default function AllergiesScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const { colors, isDarkMode } = useTheme();
  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);
  const [allergiesText, setAllergiesText] = useState('');

  const handleSelectNo = async () => {
    setHasAllergies(false);
    setAllergiesText('');
    await updateDietData({
      hasAllergies: false,
      allergies: '',
    });
    setTimeout(() => {
      setCurrentStep(2);
    }, 300);
  };

  const handleSubmitAllergies = async () => {
    if (!allergiesText.trim()) return;
    await updateDietData({
      hasAllergies: true,
      allergies: allergiesText,
    });
    setTimeout(() => {
      setCurrentStep(2);
    }, 300);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
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
            onPress={handleSelectNo}
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
          <>
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
            <Button 
              title="Submit" 
              onPress={handleSubmitAllergies} 
              disabled={!allergiesText.trim()}
              icon="checkmark"
            />
          </>
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
    justifyContent: 'center',
    paddingVertical: 60,
  },
  content: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },
});
