import React from 'react';
import { DimensionValue, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { useReduceMotion } from './motion';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A placeholder block that pulses gently while content loads (static when reduced motion is on). */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}) => {
  const { tokens } = useTheme();
  const reduce = useReduceMotion();
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (reduce) {
      opacity.value = 1;
      return;
    }
    opacity.value = withRepeat(withTiming(0.55, { duration: 800 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [reduce, opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: tokens.color.skeleton },
        animated,
        style,
      ]}
    />
  );
};

/** A loading region: announced once as "loading", its placeholder children are hidden from readers. */
export const SkeletonGroup: React.FC<{
  label: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ label, children, style }) => (
  <View
    accessible
    accessibilityLabel={label}
    accessibilityState={{ busy: true }}
    style={[styles.group, style]}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({ group: { gap: 12 } });
