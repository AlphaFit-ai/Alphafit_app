import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ProPlanModal } from '../../components';
import { useOnboarding } from '../../context/OnboardingContext';
import { useProjection } from '../../context/ProjectionContext';
import { useTheme } from '../../context/ThemeContext';
import {
  useOnboardingData,
  useProjectionData,
  useRecentScans,
  useRefetchWhenStale,
} from '../../hooks/queries';
import { normalizeApiError } from '../../services/apiError';
import { isSameLocalDay } from '../../services/apiTime';
import { estimateDailyCalories } from '../../services/calorieTarget';
import { calculateAge } from '../../services/dateOfBirth';
import {
  AppImage,
  BrandLogo,
  ErrorState,
  PressableScale,
  Screen,
  Skeleton,
  SkeletonGroup,
  Text,
  useReduceMotion,
} from '../../src/ui';
import { foodLabel } from '../../src/scan/items';
import { weekDays } from '../../src/scan/week';
import { enter } from '../../src/ui/motion';

interface QuickStatCard {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
  /** Gets more width (the last scan has a long name). */
  wide?: boolean;
}

type QuoteGroup = 'strength' | 'fatLoss' | 'fitness' | 'health';

/** Which set of motivational quotes suits the user's goal. */
function quoteGroupFor(goal: string | undefined): QuoteGroup {
  switch (goal) {
    case 'build-muscle':
    case 'get-stronger':
      return 'strength';
    case 'lose-fat':
      return 'fatLoss';
    case 'stay-fit':
      return 'health';
    default:
      return 'fitness';
  }
}

const QUOTES_PER_GROUP = 3;

/** Data is reloaded when Home comes back into focus after this long, so it stays live without a request storm. */
const STALE_AFTER_MS = 60_000;

const GOAL_LABEL_KEYS: Record<string, string> = {
  'lose-fat': 'onboarding.goal.loseFat',
  'get-stronger': 'onboarding.goal.getStronger',
  'build-muscle': 'onboarding.goal.buildMuscle',
  'stay-fit': 'onboarding.goal.stayFit',
};

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { tokens } = useTheme();
  const reduceMotion = useReduceMotion();
  const router = useRouter();
  // The answers (onboarding, sleep) and the scans are server data in the query cache: Home shows the
  // last known copy at once and refreshes it. A failed load is an error with a retry, never empty values.
  const { onboardingData } = useOnboarding();
  const { projectionData } = useProjection();
  const onboardingQ = useOnboardingData();
  const projectionQ = useProjectionData();
  const scansQ = useRecentScans();
  const queries = [onboardingQ, projectionQ, scansQ];
  const scans = React.useMemo(() => scansQ.data ?? [], [scansQ.data]);

  const hasData = queries.some((q) => q.data !== undefined);
  const failed = queries.filter((q) => q.isError);
  const loadError = failed.length > 0 ? normalizeApiError(failed[0].error) : null;
  const offlineWithoutData = !hasData && queries.every((q) => q.isPaused);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [showPro, setShowPro] = React.useState(false);

  // Refresh when Home regains focus and its data is older than a minute.
  const [focused, setFocused] = React.useState(true);
  useFocusEffect(
    React.useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, [])
  );
  useRefetchWhenStale(scansQ, focused, STALE_AFTER_MS);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled(queries.map((q) => q.refetch()));
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the three query objects change every render
  }, [onboardingQ.refetch, projectionQ.refetch, scansQ.refetch]);

  const retry = React.useCallback(() => {
    queries.forEach((q) => void q.refetch());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingQ.refetch, projectionQ.refetch, scansQ.refetch]);

  // Derived from the scans: today's totals and the latest completed scans.
  const { nutrition, todayScansCount, recentFoodName, recentScans } = React.useMemo(() => {
    const now = new Date();
    const completed = scans.filter((scan) => scan.status === 'COMPLETED');
    // createdAt is UTC without a zone (CONTRACTS section 1); "today" is the phone's own day.
    const todayScans = completed.filter((scan) => isSameLocalDay(scan.createdAt, now));

    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    todayScans.forEach((scan) => {
      totals.calories += scan.nutritionSummary?.totalCalories || 0;
      totals.protein += scan.nutritionSummary?.totalProteinG || 0;
      totals.carbs += scan.nutritionSummary?.totalCarbsG || 0;
      totals.fat += scan.nutritionSummary?.totalFatG || 0;
    });

    return {
      nutrition: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      },
      todayScansCount: todayScans.length,
      recentFoodName: foodLabel(
        todayScans.find((scan) => scan.predictions?.length)?.predictions[0].foodName
      ),
      recentScans: completed.slice(0, 3),
    };
  }, [scans]);

  const userGoalKey = onboardingData.goal ? GOAL_LABEL_KEYS[onboardingData.goal] : undefined;

  // One quote per day for the user's goal: it does not change on every render or refresh, and it
  // needs no request (the text used to be generated by the chat model on each visit).
  const quote = React.useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
        Date.UTC(now.getFullYear(), 0, 0)) /
        86_400_000
    );
    const group = quoteGroupFor(onboardingData.goal);
    return t(`home.quotes.${group}.${dayOfYear % QUOTES_PER_GROUP}`);
  }, [onboardingData.goal, t]);

  // The last seven days with the days that have scans marked (from the scans already loaded).
  const week = React.useMemo(() => weekDays(scans), [scans]);

  const target = React.useMemo(() => estimateDailyCalories(onboardingData), [onboardingData]);

  // Real data stats
  const quickStats: QuickStatCard[] = [
    {
      label: t('home.lastScan'),
      value: recentFoodName || '--',
      icon: 'restaurant',
      color: tokens.color.accentText,
      route: '/history',
      wide: true,
    },
    {
      label: t('home.scansToday'),
      value: todayScansCount.toString(),
      icon: 'camera',
      color: tokens.color.warningText,
      route: '/history',
    },
    {
      label: t('home.sleep'),
      value: projectionData.sleepHours ? `${projectionData.sleepHours}h` : '--',
      icon: 'moon',
      color: tokens.color.successText,
      route: '/profile/manage-data?type=projection',
    },
  ];

  const handleNavigate = (route: string) => {
    router.push(route as Href);
  };

  const userAge = calculateAge(onboardingData.dateOfBirth);
  const c = tokens.color;

  // No navigator bar: the logo and the Pro plan entry are the first row of the page and scroll with it.
  const topRow = (
    <View style={styles.topRow}>
      <BrandLogo height={28} />
      <PressableScale
        onPress={() => setShowPro(true)}
        feedback
        accessibilityRole="button"
        accessibilityLabel={t('tabs.proPlan')}
        style={[styles.proChip, { backgroundColor: c.surfaceMuted }]}
      >
        <Ionicons name="trophy" size={18} color={c.premium} />
        <Text variant="label">{t('tabs.proPlan')}</Text>
      </PressableScale>
    </View>
  );
  const proPlan = <ProPlanModal visible={showPro} onClose={() => setShowPro(false)} />;

  // First load: nothing to show yet. Placeholders with the shape of the page, not a spinner.
  if (!hasData && !loadError && !offlineWithoutData) {
    return (
      <Screen scroll contentStyle={styles.content}>
        {topRow}
        <HomeSkeleton label={t('common.loading')} />
        {proPlan}
      </Screen>
    );
  }

  // The first load failed: there is no data to show, so offer a retry.
  if (!hasData && (loadError || offlineWithoutData)) {
    return (
      <Screen contentStyle={styles.content}>
        {topRow}
        <ErrorState kind={loadError ? loadError.kind : 'offline'} onRetry={retry} />
        {proPlan}
      </Screen>
    );
  }

  const macroTotal = nutrition.protein + nutrition.carbs + nutrition.fat;
  const macros = [
    { key: 'protein', label: t('home.protein'), grams: nutrition.protein, color: c.success },
    { key: 'carbs', label: t('home.carbs'), grams: nutrition.carbs, color: c.warning },
    { key: 'fat', label: t('home.fats'), grams: nutrition.fat, color: c.accent },
  ];
  const remaining = target === null ? null : target - nutrition.calories;
  const progress = target ? Math.min(1, nutrition.calories / target) : 0;

  return (
    <View style={[styles.fill, { backgroundColor: c.bg }]}>
      <Screen
        scroll
        contentStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
        }
      >
        {topRow}
        {/* Part of the data could not be refreshed: say so, keep what is on screen */}
        {loadError && (
          <PressableScale
            style={[styles.banner, { backgroundColor: c.warningSoft }]}
            onPress={onRefresh}
            accessibilityRole="button"
            accessibilityLabel={t('home.refreshFailed')}
          >
            <Ionicons name="cloud-offline-outline" size={18} color={c.warningText} />
            <Text variant="label" style={styles.fill}>
              {t('home.refreshFailed')}
            </Text>
          </PressableScale>
        )}

        {/* Today: calories eaten against an estimated target, then the macro split */}
        <Animated.View
          entering={enter(0, reduceMotion)}
          style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
        >
          <Text variant="label" tone="muted">
            {t('home.caloriesToday')}
          </Text>
          <View style={styles.heroRow}>
            <Text variant="display" style={styles.heroNumber}>
              {nutrition.calories.toLocaleString()}
            </Text>
            {remaining !== null && (
              <Text
                variant="label"
                tone={remaining < 0 ? 'danger' : 'muted'}
                style={styles.heroSide}
              >
                {remaining >= 0
                  ? t('home.caloriesLeft', { amount: remaining.toLocaleString() })
                  : t('home.caloriesOver', { amount: (-remaining).toLocaleString() })}
              </Text>
            )}
          </View>
          {target !== null ? (
            <>
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={t('home.caloriesProgress', {
                  eaten: nutrition.calories,
                  target,
                })}
                accessibilityValue={{
                  min: 0,
                  max: target,
                  now: Math.min(target, nutrition.calories),
                }}
                style={[styles.track, { backgroundColor: c.surfaceMuted }]}
              >
                <View
                  style={[
                    styles.fillBar,
                    {
                      width: `${Math.round(progress * 100)}%`,
                      backgroundColor: remaining !== null && remaining < 0 ? c.danger : c.accent,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" tone="subtle">
                {t('home.targetEstimate', { target: target.toLocaleString() })}
              </Text>
            </>
          ) : (
            <Text variant="caption" tone="subtle">
              {t('home.addTargetHint')}
            </Text>
          )}

          <View style={[styles.stack, { backgroundColor: c.surfaceMuted }]}>
            {macroTotal > 0 &&
              macros.map((m) => (
                <View key={m.key} style={{ flex: m.grams, backgroundColor: m.color }} />
              ))}
          </View>
          <View style={styles.macroRow}>
            {macros.map((m) => (
              <View key={m.key} style={styles.macro}>
                <View style={styles.macroHead}>
                  <View style={[styles.dot, { backgroundColor: m.color }]} />
                  <Text variant="caption" tone="muted">
                    {m.label}
                  </Text>
                </View>
                <Text variant="subheading">{m.grams}g</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* The last seven days: a mark on every day that has scans */}
        <View style={styles.weekHeader}>
          <Text variant="heading" accessibilityRole="header">
            {t('home.thisWeek')}
          </Text>
        </View>
        <View style={styles.week}>
          {week.map((day) => {
            const has = day.scans > 0;
            const long = day.date.toLocaleDateString(i18n.language, {
              weekday: 'long',
              day: 'numeric',
            });
            return (
              <PressableScale
                key={day.key}
                onPress={() => handleNavigate('/history')}
                accessibilityRole="button"
                accessibilityLabel={t('home.weekDayLabel', {
                  day: long,
                  count: day.scans,
                  calories: day.calories,
                })}
                style={styles.weekDay}
              >
                <Text variant="caption" tone="muted">
                  {day.date.toLocaleDateString(i18n.language, { weekday: 'narrow' })}
                </Text>
                <View
                  style={[
                    styles.weekDot,
                    {
                      backgroundColor: has ? c.accentSoft : c.surfaceMuted,
                      borderColor: day.isToday ? c.accent : has ? c.accentText : 'transparent',
                    },
                  ]}
                >
                  <Text variant="label" tone={has ? 'accent' : 'default'}>
                    {day.date.getDate()}
                  </Text>
                </View>
                <View
                  style={[styles.weekMark, { backgroundColor: has ? c.accent : 'transparent' }]}
                />
              </PressableScale>
            );
          })}
        </View>

        {/* Quick stats: last scan gets two lines, the rest are short numbers */}
        <View style={styles.statsRow}>
          {quickStats.map((stat) => (
            <PressableScale
              key={stat.route + stat.label}
              style={[
                styles.statCard,
                { backgroundColor: c.surface, borderColor: c.border },
                stat.wide && styles.statWide,
              ]}
              onPress={() => handleNavigate(stat.route)}
              accessibilityRole="button"
              accessibilityLabel={`${stat.label}: ${stat.value}`}
            >
              <View style={[styles.statIcon, { backgroundColor: c.surfaceMuted }]}>
                <Ionicons name={stat.icon} size={18} color={stat.color} />
              </View>
              <Text variant="subheading" numberOfLines={stat.wide ? 2 : 1} adjustsFontSizeToFit>
                {stat.value}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={2}>
                {stat.label}
              </Text>
            </PressableScale>
          ))}
        </View>

        {/* Recent scans, newest first, with calories and macros */}
        <View style={styles.sectionHeader}>
          <Text variant="heading" accessibilityRole="header">
            {t('home.recentScans')}
          </Text>
          <PressableScale
            onPress={() => handleNavigate('/history')}
            minTarget
            accessibilityRole="button"
            accessibilityLabel={`${t('home.recentScans')}: ${t('home.seeAll')}`}
            style={styles.seeAll}
          >
            <Text variant="label" tone="accent">
              {t('home.seeAll')}
            </Text>
          </PressableScale>
        </View>
        {recentScans.length === 0 ? (
          <Text tone="muted">{t('home.noScansYet')}</Text>
        ) : (
          recentScans.map((scan, index) => (
            <Animated.View key={scan.id} entering={enter(index + 1, reduceMotion)}>
              <PressableScale
                style={[styles.scanRow, { backgroundColor: c.surface, borderColor: c.border }]}
                onPress={() =>
                  router.push({ pathname: '/scan-result', params: { scanId: scan.id } })
                }
                accessibilityRole="button"
                accessibilityLabel={`${foodLabel(scan.predictions?.[0]?.foodName) || t('common.unknownFood')}, ${
                  scan.nutritionSummary?.totalCalories || 0
                } ${t('home.calUnit')}`}
              >
                <AppImage
                  source={{ uri: scan.imageUrl }}
                  style={styles.scanImage}
                  accessible={false}
                />
                <View style={styles.fill}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {foodLabel(scan.predictions?.[0]?.foodName) || t('common.unknownFood')}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {scan.nutritionSummary?.totalCalories || 0} {t('home.calUnit')}
                    {' · '}P {Math.round(scan.nutritionSummary?.totalProteinG || 0)}g · C{' '}
                    {Math.round(scan.nutritionSummary?.totalCarbsG || 0)}g · F{' '}
                    {Math.round(scan.nutritionSummary?.totalFatG || 0)}g
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={c.textSubtle} />
              </PressableScale>
            </Animated.View>
          ))
        )}

        {/* The answers from onboarding */}
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.journeyHeader}>
            <Text variant="heading" style={styles.fill}>
              {t('home.yourJourney')}
            </Text>
            {userGoalKey && (
              <View style={[styles.goalBadge, { backgroundColor: c.accentSoft }]}>
                <Text variant="label" tone="accent">
                  {t(userGoalKey)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.chips}>
            {userAge !== null && (
              <Chip icon="person-outline" text={t('home.yearsOld', { years: userAge })} />
            )}
            {onboardingData.fitnessLevel && (
              <Chip
                icon="fitness-outline"
                text={t(`onboarding.fitnessLevel.${onboardingData.fitnessLevel}`)}
              />
            )}
            {onboardingData.workoutsPerWeek && (
              <Chip
                icon="calendar-outline"
                text={t('home.perWeek', { value: onboardingData.workoutsPerWeek })}
              />
            )}
            {onboardingData.activityLevel && (
              <Chip
                icon="speedometer-outline"
                text={t(`onboarding.activity.${onboardingData.activityLevel}`)}
              />
            )}
            {projectionData.sleepHours && (
              <Chip
                icon="moon-outline"
                text={t('home.sleepHours', { hours: projectionData.sleepHours })}
              />
            )}
            {onboardingData.height && (
              <Chip
                icon="resize-outline"
                text={
                  onboardingData.height.unit === 'metric'
                    ? `${onboardingData.height.cm} cm`
                    : `${onboardingData.height.feet}'${onboardingData.height.inches}"`
                }
              />
            )}
          </View>
        </View>

        <Text variant="body" tone="muted" style={styles.quote}>
          {quote}
        </Text>
      </Screen>

      {/* Chat: clear of the tab bar (this view ends above it) and of the last card (content padding) */}
      <PressableScale
        style={[styles.fab, tokens.elevation.raised, { backgroundColor: c.accent }]}
        onPress={() => router.push('/chatbot')}
        feedback
        accessibilityRole="button"
        accessibilityLabel={t('chat.title')}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={c.onAccent} />
      </PressableScale>
      {proPlan}
    </View>
  );
}

function Chip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: tokens.color.surfaceMuted }]}>
      <Ionicons name={icon} size={16} color={tokens.color.textMuted} />
      <Text variant="caption">{text}</Text>
    </View>
  );
}

/** What the page looks like before its data arrives. */
function HomeSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} style={styles.skeleton}>
      <Skeleton height={190} radius={16} />
      <View style={styles.statsRow}>
        <Skeleton height={96} radius={16} width="31%" />
        <Skeleton height={96} radius={16} width="31%" />
        <Skeleton height={96} radius={16} width="31%" />
      </View>
      <Skeleton height={22} width="45%" />
      <Skeleton height={72} radius={16} />
      <Skeleton height={72} radius={16} />
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingBottom: 104, gap: 16 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  proChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  skeleton: { gap: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  heroNumber: { fontSize: 44, lineHeight: 52 },
  heroSide: { paddingBottom: 8 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fillBar: { height: '100%', borderRadius: 5 },
  stack: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginTop: 4 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macro: { flex: 1, gap: 2 },
  macroHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: 12 },
  weekHeader: { marginTop: 4 },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 4, minWidth: 44, minHeight: 64 },
  weekDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekMark: { width: 6, height: 6, borderRadius: 3 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, gap: 4, minHeight: 96 },
  statWide: { flex: 1.6 },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  scanImage: { width: 56, height: 56, borderRadius: 12 },
  journeyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quote: { textAlign: 'center', paddingHorizontal: 8, fontStyle: 'italic' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
