import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';

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
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        selected && styles.selected,
        style,
      ]}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.textContainer}>
        <Text style={[styles.title, selected && styles.selectedText]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, selected && styles.selectedSubtext]}>
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
    backgroundColor: Colors.gray[100],
    borderRadius: Spacing.radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
    minHeight: 56,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selected: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
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
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Fonts.sizes.sm,
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectedText: {
    color: Colors.white,
  },
  selectedSubtext: {
    color: Colors.gray[300],
  },
});
