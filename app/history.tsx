import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Fonts } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useScansHistory } from '../hooks/queries';
import type { FoodScanDto } from '../services';
import { normalizeApiError } from '../services/apiError';
import {
  AppImage,
  Button,
  EmptyState,
  ErrorState,
  PressableScale,
  Screen,
  Sheet,
  Skeleton,
  SkeletonGroup,
  Text,
} from '../src/ui';

const STATUS_LABEL_KEYS: Record<FoodScanDto['status'], string> = {
  PENDING: 'history.status.pending',
  PROCESSING: 'history.status.processing',
  COMPLETED: 'common.completed',
  FAILED: 'history.status.failed',
};

const FILTERS = ['all', 'completed', 'processing', 'failed'] as const;
/** With a filter on, load more pages by itself until this many scans match, at most this many times. */
const FILTER_MIN_RESULTS = 6;
const FILTER_AUTO_PAGES = 4;
type Filter = (typeof FILTERS)[number];

function matchesFilter(scan: FoodScanDto, filter: Filter): boolean {
  switch (filter) {
    case 'completed':
      return scan.status === 'COMPLETED';
    case 'processing':
      return scan.status === 'PROCESSING' || scan.status === 'PENDING';
    case 'failed':
      return scan.status === 'FAILED';
    default:
      return true;
  }
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

interface RowProps {
  scan: FoodScanDto;
  onPress: (scan: FoodScanDto) => void;
}

/** One scan. Memoised: a row re-renders only when its own scan changes, so long lists stay smooth. */
const HistoryRow = React.memo(function HistoryRow({ scan, onPress }: RowProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const c = tokens.color;
  const foodName = scan.predictions?.[0]?.foodName ?? t('common.unknownFood');
  const calories = Math.round(scan.nutritionSummary?.totalCalories || 0);
  const done = scan.status === 'COMPLETED';
  const status = t(STATUS_LABEL_KEYS[scan.status] ?? 'history.status.pending');

  return (
    <PressableScale
      onPress={() => onPress(scan)}
      accessibilityRole="button"
      accessibilityLabel={`${foodName}, ${calories} ${t('home.calUnit')}, ${status}, ${formatDate(scan.createdAt)}`}
      style={[styles.row, { backgroundColor: c.surface, borderColor: c.border }]}
    >
      <AppImage source={{ uri: scan.imageUrl }} style={styles.image} accessible={false} />
      <View style={styles.rowBody}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {foodName}
        </Text>
        <Text variant="caption" tone="muted">
          {formatDate(scan.createdAt)}
        </Text>
        <View style={styles.badges}>
          <View style={styles.cal}>
            <Ionicons name="flame" size={14} color={c.accentText} />
            <Text variant="label">
              {calories} {t('home.calUnit')}
            </Text>
          </View>
          <View style={[styles.status, { backgroundColor: done ? c.successSoft : c.warningSoft }]}>
            <Text variant="caption" tone={done ? 'success' : 'warning'} style={styles.statusText}>
              {status}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={c.textSubtle} />
    </PressableScale>
  );
});

function ListSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label}>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} height={92} radius={16} />
      ))}
    </SkeletonGroup>
  );
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const router = useRouter();

  // The history is a paged query in the cache: the last known pages show at once (also offline), the
  // next page loads when the end is reached, and a failure keeps what is already on screen.
  const history = useScansHistory();
  const scans = useMemo(() => history.data?.pages.flatMap((p) => p.content) ?? [], [history.data]);
  const loading = history.isPending && !history.isPaused;
  const refreshing = history.isRefetching && !history.isFetchingNextPage;
  // Three different failures, three different answers: nothing loaded (an error screen with a retry),
  // a refresh that failed (a banner, the list stays), the next page that failed (a retry at the end).
  const nothingLoaded = history.isError && scans.length === 0;
  const loadError = nothingLoaded ? normalizeApiError(history.error) : null;
  const refreshFailed = history.isRefetchError && scans.length > 0;
  const nextPageFailed = history.isFetchNextPageError;
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(
    () => scans.filter((scan) => matchesFilter(scan, filter)),
    [scans, filter]
  );

  const handleRefresh = useCallback(() => void history.refetch(), [history]);

  // One page request at a time: the list asks for more many times while it scrolls, and a second
  // request for the same page would be wasted (or would skip a page).
  const inFlight = useRef(false);
  const loadNext = useCallback(async () => {
    if (inFlight.current || !history.hasNextPage || history.isFetchingNextPage) return;
    inFlight.current = true;
    try {
      await history.fetchNextPage();
    } finally {
      inFlight.current = false;
    }
  }, [history]);
  const handleLoadMore = useCallback(() => {
    if (!nextPageFailed) void loadNext();
  }, [loadNext, nextPageFailed]);

  // The api lists scans newest first and has no status filter, so a filter only looks at the pages
  // already loaded. To avoid an empty-looking list it fetches a few more pages by itself, then leaves
  // the rest to the "Load older scans" button.
  const autoLoaded = useRef(0);
  useEffect(() => {
    autoLoaded.current = 0;
  }, [filter]);
  useEffect(() => {
    if (filter === 'all' || loading || nextPageFailed) return;
    if (
      visible.length < FILTER_MIN_RESULTS &&
      history.hasNextPage &&
      autoLoaded.current < FILTER_AUTO_PAGES
    ) {
      autoLoaded.current += 1;
      void loadNext();
    }
  }, [
    filter,
    loading,
    nextPageFailed,
    visible.length,
    history.hasNextPage,
    scans.length,
    loadNext,
  ]);
  const handlePressItem = useCallback(
    (scan: FoodScanDto) =>
      router.push({ pathname: '/diet/diet-statistics', params: { scanId: scan.id } }),
    [router]
  );
  const renderItem = useCallback(
    ({ item }: { item: FoodScanDto }) => <HistoryRow scan={item} onPress={handlePressItem} />,
    [handlePressItem]
  );

  return (
    <Screen padded={false} noTopInset>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('history.title'),
          headerStyle: { backgroundColor: tokens.color.bg },
          headerTintColor: tokens.color.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: Fonts.bold, fontSize: 18 },
          headerTitleAlign: 'center',
          headerRight: () => (
            <PressableScale
              onPress={() => setShowFilter(true)}
              accessibilityRole="button"
              accessibilityLabel={t('history.filterBy')}
              accessibilityState={{ selected: filter !== 'all' }}
              style={styles.headerButton}
            >
              <Ionicons name="filter" size={24} color={tokens.color.text} />
            </PressableScale>
          ),
        }}
      />

      <Sheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        title={t('history.filterBy')}
        closeLabel={t('common.close')}
      >
        <View style={styles.filters}>
          {FILTERS.map((type) => (
            <Button
              key={type}
              title={t(`history.filters.${type}`)}
              variant={filter === type ? 'primary' : 'secondary'}
              size="medium"
              icon={filter === type ? 'checkmark' : undefined}
              onPress={() => {
                setFilter(type);
                setShowFilter(false);
              }}
            />
          ))}
        </View>
      </Sheet>

      <FlatList
        data={visible}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.color.accent}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            {refreshFailed ? (
              <PressableScale
                onPress={handleRefresh}
                accessibilityRole="button"
                accessibilityLabel={t('history.refreshFailed')}
                style={[styles.banner, { backgroundColor: tokens.color.warningSoft }]}
              >
                <Ionicons name="cloud-offline-outline" size={18} color={tokens.color.warningText} />
                <Text variant="label" style={styles.bannerText}>
                  {t('history.refreshFailed')}
                </Text>
              </PressableScale>
            ) : null}
            {filter !== 'all' && scans.length > 0 ? (
              <Text variant="caption" tone="muted" accessibilityRole="text">
                {t('history.filterNote', { count: scans.length })}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ListSkeleton label={t('common.loading')} />
          ) : loadError ? (
            // The list could not be loaded: an error with a retry, not "No History Yet".
            <ErrorState kind={loadError.kind} onRetry={() => void history.refetch()} />
          ) : scans.length > 0 && filter !== 'all' ? (
            // Scans exist but none of the loaded ones match: say so, and offer older ones.
            <EmptyState
              icon="filter-outline"
              title={t('history.noMatch')}
              message={t('history.noMatchMessage', { count: scans.length })}
              actionLabel={history.hasNextPage ? t('history.loadOlder') : undefined}
              onAction={history.hasNextPage ? () => void loadNext() : undefined}
            />
          ) : (
            <EmptyState
              icon="time-outline"
              title={t('history.noHistory')}
              message={t('history.startScanning')}
            />
          )
        }
        ListFooterComponent={
          history.isFetchingNextPage ? (
            <Skeleton height={92} radius={16} />
          ) : nextPageFailed ? (
            // A later page failed: keep the list on screen and offer to try again.
            <Button
              variant="ghost"
              size="medium"
              title={t('common.retry')}
              onPress={() => void loadNext()}
            />
          ) : filter !== 'all' && history.hasNextPage && visible.length > 0 ? (
            <Button
              variant="ghost"
              size="medium"
              title={t('history.loadOlder')}
              onPress={() => void loadNext()}
            />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, paddingBottom: 40, gap: 12 },
  headerStack: { gap: 8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  bannerText: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  image: { width: 64, height: 64, borderRadius: 12 },
  rowBody: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cal: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  status: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontFamily: Fonts.semiBold },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingBottom: 8 },
});
