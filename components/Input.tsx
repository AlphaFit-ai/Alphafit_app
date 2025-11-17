import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  ...props
}) => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input, 
          { 
            backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[100],
            color: colors.text
          },
          error && styles.inputError, 
          style
        ]}
        placeholderTextColor={Colors.gray[400]}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: Spacing.sm,
  },
  label: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.semiBold,
    fontWeight: Fonts.weights.semiBold,
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: Spacing.radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.regular,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    fontSize: Fonts.sizes.xs,
    fontFamily: Fonts.regular,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
});
