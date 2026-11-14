import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useDiet } from '../../context/DietContext';
import { useTheme } from '../../context/ThemeContext';
import { logError } from '../../services/apiError';
import type { BarcodeProductDto } from '../../services/barcodeService';
import { AppImage, Button, PageHeader, Screen, Skeleton, SkeletonGroup, Text } from '../../src/ui';

/** Nutrition of a scanned product, per 100 g, as the barcode lookup returns it. */
export default function BarcodeResultScreen() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const c = tokens.color;
  const { dietData, setCurrentStep } = useDiet();
  const [product, setProduct] = useState<BarcodeProductDto | null>(null);

  useEffect(() => {
    if (!dietData.barcodeData) {
      setCurrentStep(4); // Go back to food scan if no data
      return;
    }
    try {
      const productData = JSON.parse(dietData.barcodeData) as BarcodeProductDto;
      // A product with no prediction has nothing to show: go back instead of reading `predictions[0]`.
      if (!productData.predictions?.length || !productData.total_nutrition) {
        setCurrentStep(4);
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- written before this React Compiler check (eslint-config-expo 58); it loads or syncs state on purpose. Refactor separately.
      setProduct(productData);
    } catch (error) {
      logError('barcodeResult.parse', error);
      setCurrentStep(4); // Go back to food scan
    }
  }, [dietData.barcodeData, setCurrentStep]);

  // Shown in the Diet tab (step 6): back returns to the scan.
  const header = (
    <PageHeader title={t('diet.foodScan.barcodeResult')} back onBack={() => setCurrentStep(4)} />
  );

  if (!product) {
    return (
      <Screen scroll>
        {header}
        <SkeletonGroup label={t('common.loading')} style={styles.skeleton}>
          <Skeleton height={180} radius={20} />
          <Skeleton height={120} radius={16} />
        </SkeletonGroup>
      </Screen>
    );
  }

  const prediction = product.predictions[0];
  const n = product.total_nutrition;
  const macros = [
    { key: 'protein', label: t('diet.statistics.protein'), grams: n.protein, color: c.success },
    { key: 'carbs', label: t('diet.statistics.carbs'), grams: n.carbs, color: c.warning },
    { key: 'fat', label: t('diet.statistics.fat'), grams: n.fat, color: c.accent },
  ];

  return (
    <Screen
      scroll
      contentStyle={styles.content}
      footer={
        <Button
          variant="accent"
          icon="scan"
          iconPosition="left"
          title={t('diet.statistics.scanAnother')}
          onPress={() => setCurrentStep(4)}
        />
      }
    >
      {header}
      {product.image_url ? (
        <AppImage
          source={{ uri: product.image_url }}
          contentFit="contain"
          accessible={false}
          style={[styles.image, { backgroundColor: c.surfaceMuted }]}
        />
      ) : null}

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text variant="heading" accessibilityRole="header">
          {prediction.food}
        </Text>
        {prediction.portion_size && prediction.portion_size !== 'N/A' ? (
          <Text tone="muted">{prediction.portion_size}</Text>
        ) : null}
        {product.source ? (
          <View style={styles.source}>
            <Ionicons name="information-circle-outline" size={16} color={c.accentText} />
            <Text variant="caption" tone="accent">
              {product.source}
            </Text>
          </View>
        ) : null}

        <Text variant="label" tone="muted" style={styles.gap}>
          {t('diet.statistics.nutritionFacts')} · {t('diet.foodScan.per100g')}
        </Text>
        <View style={styles.baseline}>
          <Ionicons name="flame" size={28} color={c.accentText} />
          <Text variant="display">{Math.round(n.calories)}</Text>
          <Text tone="muted">{t('diet.statistics.caloriesUnit')}</Text>
        </View>

        <View style={styles.macros}>
          {macros.map((m) => (
            <View key={m.key} style={[styles.macro, { backgroundColor: c.surfaceMuted }]}>
              <View style={styles.baseline}>
                <View style={[styles.dot, { backgroundColor: m.color }]} />
                <Text variant="caption" tone="muted">
                  {m.label}
                </Text>
              </View>
              <Text variant="subheading">{m.grams.toFixed(1)}g</Text>
            </View>
          ))}
        </View>

        {n.fiber > 0 ? (
          <View style={styles.row}>
            <Text tone="muted">{t('diet.statistics.fiber')}</Text>
            <Text variant="bodyStrong">{n.fiber.toFixed(1)}g</Text>
          </View>
        ) : null}
        {n.sugar > 0 ? (
          <View style={styles.row}>
            <Text tone="muted">{t('diet.statistics.sugar')}</Text>
            <Text variant="bodyStrong">{n.sugar.toFixed(1)}g</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: 16 },
  content: { paddingBottom: 24, gap: 16 },
  image: { width: '100%', height: 200, borderRadius: 20 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  source: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gap: { marginTop: 12 },
  baseline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macros: { flexDirection: 'row', gap: 8, marginTop: 8 },
  macro: { flex: 1, borderRadius: 14, padding: 10, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8 },
});
