import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface FullScreenProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
}

/**
 * A full-screen layer for the camera (the barcode scanner). It is the one place a native Modal is used
 * directly: a camera preview needs the whole screen, which neither a Dialog nor a Sheet gives.
 */
export const FullScreen: React.FC<FullScreenProps> = ({ visible, onRequestClose, children }) => {
  const { tokens } = useTheme();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <View
        accessibilityViewIsModal
        style={[styles.fill, { backgroundColor: tokens.mode === 'dark' ? '#000000' : '#111827' }]}
      >
        {children}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({ fill: { flex: 1 } });
