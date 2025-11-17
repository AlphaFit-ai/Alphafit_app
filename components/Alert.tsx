import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '../constants';
import { useTheme } from '../context/ThemeContext';

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

export const Alert = ({ visible, title, message, buttons = [{ text: 'OK' }], onClose }: AlertProps) => {
  const { colors, isDarkMode } = useTheme();
  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message && (
            <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
          )}
          <View style={[styles.buttonContainer, { borderTopColor: colors.border }]}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index < buttons.length - 1 && { borderRightWidth: 0.5, borderRightColor: colors.border },
                  buttons.length === 2 && index === 0 && styles.buttonHalf,
                  buttons.length === 2 && index === 1 && styles.buttonHalf,
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: button.style === 'destructive' ? Colors.red : (isDarkMode ? colors.primary : '#007AFF') },
                    button.style === 'cancel' && styles.buttonTextBold,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 14,
    width: 270,
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    lineHeight: 18,
  },
  buttonContainer: {
    borderTopWidth: 0.5,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    fontSize: 17,
    fontFamily: Fonts.regular,
  },
  buttonTextBold: {
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
});
