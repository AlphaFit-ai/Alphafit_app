import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { FoodScanDto } from '../services';

interface FoodScanDetailsProps {
    scanResult: FoodScanDto | null;
    loading: boolean;
    recommendations: string[];
    loadingRecommendations: boolean;
    onClose?: () => void;
    onScanAnother?: () => void;
    isModal?: boolean;
}

export default function FoodScanDetails({
    scanResult,
    loading,
    recommendations,
    loadingRecommendations,
    onClose,
    onScanAnother,
    isModal = false,
}: FoodScanDetailsProps) {
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();

    const getTotalNutrition = () => {
        if (!scanResult?.predictions || scanResult.predictions.length === 0) {
            return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }

        return scanResult.predictions.reduce(
            (acc, pred) => ({
                calories: acc.calories + (pred.calories || 0),
                protein: acc.protein + (pred.protein || 0),
                carbs: acc.carbs + (pred.carbs || 0),
                fat: acc.fat + (pred.fat || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary, marginTop: 16 }]}>
                    {t('diet.statistics.loadingResults')}
                </Text>
            </View>
        );
    }

    const totalNutrition = getTotalNutrition();
    const imageUrl = scanResult?.imageUrl;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }, isModal && styles.modalContent]}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >

                {/* Food Image */}
                <View style={styles.foodImageCard}>
                    {imageUrl && (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.foodImage}
                            resizeMode="cover"
                        />
                    )}

                    {/* Close Button for Modal */}
                    {isModal && onClose && (
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close" size={24} color={Colors.white} />
                        </TouchableOpacity>
                    )}

                    {scanResult && scanResult.predictions && scanResult.predictions.length > 0 && (
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                {scanResult.predictions.map(p => p.food).join(' + ')}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Show AI Results or Empty State */}
                {scanResult && scanResult.predictions && scanResult.predictions.length > 0 ? (
                    <>
                        {/* Nutrition Facts */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                {t('diet.statistics.nutritionFacts', 'Nutrition Facts')}
                            </Text>
                            <View style={styles.nutrientsGrid}>
                                <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={[styles.nutrientIconContainer, { backgroundColor: Colors.primary + '20' }]}>
                                        <Ionicons name="flame" size={24} color={Colors.primary} />
                                    </View>
                                    <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{t('diet.statistics.calories')}</Text>
                                    <View style={styles.nutrientValueContainer}>
                                        <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                            {Math.round(totalNutrition.calories)}
                                        </Text>
                                        <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>kcal</Text>
                                    </View>
                                </View>

                                <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={[styles.nutrientIconContainer, { backgroundColor: Colors.error + '20' }]}>
                                        <Ionicons name="fitness" size={24} color={Colors.error} />
                                    </View>
                                    <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{t('diet.statistics.protein')}</Text>
                                    <View style={styles.nutrientValueContainer}>
                                        <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                            {totalNutrition.protein.toFixed(1)}
                                        </Text>
                                        <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>g</Text>
                                    </View>
                                </View>

                                <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={[styles.nutrientIconContainer, { backgroundColor: Colors.warning + '20' }]}>
                                        <Ionicons name="nutrition" size={24} color={Colors.warning} />
                                    </View>
                                    <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{t('diet.statistics.carbs')}</Text>
                                    <View style={styles.nutrientValueContainer}>
                                        <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                            {totalNutrition.carbs.toFixed(1)}
                                        </Text>
                                        <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>g</Text>
                                    </View>
                                </View>

                                <View style={[styles.nutrientCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={[styles.nutrientIconContainer, { backgroundColor: Colors.info + '20' }]}>
                                        <Ionicons name="water" size={24} color={Colors.info} />
                                    </View>
                                    <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>{t('diet.statistics.fat')}</Text>
                                    <View style={styles.nutrientValueContainer}>
                                        <Text style={[styles.nutrientValue, { color: colors.text }]}>
                                            {totalNutrition.fat.toFixed(1)}
                                        </Text>
                                        <Text style={[styles.nutrientUnit, { color: colors.textSecondary }]}>g</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* All Detected Items */}
                        {scanResult.predictions && scanResult.predictions.length > 1 && (
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    {t('diet.statistics.allDetectedItems')}
                                </Text>
                                <View style={[styles.recommendationsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    {scanResult.predictions.map((prediction, index) => (
                                        <View key={index} style={styles.recommendationRow}>
                                            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.recommendationText, { color: colors.text, fontFamily: Fonts.semiBold }]}>
                                                    {prediction.food}
                                                </Text>
                                                <Text style={[styles.nutrientLabel, { color: colors.textSecondary }]}>
                                                    {Math.round(prediction.calories || 0)} {t('diet.statistics.caloriesUnit')}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* AI Recommendations */}
                        <View style={styles.section}>
                            <View style={styles.recommendationsHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                                    {t('diet.statistics.personalizedRecommendations')}
                                </Text>
                            </View>

                            {loadingRecommendations ? (
                                <View style={[styles.recommendationsCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', padding: 32 }]}>
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                    <Text style={[styles.nutrientLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                                        {t('diet.statistics.analyzingMeal')}
                                    </Text>
                                </View>
                            ) : (
                                <View style={[styles.recommendationsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    {recommendations.map((recommendation, index) => (
                                        <View key={index} style={styles.recommendationRow}>
                                            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                                            <Text style={[styles.recommendationText, { color: colors.text }]}>
                                                {recommendation}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </>
                ) : (
                    /* Empty state - Still processing or no results */
                    <View style={styles.section}>
                        <View style={[
                            styles.emptyStateCard,
                            {
                                backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white,
                                borderColor: isDarkMode ? Colors.gray[700] : Colors.gray[200],
                            },
                        ]}>
                            <Ionicons name="sparkles" size={48} color={Colors.warning} />
                            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                                {t('diet.statistics.analyzing', 'AI Analysis in Progress')}
                            </Text>
                            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                {t('diet.statistics.analyzeMessage', 'Your meal is being analyzed by AI. Results will appear shortly!')}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Scan Another Button */}
                {onScanAnother && (
                    <TouchableOpacity
                        style={[
                            styles.scanButton,
                            {
                                backgroundColor: Colors.primary,
                            },
                        ]}
                        onPress={onScanAnother}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="camera" size={20} color={Colors.white} />
                        <Text style={styles.scanButtonText}>
                            {t('diet.statistics.scanAnother', 'Scan Another Meal')}
                        </Text>
                    </TouchableOpacity>
                )}
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
    foodImageCard: {
        width: '100%',
        height: 300,
        borderBottomLeftRadius: Spacing.radius.full,
        borderBottomRightRadius: Spacing.radius.full,
        overflow: 'hidden',
        marginBottom: 32,
    },
    foodImage: {
        width: '100%',
        height: '100%',
    },
    section: {
        marginBottom: 32,
        paddingHorizontal: Spacing.screenPaddingHorizontal,
    },
    sectionTitle: {
        fontSize: Fonts.sizes.xl,
        fontFamily: Fonts.bold,
        marginBottom: 16,
    },
    nutrientsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
    },
    nutrientCard: {
        width: '48%',
        borderRadius: Spacing.radius.lg,
        borderWidth: 1,
        padding: 16,
        alignItems: 'center',
    },
    nutrientIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    nutrientLabel: {
        fontSize: Fonts.sizes.sm,
        fontFamily: Fonts.regular,
        marginBottom: 4,
    },
    nutrientValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    nutrientValue: {
        fontSize: Fonts.sizes['2xl'],
        fontFamily: Fonts.bold,
    },
    nutrientUnit: {
        fontSize: Fonts.sizes.sm,
        fontFamily: Fonts.regular,
        marginLeft: 4,
    },
    recommendationsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    recommendationsCard: {
        borderRadius: Spacing.radius.lg,
        borderWidth: 1,
        padding: 20,
    },
    recommendationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    recommendationText: {
        flex: 1,
        fontSize: Fonts.sizes.base,
        fontFamily: Fonts.regular,
        lineHeight: 22,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: Spacing.screenPaddingHorizontal,
        borderRadius: Spacing.radius.full,
        gap: 8,
        marginHorizontal: Spacing.screenPaddingHorizontal,
        marginBottom: 16,
    },
    scanButtonText: {
        fontSize: Fonts.sizes.lg,
        fontFamily: Fonts.semiBold,
        color: Colors.white,
    },
    emptyStateCard: {
        borderRadius: Spacing.radius.lg,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateTitle: {
        fontSize: Fonts.sizes.xl,
        fontFamily: Fonts.bold,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateText: {
        fontSize: Fonts.sizes.base,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        lineHeight: 22,
    },
    statusBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: Colors.white,
        fontSize: 13,
        fontFamily: Fonts.medium,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    modalContent: {
        flex: 0,
        height: '90%',
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
});
