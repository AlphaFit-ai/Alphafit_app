import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, TextStyle } from 'react-native';
import { Colors } from '../constants';

interface GradientTextProps {
  text: string;
  style?: TextStyle;
}

export const GradientText: React.FC<GradientTextProps> = ({ text, style }) => {
  // Use CSS gradient for web
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          styles.text,
          style,
          {
            // @ts-ignore - Web-specific CSS properties
            backgroundImage: `linear-gradient(90deg, ${Colors.primary} 0%, ${Colors.secondary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          },
        ]}
      >
        {text}
      </Text>
    );
  }

  // Use MaskedView for native
  return (
    <MaskedView
      maskElement={
        <Text style={[styles.text, style]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientContainer}
      >
        <Text style={[styles.text, style, styles.transparentText]}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
  gradientContainer: {
    alignSelf: 'center',
  },
  transparentText: {
    opacity: 0,
  },
});
