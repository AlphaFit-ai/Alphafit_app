import { HeaderShownContext } from 'expo-router/react-navigation';
import React from 'react';
import {
  LayoutChangeEvent,
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
  /**
   * Leave the status-bar inset to the parent (a screen drawn inside another one). Not needed under a
   * navigator header: the screen sees that header and skips the inset by itself.
   */
  noTopInset?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  /**
   * Centre the body vertically in the space under the header (sign-in screens). The centre is taken
   * from the body's frame, which the keyboard does not change, so the content does not jump when the
   * keyboard opens; a body taller than the frame scrolls.
   */
  centered?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * The frame of a screen: token background, safe areas, optional pinned header and footer, scrolling
 * body, and keyboard handling. The body starts directly under the header (never vertically centred),
 * so every wizard step puts its heading at the same height.
 *
 * The status-bar inset is added only when nothing above already covers it. The app shows no navigator
 * header any more (every navigator has `headerShown: false`; a pushed screen draws a `PageHeader` in
 * its content), so every screen adds it once; should a navigator header come back, a screen under it
 * would start right below that header instead of adding the status bar a second time.
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
  centered = false,
  style,
  contentStyle,
}) => {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const underNavigatorHeader = React.useContext(HeaderShownContext);
  const topInset = noTopInset || underNavigatorHeader ? 0 : insets.top;
  // The only space between the status bar and the first row: `TOP_GAP` (4). The first rows (back
  // button, Login's buttons, Home's logo row, a wizard's progress) carry no top padding of their own.
  const ownsTop = !noTopInset && !underNavigatorHeader;
  const side = padded ? tokens.spacing.screen : 0;
  const body: StyleProp<ViewStyle> = [{ paddingHorizontal: side }, contentStyle];

  // Centred: the body sits in a view as tall as the scroll frame. The keyboard-aware scroll view adds
  // its keyboard space after that view, so the centre stays put while the keyboard is open.
  const [frameHeight, setFrameHeight] = React.useState(0);
  const scrollBody = centered ? [{ paddingHorizontal: side }] : body;
  const scrollChildren = centered ? (
    <View style={[{ minHeight: frameHeight, justifyContent: 'center' }, contentStyle]}>
      {children}
    </View>
  ) : (
    children
  );
  const onFrame = centered
    ? (event: LayoutChangeEvent) => setFrameHeight(event.nativeEvent.layout.height)
    : undefined;

  const content = scroll ? (
    keyboard ? (
      <KeyboardAwareScrollView
        style={styles.fill}
        contentContainerStyle={[styles.grow, scrollBody]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
        onLayout={onFrame}
      >
        {scrollChildren}
      </KeyboardAwareScrollView>
    ) : (
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[styles.grow, scrollBody]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        onLayout={onFrame}
      >
        {scrollChildren}
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
            paddingTop: topInset + TOP_GAP,
            paddingHorizontal: tokens.spacing.screen,
            paddingBottom: 12,
          }}
        >
          {header}
        </View>
      ) : (
        <View style={{ height: ownsTop ? topInset + TOP_GAP : 0 }} />
      )}
      {content}
      {footerView && keyboard ? <KeyboardStickyView>{footerView}</KeyboardStickyView> : footerView}
    </View>
  );
};

/** The space between the status bar and a screen's first row (spacing.xs). */
export const TOP_GAP = 4;

/** The heading block of a wizard step: sits at the top of the body with consistent spacing. */
export const screenTitleSpacing = 24;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
});
