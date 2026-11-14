import React from 'react';
import {
  RefreshControlProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export interface ScreenProps {
  children: React.ReactNode;
  /** Pinned at the top, under the status bar (back button and progress, a title bar). */
  header?: React.ReactNode;
  /** Pinned at the bottom, above the home indicator and the keyboard (the Continue button). */
  footer?: React.ReactNode;
  /** The body scrolls. */
  scroll?: boolean;
  /** The screen has text inputs: the body and the footer move out of the keyboard's way. */
  keyboard?: boolean;
  /** Side padding on the body (default true). */
  padded?: boolean;
  /** Leave the status-bar inset to the parent (a tab screen under its own header). */
  noTopInset?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * The frame of a screen: token background, safe areas, optional pinned header and footer, scrolling
 * body, and keyboard handling. The body starts directly under the header (never vertically centred),
 * so every wizard step puts its heading at the same height.
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  header,
  footer,
  scroll = false,
  keyboard = false,
  padded = true,
  noTopInset = false,
  refreshControl,
  style,
  contentStyle,
}) => {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const side = padded ? tokens.spacing.screen : 0;
  const body: StyleProp<ViewStyle> = [{ paddingHorizontal: side }, contentStyle];

  const content = scroll ? (
    keyboard ? (
      <KeyboardAwareScrollView
        style={styles.fill}
        contentContainerStyle={[styles.grow, body]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        {children}
      </KeyboardAwareScrollView>
    ) : (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.grow, body]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    )
  ) : (
    <View style={[styles.fill, body]}>{children}</View>
  );

  const footerView = footer ? (
    <View
      style={{
        paddingHorizontal: tokens.spacing.screen,
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 16) + 8,
        backgroundColor: tokens.color.bg,
      }}
    >
      {footer}
    </View>
  ) : null;

  return (
    <View style={[styles.fill, { backgroundColor: tokens.color.bg }, style]}>
      {header ? (
        <View
          style={{
            paddingTop: noTopInset ? 8 : insets.top + 8,
            paddingHorizontal: tokens.spacing.screen,
            paddingBottom: 12,
          }}
        >
          {header}
        </View>
      ) : (
        <View style={{ height: noTopInset ? 0 : insets.top }} />
      )}
      {content}
      {footerView && keyboard ? <KeyboardStickyView>{footerView}</KeyboardStickyView> : footerView}
    </View>
  );
};

/** The heading block of a wizard step: sits at the top of the body with consistent spacing. */
export const screenTitleSpacing = 24;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
});
