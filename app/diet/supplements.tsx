import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components';
import { Colors, SharedStyles, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

export default function SupplementsScreen() {
  const { t } = useTranslation();
  const { updateDietData, setCurrentStep } = useDiet();
  const { colors, isDarkMode } = useTheme();
  const [takesSupplements, setTakesSupplements] = useState<boolean | null>(null);
  const [supplementsText, setSupplementsText] = useState('');

  const handleSelectNo = () => {
    setTakesSupplements(false);
    setSupplementsText('');
    updateDietData({
      takesSupplements: false,
      supplements: '',
      isCompleted: true,
    });
  };

  const handleSubmitSupplements = () => {
    if (!supplementsText.trim()) return;
    updateDietData({
      takesSupplements: true,
      supplements: supplementsText,
      isCompleted: true,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
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
            onPress={handleSelectNo}
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
          <>
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
            <Button 
              title="Finish" 
              onPress={handleSubmitSupplements} 
              disabled={!supplementsText.trim()}
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