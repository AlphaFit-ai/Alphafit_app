import React, { useCallback, useMemo, useState } from 'react';
import { Dialog, DialogProps } from './Dialog';

export type DialogConfig = Omit<DialogProps, 'visible' | 'onClose'>;

/**
 * A dialog a screen opens from code, instead of `Alert.alert`: `const { show, dialog } = useDialog()`,
 * render `{dialog}` once, call `show({ title, message, actions })`.
 */
export function useDialog() {
  const [config, setConfig] = useState<DialogConfig | null>(null);
  const hide = useCallback(() => setConfig(null), []);
  const show = useCallback((next: DialogConfig) => setConfig(next), []);
  const dialog = useMemo(
    () => (config ? <Dialog {...config} visible onClose={hide} /> : null),
    [config, hide]
  );
  return { show, hide, dialog };
}
