import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PressableScale } from './Pressable';
import { Text } from './Text';

/**
 * The app has no navigator bars (the owner wants no header): a pushed screen opens with this block at
 * the top of its scrolling content instead. A small round back button (iOS has no hardware back; the
 * Android back button and the gesture keep working as well) with an optional action on the right, then
 * the screen's title in large type. It scrolls away with the page.
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Show the back button (default: when there is a screen to go back to, in this navigator or one
   * above it: a Profile screen is the first of its own stack, the tabs are below it).
   */
  back?: boolean;
  /** What back does (default: the router's back, the same action as Android back). */
  onBack?: () => void;
  /** An action on the right of the back row (History's filter). */
  right?: React.ReactNode;
}

/** The round back button, the same everywhere (the page header, the chat). */
export function BackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      feedback
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      style={styles.target}
    >
      <View style={[styles.round, { backgroundColor: tokens.color.surfaceMuted }]}>
        <Ionicons name="chevron-back" size={22} color={tokens.color.text} />
      </View>
    </PressableScale>
  );
}

export function PageHeader({ title, subtitle, back, onBack, right }: PageHeaderProps) {
  // The router, not the nearest navigator: `navigation.canGoBack()` says false on the first screen of a
  // nested stack even though the stack below it can go back.
  const router = useRouter();
  const { tokens } = useTheme();
  const showBack = back ?? router.canGoBack();
  return (
    // No top padding: Screen's small gap under the status bar is the only space above it.
    <View style={[styles.root, { gap: tokens.spacing.md }]}>
      {showBack || right ? (
        <View style={styles.row}>
          {showBack ? <BackButton onPress={onBack ?? (() => router.back())} /> : <View />}
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      ) : null}
      <View style={styles.titles}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titles: { gap: 6 },
  // A 44 pt target around a 40 pt circle, flush with the content's left edge.
  target: { width: 44, height: 44, alignItems: 'flex-start', justifyContent: 'center' },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
