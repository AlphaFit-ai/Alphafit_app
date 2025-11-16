import { StyleSheet } from 'react-native';
import { Colors } from './Colors';
import { Fonts } from './Fonts';
import { Spacing } from './Spacing';

export const SharedStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // Headers
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 20,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    justifyContent: 'center',
  },

  // Titles
  title: {
    fontSize: Fonts.sizes['4xl'],
    fontFamily: Fonts.bold,
    color: Colors.black,
    marginBottom: 40,
  },

  // Options Container
  optionsContainer: {
    gap: 12,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingBottom: 40,
  },

  // Footer with ScrollView (floating button style)
  footerFloating: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },

  // Absolute Footer
  footerAbsolute: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 24,
  },

  // Back Button
  backButton: {
    position: 'absolute',
    top: 60,
    left: Spacing.screenPaddingHorizontal,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
