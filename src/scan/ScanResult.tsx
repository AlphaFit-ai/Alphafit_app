import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import type { FoodScanDto, ScanEditBody } from '../../services/foodScanService';
import { AppImage } from '../ui/AppImage';
import { Button } from '../ui/Button';
import { haptic } from '../ui/haptics';
import { PressableScale } from '../ui/Pressable';
import { Sheet } from '../ui/Sheet';
import { Skeleton, SkeletonGroup } from '../ui/Skeleton';
import { Text } from '../ui/Text';
import { useToast } from '../ui/Toast';
import { useDialog } from '../ui/useDialog';
import type { SaveOutcome } from './saveEdits';
import {
  Alternative,
  canApply,
  confidenceLevel,
  editItems,
  factorOf,
  Factors,
  foodLabel,
  gramsOf,
  hasEdits,
  itemsFromScan,
  macroShares,
  Picks,
  ScanItem,
  scaled,
  stepFactor,
  totals,
  withAlternative,
} from './items';

interface ScanResultProps {
  scanResult: FoodScanDto | null;
  loading: boolean;
  recommendations: string[];
  loadingRecommendations: boolean;
  onClose?: () => void;
  onScanAnother?: () => void;
  isModal?: boolean;
  /**
   * Saves a correction with `PATCH /food-scans/{id}` and resolves with how it went. Without it, or when
   * the server answers 404, edits stay on this screen only and the screen says so.
   */
  onSave?: (body: ScanEditBody) => Promise<SaveOutcome>;
}

/**
 * The result of a meal scan: the photo, one big calorie number, the protein, carbs and fat split, and
 * the items the model found with an editable portion each. An item the model is not sure about is
 * marked and shows its alternatives (CONTRACTS 3.7): one with nutrition switches the item in one tap
 * (`alternativeClassId`), one without only renames it. A correction (portion in grams, another food,
 * "Looks right") is saved through `onSave` (PATCH /food-scans/{id}): it shows at once and is put back
 * if the save fails. When the server has no such route (404) the edit stays on screen only and the
 * screen says so. Every optional field is used when the scan carries it; absent, nothing changes.
 */
export function ScanResult({
  scanResult,
  loading,
  recommendations,
  loadingRecommendations,
  onClose,
  onScanAnother,
  isModal = false,
  onSave,
}: ScanResultProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const c = tokens.color;

  const items = useMemo(() => itemsFromScan(scanResult), [scanResult]);
  const [factors, setFactors] = useState<Factors>({});
  const [names, setNames] = useState<Record<string, string>>({});
  // One-tap alternatives picked and not saved yet: the item shows as that food at once.
  const [picks, setPicks] = useState<Picks>({});
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [fixOpen, setFixOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // The server has no PATCH route (404): edits live on this screen only, and the screen says so.
  const [screenOnly, setScreenOnly] = useState(!onSave);
  const toast = useToast();
  const { show: showDialog, dialog } = useDialog();

  const failureText = (outcome: SaveOutcome, pickedAlternative: boolean): string | null => {
    switch (outcome.kind) {
      case 'conflict':
        return t('scan.saveConflict');
      case 'rejected':
        return pickedAlternative ? t('scan.altRejected') : t('scan.saveRejected');
      case 'failed':
        return outcome.reason === 'offline'
          ? t('errors.offline')
          : outcome.reason === 'timeout'
            ? t('errors.timeout')
            : t('scan.saveFailed');
      default:
        return null;
    }
  };

  /**
   * Sends the correction. The edit is already on screen (optimistic); a failure puts it back. Resolves
   * with how the save went, or null when nothing was sent.
   */
  const save = async (
    nextFactors: Factors,
    nextNames: Record<string, string>,
    confirmedFlag?: boolean,
    nextPicks: Picks = picks
  ): Promise<SaveOutcome | null> => {
    if (!onSave || screenOnly || saving) return null;
    const edits = editItems(items, nextFactors, nextNames, nextPicks);
    const wantsItems = hasEdits(items, nextFactors, nextNames, nextPicks);
    if (wantsItems && edits === null) {
      // No weight to scale from: this scan can only be corrected on screen.
      setScreenOnly(true);
      return null;
    }
    if (!wantsItems && !confirmedFlag) return null;
    setSaving(true);
    const outcome = await onSave({
      ...(wantsItems && edits ? { items: edits } : {}),
      ...(confirmedFlag ? { confirmed: true } : {}),
    });
    setSaving(false);
    if (outcome.kind === 'saved') {
      // The scan prop now carries the saved numbers: nothing is left to apply on top of it.
      setFactors({});
      setNames({});
      setPicks({});
      haptic.confirm();
      toast.show(t('scan.saved'), 'success');
    } else if (outcome.kind === 'unsupported') {
      setScreenOnly(true);
    } else {
      setFactors({});
      setNames({});
      setPicks({});
      if (confirmedFlag) setConfirmed(false);
      const text = failureText(outcome, Object.keys(nextPicks).length > 0);
      if (text) toast.show(text, 'error');
    }
    return outcome;
  };

  /** Renames the item only: its nutrition stays as scanned. */
  const rename = (item: ScanItem, alt: Alternative) => {
    const nextNames = { ...names, [item.key]: alt.name };
    const nextPicks = { ...picks };
    delete nextPicks[item.key];
    setNames(nextNames);
    setPicks(nextPicks);
    void save(factors, nextNames, undefined, nextPicks);
  };

  /** Switches the item to an alternative that carries its own nutrition (`alternativeClassId`). */
  const pick = async (item: ScanItem, alt: Alternative) => {
    haptic.select();
    const nextPicks = { ...picks, [item.key]: alt };
    const nextFactors = { ...factors };
    delete nextFactors[item.key];
    const nextNames = { ...names };
    delete nextNames[item.key];
    setPicks(nextPicks);
    setFactors(nextFactors);
    setNames(nextNames);
    const outcome = await save(nextFactors, nextNames, undefined, nextPicks);
    if (outcome?.kind !== 'alternativeUnavailable') return;
    haptic.error();
    showDialog({
      title: t('scan.altUnavailableTitle', { name: foodLabel(alt.name) }),
      message: t('scan.altUnavailableMessage'),
      feedback: 'error',
      actions: [
        { label: t('scan.renameOnly'), onPress: () => rename(item, alt) },
        ...(onScanAnother ? [{ label: t('scan.fixRescan'), onPress: onScanAnother }] : []),
        { label: t('common.cancel'), tone: 'cancel' as const },
      ],
    });
  };

  // The items as shown: a picked alternative replaces its item until the save comes back.
  const shown = useMemo(
    () => items.map((item) => (picks[item.key] ? withAlternative(item, picks[item.key]) : item)),
    [items, picks]
  );
  const total = totals(shown, factors);
  const shares = macroShares(total);
  const askToConfirm = !confirmed && shown.some((item) => item.needsConfirmation);
  const changed = hasEdits(items, factors, names, picks);
  const anyAlternatives = items.some((i) => i.alternatives.length > 0);

  const macros = [
    {
      key: 'protein',
      label: t('diet.statistics.protein'),
      grams: total.protein,
      pct: shares.protein,
      color: c.success,
    },
    {
      key: 'carbs',
      label: t('diet.statistics.carbs'),
      grams: total.carbs,
      pct: shares.carbs,
      color: c.warning,
    },
    {
      key: 'fat',
      label: t('diet.statistics.fat'),
      grams: total.fat,
      pct: shares.fat,
      color: c.accent,
    },
  ];

  const step = (item: ScanItem, direction: 1 | -1) => {
    haptic.select();
    setFactors((prev) => ({
      ...prev,
      [item.key]: stepFactor(item, factorOf(item, prev), direction),
    }));
  };

  if (loading) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: c.bg }]}>
        <SkeletonGroup label={t('diet.statistics.loadingResults')} style={styles.loadingGroup}>
          <Skeleton height={220} radius={20} />
          <Skeleton height={96} radius={16} />
          <Skeleton height={72} radius={16} />
        </SkeletonGroup>
      </View>
    );
  }

  const imageUrl = scanResult?.imageUrl;

  return (
    <View
      style={[
        styles.fill,
        { backgroundColor: c.bg },
        isModal && [styles.sheet, { borderTopLeftRadius: 24, borderTopRightRadius: 24 }],
      ]}
    >
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoWrap}>
          {imageUrl ? (
            <AppImage
              source={{ uri: imageUrl }}
              accessible={false}
              style={[styles.photo, { borderRadius: 20 }]}
            />
          ) : (
            <View style={[styles.photo, { backgroundColor: c.surfaceMuted, borderRadius: 20 }]} />
          )}
          {isModal && onClose ? (
            <PressableScale
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={[styles.close, { backgroundColor: c.scrim }]}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </PressableScale>
          ) : null}
        </View>

        {items.length === 0 ? (
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="sparkles" size={40} color={c.warningText} />
            <Text variant="heading" style={styles.centerText}>
              {t('diet.statistics.analyzing')}
            </Text>
            <Text tone="muted" style={styles.centerText}>
              {t('diet.statistics.analyzeMessage')}
            </Text>
          </View>
        ) : (
          <>
            {askToConfirm ? (
              <View
                style={[styles.card, { backgroundColor: c.warningSoft, borderColor: c.warning }]}
                accessibilityRole="alert"
              >
                <Text variant="subheading">{t('scan.confirmTitle')}</Text>
                <Text tone="muted">
                  {shown.length > 1 ? t('scan.confirmItemsMessage') : t('scan.confirmMessage')}
                </Text>
                <Button
                  title={t('scan.confirmYes')}
                  size="medium"
                  onPress={() => {
                    haptic.confirm();
                    setConfirmed(true);
                    void save(factors, names, true);
                  }}
                />
              </View>
            ) : null}

            <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.rowBetween}>
                <View style={styles.rowGap}>
                  <Ionicons name="flame" size={22} color={c.accentText} />
                  <Text variant="label" tone="muted">
                    {t('diet.statistics.calories')}
                  </Text>
                </View>
                <PressableScale
                  onPress={() => {
                    if (editing) void save(factors, names);
                    setEditing((v) => !v);
                  }}
                  disabled={saving}
                  feedback
                  accessibilityRole="button"
                  accessibilityState={{ selected: editing }}
                  accessibilityLabel={editing ? t('scan.editDone') : t('scan.edit')}
                  style={[styles.pill, { backgroundColor: editing ? c.action : c.surfaceMuted }]}
                >
                  <Ionicons
                    name={editing ? 'checkmark' : 'create-outline'}
                    size={16}
                    color={editing ? c.onAction : c.text}
                  />
                  <Text variant="label" style={{ color: editing ? c.onAction : c.text }}>
                    {editing ? t('scan.editDone') : t('scan.edit')}
                  </Text>
                </PressableScale>
              </View>
              <View style={styles.rowBaseline}>
                <Text variant="display" style={styles.big}>
                  {Math.round(total.calories).toLocaleString()}
                </Text>
                <Text tone="muted">{t('home.calUnit')}</Text>
              </View>
              <Text variant="caption" tone="subtle">
                {t('scan.itemsFound', { n: items.length })}
                {scanResult?.userEdited ? ` · ${t('scan.userEdited')}` : ''}
              </Text>

              <View style={styles.tiles}>
                {macros.map((m) => (
                  <View key={m.key} style={[styles.tile, { backgroundColor: c.surfaceMuted }]}>
                    <View style={styles.rowGap}>
                      <View style={[styles.dot, { backgroundColor: m.color }]} />
                      <Text variant="caption" tone="muted">
                        {m.label}
                      </Text>
                    </View>
                    <Text variant="subheading">{Math.round(m.grams)}g</Text>
                    <Text variant="caption" tone="subtle">
                      {m.pct}%
                    </Text>
                  </View>
                ))}
              </View>
              <View
                accessible
                accessibilityLabel={`${t('scan.macros')}: ${macros
                  .map((m) => `${m.label} ${m.pct}%`)
                  .join(', ')}`}
                style={[styles.stack, { backgroundColor: c.surfaceMuted }]}
              >
                {macros.map((m) => (
                  <View
                    key={m.key}
                    style={{ flex: Math.max(m.pct, 0.0001), backgroundColor: m.color }}
                  />
                ))}
              </View>
            </View>

            <Text variant="heading" accessibilityRole="header">
              {t('diet.statistics.allDetectedItems')}
            </Text>
            {shown.map((item) => {
              const factor = factorOf(item, factors);
              const macro = scaled(item, factor);
              const level = confidenceLevel(item.confidence);
              const grams = gramsOf(item, factor);
              const name = foodLabel(names[item.key] ?? item.name);
              const flagged = item.needsConfirmation && !confirmed;
              // The item's own confirm state decides; on an older scan without it, a low confidence
              // does, until the user confirmed, chose or corrected the food.
              const unsure =
                flagged ||
                (!item.confirmKnown &&
                  level === 'low' &&
                  !confirmed &&
                  !scanResult?.userEdited &&
                  !picks[item.key]);
              const renameOnly = item.alternatives.some((alt) => !canApply(alt));
              return (
                <View
                  key={item.key}
                  testID={`scan-item-${item.key}`}
                  style={[
                    styles.card,
                    { backgroundColor: c.surface, borderColor: flagged ? c.warning : c.border },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={styles.flex}>
                      <Text variant="bodyStrong" numberOfLines={2}>
                        {name}
                      </Text>
                      {unsure ? (
                        <View style={styles.rowGap}>
                          <Ionicons name="help-circle" size={14} color={c.warningText} />
                          <Text variant="caption" tone="warning">
                            {t('scan.notSure')}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text variant="bodyStrong">
                      {Math.round(macro.calories)} {t('home.calUnit')}
                    </Text>
                  </View>
                  <Text variant="caption" tone="muted">
                    P {Math.round(macro.protein)}g · C {Math.round(macro.carbs)}g · F{' '}
                    {Math.round(macro.fat)}g
                  </Text>

                  {editing ? (
                    <View style={styles.stepper}>
                      <Text variant="label" tone="muted">
                        {t('scan.portion')}
                      </Text>
                      <View style={styles.rowGap}>
                        <PressableScale
                          onPress={() => step(item, -1)}
                          disabled={saving}
                          accessibilityRole="button"
                          accessibilityLabel={t('scan.smaller', { name })}
                          style={[styles.stepButton, { backgroundColor: c.surfaceMuted }]}
                        >
                          <Ionicons name="remove" size={22} color={c.text} />
                        </PressableScale>
                        <Text variant="bodyStrong" style={styles.stepValue}>
                          {grams !== null ? `${grams} g` : `${Math.round(factor * 100) / 100}x`}
                        </Text>
                        <PressableScale
                          onPress={() => step(item, 1)}
                          disabled={saving}
                          accessibilityRole="button"
                          accessibilityLabel={t('scan.larger', { name })}
                          style={[styles.stepButton, { backgroundColor: c.surfaceMuted }]}
                        >
                          <Ionicons name="add" size={22} color={c.text} />
                        </PressableScale>
                      </View>
                    </View>
                  ) : grams !== null ? (
                    <Text variant="caption" tone="subtle">
                      {t('scan.portion')}: {grams} g
                    </Text>
                  ) : null}

                  {item.alternatives.length > 0 && (unsure || editing) ? (
                    <View>
                      <Text variant="caption" tone="muted">
                        {t('scan.alternatives')}
                      </Text>
                      <View style={styles.chips}>
                        {item.alternatives.map((alt) => {
                          const label = foodLabel(alt.name);
                          const oneTap = canApply(alt);
                          const calories = oneTap ? Math.round(alt.nutrition.calories) : null;
                          return (
                            <PressableScale
                              key={`${alt.classId ?? ''}-${alt.name}`}
                              disabled={saving}
                              onPress={() => (oneTap ? void pick(item, alt) : rename(item, alt))}
                              feedback={!oneTap}
                              minTarget
                              accessibilityRole="button"
                              accessibilityLabel={
                                oneTap
                                  ? t('scan.useAlternative', { name: label, calories })
                                  : t('scan.renameTo', { name: label })
                              }
                              style={[styles.chip, { backgroundColor: c.accentSoft }]}
                            >
                              <Text variant="label" tone="accent">
                                {oneTap ? `${label} · ${calories} ${t('home.calUnit')}` : label}
                              </Text>
                            </PressableScale>
                          );
                        })}
                      </View>
                      {renameOnly ? (
                        <Text variant="caption" tone="subtle" style={styles.chipNote}>
                          {t('scan.renameOnlyNote')}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              );
            })}

            {screenOnly && changed ? (
              <Text variant="caption" tone="subtle">
                {t('scan.editedNote')}
              </Text>
            ) : null}

            <PressableScale
              onPress={() => setFixOpen(true)}
              minTarget
              accessibilityRole="button"
              accessibilityLabel={t('scan.fixIt')}
              style={styles.fix}
            >
              <Ionicons name="help-circle-outline" size={20} color={c.accentText} />
              <Text variant="bodyStrong" tone="accent">
                {t('scan.fixIt')}
              </Text>
            </PressableScale>

            <Text variant="heading" accessibilityRole="header">
              {t('diet.statistics.personalizedRecommendations')}
            </Text>
            {loadingRecommendations ? (
              <SkeletonGroup label={t('diet.statistics.analyzingMeal')}>
                <Skeleton height={20} width="90%" />
                <Skeleton height={20} width="80%" />
                <Skeleton height={20} width="85%" />
              </SkeletonGroup>
            ) : (
              recommendations.map((text, index) => (
                <View key={index} style={styles.rowGap}>
                  <Ionicons name="checkmark-circle" size={20} color={c.successText} />
                  <Text tone="muted" style={styles.flex}>
                    {text}
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        {onScanAnother ? (
          <Button
            variant="accent"
            icon="camera"
            iconPosition="left"
            title={t('diet.statistics.scanAnother')}
            onPress={onScanAnother}
          />
        ) : null}
      </ScrollView>

      <Sheet
        visible={fixOpen}
        onClose={() => setFixOpen(false)}
        title={t('scan.fixTitle')}
        closeLabel={t('common.close')}
      >
        <View style={styles.fixList}>
          <Button
            variant="secondary"
            icon="resize-outline"
            iconPosition="left"
            title={t('scan.fixPortion')}
            onPress={() => {
              setFixOpen(false);
              setEditing(true);
            }}
          />
          <Button
            variant="secondary"
            icon="restaurant-outline"
            iconPosition="left"
            title={t('scan.fixFood')}
            onPress={() => {
              setFixOpen(false);
              setEditing(true);
            }}
          />
          {!anyAlternatives ? (
            <Text variant="caption" tone="muted">
              {t('scan.fixNoAlternatives')}
            </Text>
          ) : null}
          {onScanAnother ? (
            <Button
              icon="camera"
              iconPosition="left"
              title={t('scan.fixRescan')}
              onPress={() => {
                setFixOpen(false);
                onScanAnother();
              }}
            />
          ) : null}
        </View>
      </Sheet>
      {dialog}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  sheet: { maxHeight: '94%', overflow: 'hidden' },
  loadingGroup: { width: '100%', padding: 20, gap: 16 },
  content: { padding: 20, paddingBottom: 40, gap: 14 },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  centerText: { textAlign: 'center' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowBaseline: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  big: { fontSize: 48, lineHeight: 56 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tile: { flex: 1, borderRadius: 14, padding: 10, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  stack: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 64, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { minHeight: 36, borderRadius: 18, paddingHorizontal: 14, justifyContent: 'center' },
  chipNote: { marginTop: 6 },
  fix: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  fixList: { gap: 10, paddingBottom: 8 },
});
