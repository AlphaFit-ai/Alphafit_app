import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors, Fonts, Spacing } from '../constants';
import { firebaseAuthService } from '../services';

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  isDarkMode?: boolean;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onSuccess,
  onError,
  isDarkMode = false,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);

  React.useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    const available = await AppleAuthentication.isAvailableAsync();
    setIsAvailable(available);
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await firebaseAuthService.signInWithApple();
      onSuccess?.();
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Apple Sign-In error:', error);
        onError?.(error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAvailable || Platform.OS !== 'ios') {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isDarkMode ? Colors.white : Colors.gray[900] },
      ]}
      onPress={handleAppleSignIn}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={isDarkMode ? Colors.gray[900] : Colors.white} />
      ) : (
        <>
          <Ionicons 
            name="logo-apple" 
            size={20} 
            color={isDarkMode ? Colors.gray[900] : Colors.white} 
          />
          <Text style={[styles.buttonText, { color: isDarkMode ? Colors.gray[900] : Colors.white }]}>
            Continue with Apple
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
