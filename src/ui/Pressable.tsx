import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { haptic } from './haptics';
import { DURATION, useReduceMotion } from './motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed. */
  pressedScale?: number;
  /** A haptic tick on press. */
  feedback?: boolean;
  /** Grow the touch area to 44 pt on every side that is smaller. */
  minTarget?: boolean;
}

/** A pressable with a subtle scale on press (off when the phone asks for reduced motion). */
export const PressableScale: React.FC<PressableScaleProps> = ({
  style,
  pressedScale = 0.97,
  feedback = false,
  minTarget = false,
  onPressIn,
  onPressOut,
  onPress,
  hitSlop,
  ...rest
}) => {
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      hitSlop={hitSlop ?? (minTarget ? 8 : undefined)}
      onPressIn={(e) => {
        if (!reduce) scale.set(withTiming(pressedScale, { duration: DURATION.fast }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reduce) scale.set(withTiming(1, { duration: DURATION.fast }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (feedback) haptic.select();
        onPress?.(e);
      }}
      style={[animated, style]}
    />
  );
};
