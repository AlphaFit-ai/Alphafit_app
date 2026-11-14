import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { PressableScale } from '../ui/Pressable';
import { useOpenFoodScan } from './openScan';

/** Diameter of the coral button; the touch area is the whole tab slot, at least 56 x 56. */
export const SCAN_BUTTON_SIZE = 56;

/**
 * The centre of the tab bar: the app's main action, a coral button that opens the food scan (after the
 * diet questions when they are not finished). It is not a tab of its own; it never shows as selected.
 */
export function ScanTabButton({ style }: { style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const openScan = useOpenFoodScan();
  const c = tokens.color;

  return (
    <View style={[style, styles.slot]}>
      <PressableScale
        testID="tab-scan"
        accessibilityRole="button"
        accessibilityLabel={t('tabs.scanFood')}
        accessibilityHint={t('tabs.scanHint')}
        onPress={() => openScan()}
        pressedScale={0.92}
        style={[
          styles.button,
          tokens.elevation.raised,
          {
            backgroundColor: c.accent,
            // A ring in the bar's colour separates the raised button from the bar's top border.
            borderColor: c.bg,
          },
        ]}
      >
        <Ionicons name="scan" size={26} color={c.onAccent} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  button: {
    width: SCAN_BUTTON_SIZE,
    height: SCAN_BUTTON_SIZE,
    borderRadius: SCAN_BUTTON_SIZE / 2,
    borderWidth: 4,
    marginTop: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
