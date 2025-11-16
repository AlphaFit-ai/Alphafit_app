import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  floating?: boolean;
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
  style,
  textStyle,
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...(fullWidth && styles.fullWidth),
    };

    switch (variant) {
      case 'primary':
        return { ...baseStyle, backgroundColor: Colors.black };
      case 'secondary':
        return { ...baseStyle, backgroundColor: Colors.gray[200] };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: Colors.black,
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
        return { ...baseStyle, color: Colors.white };
      case 'secondary':
        return { ...baseStyle, color: Colors.black };
      case 'outline':
        return { ...baseStyle, color: Colors.black };
      case 'ghost':
        return { ...baseStyle, color: Colors.black };
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
        <ActivityIndicator color={variant === 'primary' ? Colors.white : Colors.black} />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
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
  text: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    fontWeight: Fonts.weights.semiBold,
  },
  disabled: {
    opacity: 0.5,
  },
});
