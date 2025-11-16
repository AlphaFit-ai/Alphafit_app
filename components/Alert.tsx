import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts } from '../constants';

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
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  index < buttons.length - 1 && styles.buttonBorder,
                  buttons.length === 2 && index === 0 && styles.buttonHalf,
                  buttons.length === 2 && index === 1 && styles.buttonHalf,
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.buttonTextBold,
                    button.style === 'destructive' && styles.buttonTextDestructive,
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
    backgroundColor: Colors.white,
    borderRadius: 14,
    width: 270,
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    fontWeight: '600',
    color: Colors.black,
    textAlign: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.black,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    lineHeight: 18,
  },
  buttonContainer: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.gray[300],
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
  buttonBorder: {
    borderRightWidth: 0.5,
    borderRightColor: Colors.gray[300],
  },
  buttonText: {
    fontSize: 17,
    fontFamily: Fonts.regular,
    color: '#007AFF',
  },
  buttonTextBold: {
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  buttonTextDestructive: {
    color: Colors.red,
  },
});
