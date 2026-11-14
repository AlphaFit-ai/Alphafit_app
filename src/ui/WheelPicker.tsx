import React from 'react';
import {
  AccessibilityActionEvent,
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';
import { Fonts } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { haptic } from './haptics';
import { Text } from './Text';

export const WHEEL_ITEM_HEIGHT = 50;
const VISIBLE_ROWS = 5;

export interface WheelItem {
  key: string;
  label: string;
}

export interface WheelPickerProps {
  items: WheelItem[];
  /** Index of the selected item. */
  selectedIndex: number;
  onChange: (index: number) => void;
  /** Column title above the wheel; also the accessible name. */
  label?: string;
  /** Accessible value text, e.g. "175 cm"; defaults to the item label. */
  valueText?: (item: WheelItem) => string;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

interface RowProps {
  label: string;
  selected: boolean;
}

const Row = React.memo(function Row({ label, selected }: RowProps) {
  const { tokens } = useTheme();
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no">
      <Text
        style={{
          fontFamily: selected ? Fonts.bold : Fonts.medium,
          fontSize: selected ? 18 : 16,
          color: selected ? tokens.color.text : tokens.color.textSubtle,
        }}
      >
        {label}
      </Text>
    </View>
  );
});

/**
 * One virtualised wheel (a FlatList with snapping). It replaces the three hand-copied ScrollView
 * pickers: rows are rendered on demand, the start position uses `initialScrollIndex` (no timers),
 * a screen reader gets one adjustable control with increment and decrement, and each step ticks.
 */
export const WheelPicker: React.FC<WheelPickerProps> = ({
  items,
  selectedIndex,
  onChange,
  label,
  valueText,
}) => {
  const { tokens } = useTheme();
  const listRef = React.useRef<FlatList<WheelItem>>(null);
  const lastReported = React.useRef(selectedIndex);
  const safeIndex = clamp(selectedIndex, 0, Math.max(0, items.length - 1));

  // When the parent moves the selection (a day clamped after a month change), move the wheel too.
  React.useEffect(() => {
    if (safeIndex !== lastReported.current) {
      lastReported.current = safeIndex;
      listRef.current?.scrollToOffset({ offset: safeIndex * WHEEL_ITEM_HEIGHT, animated: false });
    }
  }, [safeIndex]);

  const report = React.useCallback(
    (index: number) => {
      const next = clamp(index, 0, items.length - 1);
      if (next !== lastReported.current) {
        lastReported.current = next;
        haptic.select();
        onChange(next);
      }
    },
    [items.length, onChange]
  );

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    report(Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_HEIGHT));
  };

  const step = (delta: number) => {
    const next = clamp(safeIndex + delta, 0, items.length - 1);
    listRef.current?.scrollToOffset({ offset: next * WHEEL_ITEM_HEIGHT, animated: true });
    report(next);
  };

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') step(1);
    if (event.nativeEvent.actionName === 'decrement') step(-1);
  };

  const renderItem = React.useCallback(
    ({ item, index }: ListRenderItemInfo<WheelItem>) => (
      <Row label={item.label} selected={index === safeIndex} />
    ),
    [safeIndex]
  );

  const current = items[safeIndex];
  const pad = WHEEL_ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: tokens.color.bgSubtle, borderRadius: tokens.radius.lg },
      ]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: current ? (valueText ? valueText(current) : current.label) : '' }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
    >
      <View pointerEvents="none" style={[styles.highlight, { borderColor: tokens.color.border }]} />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        extraData={safeIndex}
        getItemLayout={(_, index) => ({
          length: WHEEL_ITEM_HEIGHT,
          offset: WHEEL_ITEM_HEIGHT * index,
          index,
        })}
        initialScrollIndex={safeIndex}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: pad }}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        windowSize={5}
        initialNumToRender={VISIBLE_ROWS + 2}
        maxToRenderPerBatch={VISIBLE_ROWS}
        removeClippedSubviews
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS, overflow: 'hidden', width: '100%' },
  row: { height: WHEEL_ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  highlight: {
    position: 'absolute',
    top: WHEEL_ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    zIndex: 1,
  },
});
