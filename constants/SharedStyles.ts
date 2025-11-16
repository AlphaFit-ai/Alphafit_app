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
    marginBottom: 20,
    marginTop: 30,
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

  // ScrollView Styles
  scrollView: {
    flex: 1,
  },

  scrollContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },

  innerContent: {
    width: '100%',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
  },

  // Image Styles
  fullWidthImage: {
    width: '100%',
    height: 200,
    marginBottom: 32,
  },

  // Button Group Styles
  buttonGroup: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },

  choiceButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    alignItems: 'center',
  },

  choiceButtonActive: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },

  choiceButtonText: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.bold,
    color: Colors.black,
  },

  choiceButtonTextActive: {
    color: Colors.white,
  },

  // Text Input Styles
  textArea: {
    backgroundColor: Colors.gray[100],
    borderRadius: 16,
    padding: 16,
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    color: Colors.black,
    minHeight: 140,
    marginTop: 8,
    marginBottom: 60,
  },
});
