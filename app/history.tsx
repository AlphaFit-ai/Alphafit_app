import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { foodScanService, FoodScanDto } from '../services';

export default function HistoryScreen() {
    const { t } = useTranslation();
    const { colors, isDarkMode } = useTheme();
    const router = useRouter();

    const [scans, setScans] = useState<FoodScanDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filter, setFilter] = useState('all');

    const loadScans = async (pageNum: number, shouldRefresh = false) => {
        try {
            if (pageNum === 0 && !shouldRefresh) setLoading(true);

            const response = await foodScanService.getUserFoodScans(pageNum, 20);

            if (shouldRefresh) {
                setScans(response.content);
            } else {
                setScans(prev => [...prev, ...response.content]);
            }

            setHasMore(pageNum < response.totalPages - 1);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadScans(0, true);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(0);
        loadScans(0, true);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadScans(nextPage);
        }
    };

    const handlePressItem = (scan: FoodScanDto) => {
        router.push({
            pathname: '/diet-statistics',
            params: { scanId: scan.id }
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderItem = ({ item }: { item: FoodScanDto }) => {
        const foodName = item.predictions && item.predictions.length > 0
            ? item.predictions[0].foodName
            : t('common.unknownFood', 'Unknown Food');

        const calories = item.nutritionSummary?.totalCalories || 0;

        return (
            <TouchableOpacity
                style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handlePressItem(item)}
            >
                <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                    resizeMode="cover"
                />
                <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                            {foodName}
                        </Text>
                        <Text style={[styles.itemDate, { color: colors.textSecondary }]}>
                            {formatDate(item.createdAt)}
                        </Text>
                    </View>

                    <View style={styles.itemStats}>
                        <View style={styles.statBadge}>
                            <Ionicons name="flame" size={14} color={Colors.primary} />
                            <Text style={[styles.statText, { color: colors.text }]}>
                                {Math.round(calories)} kcal
                            </Text>
                        </View>

                        <View style={[styles.statusBadge, {
                            backgroundColor: item.status === 'COMPLETED' ? Colors.success + '20' : Colors.warning + '20'
                        }]}>
                            <Text style={[styles.statusText, {
                                color: item.status === 'COMPLETED' ? Colors.success : Colors.warning
                            }]}>
                                {item.status === 'COMPLETED' ? t('common.completed', 'Completed') : item.status}
                            </Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: t('history.title', 'History'),
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                    headerTitleStyle: {
                        fontFamily: Fonts.bold,
                        fontSize: 18,
                    },
                    headerTitleAlign: 'center',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
                            <Ionicons name="filter" size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <Modal
                visible={showFilterModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFilterModal(false)}
                >
                    <View style={[styles.filterModal, { backgroundColor: colors.card }]}>
                        <Text style={[styles.filterTitle, { color: colors.text }]}>{t('history.filterBy', 'Filter By')}</Text>

                        {['all', 'completed', 'processing', 'failed'].map((filterType) => (
                            <TouchableOpacity
                                key={filterType}
                                style={[
                                    styles.filterOption,
                                    filter === filterType && { backgroundColor: Colors.primary + '20' }
                                ]}
                                onPress={() => {
                                    setFilter(filterType);
                                    setShowFilterModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    { color: filter === filterType ? Colors.primary : colors.text }
                                ]}>
                                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                                </Text>
                                {filter === filterType && (
                                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            <FlatList
                data={scans.filter(scan => {
                    if (filter === 'all') return true;
                    if (filter === 'completed') return scan.status === 'COMPLETED';
                    if (filter === 'processing') return scan.status === 'PROCESSING' || scan.status === 'PENDING';
                    if (filter === 'failed') return scan.status === 'FAILED';
                    return true;
                })}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                                {t('history.noHistory', 'No History Yet')}
                            </Text>
                            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                                {t('history.startScanning', 'Start scanning food to see your history here.')}
                            </Text>
                        </View>
                    ) : null
                }
                ListFooterComponent={
                    loading && !refreshing ? (
                        <View style={styles.loader}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: Spacing.screenPaddingHorizontal,
        paddingBottom: 40,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 12,
        borderRadius: Spacing.radius.lg,
        borderWidth: 1,
        gap: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: Spacing.radius.md,
        backgroundColor: '#f0f0f0',
    },
    itemContent: {
        flex: 1,
        gap: 4,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: Fonts.sizes.base,
        fontFamily: Fonts.semiBold,
        flex: 1,
        marginRight: 8,
    },
    itemDate: {
        fontSize: Fonts.sizes.xs,
        fontFamily: Fonts.regular,
    },
    itemStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: Fonts.sizes.sm,
        fontFamily: Fonts.medium,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
        gap: 16,
    },
    emptyStateTitle: {
        fontSize: Fonts.sizes.xl,
        fontFamily: Fonts.bold,
    },
    emptyStateText: {
        fontSize: Fonts.sizes.base,
        fontFamily: Fonts.regular,
        textAlign: 'center',
        maxWidth: '80%',
    },
    loader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterModal: {
        width: '80%',
        borderRadius: Spacing.radius.lg,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    filterTitle: {
        fontSize: Fonts.sizes.lg,
        fontFamily: Fonts.bold,
        marginBottom: 16,
        textAlign: 'center',
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: Spacing.radius.md,
        marginBottom: 8,
    },
    filterOptionText: {
        fontSize: Fonts.sizes.base,
        fontFamily: Fonts.medium,
    },
});
