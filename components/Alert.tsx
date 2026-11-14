import React from 'react';
import { Dialog, DialogAction } from '../src/ui/Dialog';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

/** Older call shape kept for the screens not moved yet; it renders the shared Dialog. */
export const Alert = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onClose,
}: AlertProps) => {
  const actions: DialogAction[] = buttons.map((b) => ({
    label: b.text,
    onPress: b.onPress,
    tone: b.style,
  }));
  return (
    <Dialog visible={visible} title={title} message={message} actions={actions} onClose={onClose} />
  );
};
