import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { useReduceMotion } from './motion';

/**
 * Animates a wizard that swaps its screen in place (the Diet and Projections tabs): a step forward
 * slides in from the right, a step back from the left, the first one fades. Nothing moves when the
 * phone asks for reduced motion. `key` on the inner view restarts the animation for each step.
 */
export const StepTransition: React.FC<{ step: number; children: React.ReactNode }> = ({
  step,
  children,
}) => {
  const reduce = useReduceMotion();
  const previous = React.useRef<number | null>(null);
  const direction = previous.current === null ? 0 : step >= previous.current ? 1 : -1;
  React.useEffect(() => {
    previous.current = step;
  }, [step]);

  const entering = reduce
    ? undefined
    : direction === 0
      ? FadeIn.duration(180)
      : direction > 0
        ? SlideInRight.duration(220)
        : SlideInLeft.duration(220);

  return (
    <Animated.View key={step} entering={entering} style={styles.fill}>
      {children}
    </Animated.View>
  );
};

/** Which animation a step change picks (kept apart so it can be tested). */
export function stepDirection(previous: number | null, next: number): 0 | 1 | -1 {
  if (previous === null) return 0;
  return next >= previous ? 1 : -1;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
