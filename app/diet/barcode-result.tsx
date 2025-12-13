import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../../constants';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';

interface BarcodeProduct {
  scan_id: string;
  image_url: string;
  predictions: Array<{
    food: string;
    confidence: number;
    portion_size: string;
    portion_weight_g: number;
  }>;
  total_nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  timestamp: string;
  source?: string;
}

export default function BarcodeResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { dietData, setCurrentStep } = useDiet();
  const [product, setProduct] = useState<BarcodeProduct | null>(null);

  useEffect(() => {
    if (dietData.barcodeData) {
      try {
        const productData = JSON.parse(dietData.barcodeData);
        console.log('Barcode result received:', productData);
        console.log('Nutrition values:', productData.total_nutrition);
        setProduct(productData);
      } catch (error) {
        console.error('Failed to parse barcode data:', error);
        setCurrentStep(4); // Go back to food scan
      }
    } else {
      setCurrentStep(4); // Go back to food scan if no data
    }
  }, [dietData.barcodeData]);

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: t('diet.foodScan.barcodeResult') || 'Product Information',
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const prediction = product.predictions[0];
  const nutrition = product.total_nutrition;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t('diet.foodScan.barcodeResult') || 'Product Information',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >

        {/* Product Image */}
        {product.image_url && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Nutrition Facts Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {/* Product Name */}
          <View style={styles.productNameContainer}>
            <Text style={[styles.productName, { color: colors.text }]}>
              {prediction.food}
            </Text>
            {prediction.portion_size && prediction.portion_size !== 'N/A' && (
              <Text style={[styles.portionSize, { color: colors.textSecondary }]}>
                {prediction.portion_size}
              </Text>
            )}
            {product.source && (
              <View style={styles.sourceBadge}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
                <Text style={styles.sourceText}>{product.source}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {t('diet.statistics.nutritionFacts') || 'Nutrition Facts'}
          </Text>
          <Text style={[styles.servingSize, { color: colors.textSecondary }]}>
            Per 100g
          </Text>

          {/* Calories */}
          <View style={styles.caloriesContainer}>
            <View style={styles.caloriesRow}>
              <Ionicons name="flame" size={32} color={Colors.error} />
              <View style={styles.caloriesTextContainer}>
                <Text style={[styles.caloriesValue, { color: colors.text }]}>
                  {Math.round(nutrition.calories)}
                </Text>
                <Text style={[styles.caloriesLabel, { color: colors.textSecondary }]}>
                  {t('diet.statistics.caloriesUnit') || 'cal'}
                </Text>
              </View>
            </View>
          </View>

          {/* Macronutrients */}
          <View style={styles.macrosContainer}>
            {/* First Row */}
            <View style={styles.macroRow}>
              {/* Protein */}
              <View style={styles.macroItem}>
                <View style={[styles.macroIconContainer, { backgroundColor: Colors.primary + '20' }]}>
                  <Ionicons name="fitness" size={24} color={Colors.primary} />
                </View>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                  {t('diet.statistics.protein') || 'Protein'}
                </Text>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {nutrition.protein.toFixed(1)}g
                </Text>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        backgroundColor: Colors.primary,
                        width: `${Math.min((nutrition.protein / 30) * 100, 100)}%`
                      }
                    ]}
                  />
                </View>
              </View>

              {/* Carbs */}
              <View style={styles.macroItem}>
                <View style={[styles.macroIconContainer, { backgroundColor: Colors.warning + '20' }]}>
                  <Ionicons name="leaf" size={24} color={Colors.warning} />
                </View>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                  {t('diet.statistics.carbs') || 'Carbs'}
                </Text>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {nutrition.carbs.toFixed(1)}g
                </Text>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        backgroundColor: Colors.warning,
                        width: `${Math.min((nutrition.carbs / 50) * 100, 100)}%`
                      }
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Second Row */}
            <View style={styles.macroRow}>
              {/* Fat */}
              <View style={styles.macroItem}>
                <View style={[styles.macroIconContainer, { backgroundColor: Colors.info + '20' }]}>
                  <Ionicons name="water" size={24} color={Colors.info} />
                </View>
                <Text style={[styles.macroLabel, { color: colors.textSecondary }]}>
                  {t('diet.statistics.fat') || 'Fat'}
                </Text>
                <Text style={[styles.macroValue, { color: colors.text }]}>
                  {nutrition.fat.toFixed(1)}g
                </Text>
                <View style={styles.macroBar}>
                  <View
                    style={[
                      styles.macroBarFill,
                      {
                        backgroundColor: Colors.info,
                        width: `${Math.min((nutrition.fat / 20) * 100, 100)}%`
                      }
                    ]}
                  />
                </View>
              </View>

              {/* Empty space for symmetry */}
              <View style={styles.macroItem} />
            </View>
          </View>

          {/* Additional Nutrients */}
          {(nutrition.fiber > 0 || nutrition.sugar > 0) && (
            <View style={styles.additionalNutrients}>
              {nutrition.fiber > 0 && (
                <View style={styles.nutrientRow}>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                    Fiber
                  </Text>
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {nutrition.fiber.toFixed(1)}g
                  </Text>
                </View>
              )}
              {nutrition.sugar > 0 && (
                <View style={styles.nutrientRow}>
                  <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                    Sugar
                  </Text>
                  <Text style={[styles.nutrientValue, { color: colors.text }]}>
                    {nutrition.sugar.toFixed(1)}g
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setCurrentStep(4)}
          >
            <Ionicons name="scan" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.secondaryButtonText]}>
              {t('diet.statistics.scanAnother') || 'Scan Another'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: Spacing.lg,
  },
  productNameContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  productName: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  portionSize: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: Colors.primary,
    marginLeft: 4,
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  servingSize: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.lg,
  },
  caloriesContainer: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesTextContainer: {
    marginLeft: Spacing.md,
  },
  caloriesValue: {
    fontSize: 32,
    fontFamily: Fonts.bold,
  },
  caloriesLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  macrosContainer: {
    marginTop: Spacing.sm,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  macroItem: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  macroIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  macroLabel: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  macroValue: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  macroBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  additionalNutrients: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nutrientLabel: {
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  nutrientValue: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  actionButtons: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Spacing.md,
  },
  secondaryButton: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
});
