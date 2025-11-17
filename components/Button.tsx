import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  floating?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  fullWidth = true,
  floating = false,
  icon,
  iconPosition = 'right',
  style,
  textStyle,
}) => {
  const { colors, isDarkMode } = useTheme();
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.fullWidth),
    };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: isDarkMode ? Colors.white : Colors.black };
      case 'secondary':
        return { ...baseStyle, backgroundColor: isDarkMode ? Colors.gray[700] : Colors.gray[200] };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.text,
        };
      case 'ghost':
        return { ...baseStyle, backgroundColor: 'transparent' };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = styles.text;

    switch (variant) {
      case 'primary':
        return { ...baseStyle, color: isDarkMode ? Colors.black : Colors.white };
      case 'secondary':
        return { ...baseStyle, color: colors.text };
      case 'outline':
        return { ...baseStyle, color: colors.text };
      case 'ghost':
        return { ...baseStyle, color: colors.text };
      default:
        return baseStyle;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { height: 40, paddingHorizontal: Spacing.md };
      case 'medium':
        return { height: 48, paddingHorizontal: Spacing.lg };
      case 'large':
        return { height: Spacing.buttonHeight, paddingHorizontal: Spacing.lg };
      default:
        return {};
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getButtonStyle(),
        getSizeStyle(),
        disabled && styles.disabled,
        floating && styles.floating,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? (isDarkMode ? Colors.black : Colors.white) : colors.text} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={variant === 'primary' ? (isDarkMode ? Colors.black : Colors.white) : colors.text} 
              style={styles.iconLeft}
            />
          )}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons 
              name={icon} 
              size={20} 
              color={variant === 'primary' ? (isDarkMode ? Colors.black : Colors.white) : colors.text} 
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Spacing.buttonRadius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  floating: {
    position: 'absolute',
    bottom: 20,
    left: Spacing.screenPaddingHorizontal,
    right: Spacing.screenPaddingHorizontal,
    width: 'auto',
    zIndex: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  text: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    fontWeight: Fonts.weights.semiBold,
  },
  disabled: {
    opacity: 0.5,
  },
});
