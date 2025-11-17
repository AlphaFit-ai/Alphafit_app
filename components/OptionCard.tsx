import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface OptionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  title,
  subtitle,
  icon,
  selected = false,
  onPress,
  style,
}) => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        { 
          backgroundColor: selected ? Colors.black : (isDarkMode ? Colors.gray[800] : Colors.gray[100]),
          borderColor: selected ? Colors.black : 'transparent'
        },
        style,
      ]}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: selected ? Colors.white : colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: selected ? Colors.gray[300] : colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    minHeight: 56,
    borderWidth: 2,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Fonts.sizes.base,
    fontFamily: Fonts.semiBold,
    fontWeight: Fonts.weights.semiBold,
  },
  subtitle: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});
