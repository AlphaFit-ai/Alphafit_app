import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback, in four meanings. Never throws and does nothing on the web or on a device
 * without a haptic engine, so a screen can call it without a guard.
 */
const run = (action: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  try {
    void action().catch(() => undefined);
  } catch {
    // no haptic engine: nothing to do
  }
};

export const haptic = {
  /** A control was pressed or a wheel moved to a new value. */
  select: () => run(() => Haptics.selectionAsync()),
  /** An action went through (saved, signed in, step done). */
  confirm: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something failed or was refused. */
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  /** The scan shutter. */
  shutter: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
};
