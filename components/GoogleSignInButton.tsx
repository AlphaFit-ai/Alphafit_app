import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Colors, Fonts, Spacing } from '../constants';
import { firebaseAuthService } from '../services';

WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  isDarkMode?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  isDarkMode = false,
}) => {
  const [loading, setLoading] = React.useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '972624920920-jnpd9hrt779avgkiv01hpf1ghabo4esu.apps.googleusercontent.com',
    iosClientId: '972624920920-s0r51ubufl4271hublj74bni1rdmei90.apps.googleusercontent.com',
    webClientId: '972624920920-jnpd9hrt779avgkiv01hpf1ghabo4esu.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication?.idToken);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken?: string) => {
    if (!idToken) {
      onError?.(new Error('No ID token received from Google'));
      return;
    }

    try {
      setLoading(true);
      await firebaseAuthService.signInWithGoogleCredential(idToken);
      onSuccess?.();
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.white },
      ]}
      onPress={() => promptAsync()}
      disabled={loading || !request}
    >
      {loading ? (
        <ActivityIndicator color={isDarkMode ? Colors.white : Colors.gray[900]} />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={[styles.buttonText, { color: isDarkMode ? Colors.white : Colors.gray[900] }]}>
            Continue with Google
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
    borderWidth: 1,
    borderColor: Colors.gray[300],
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
});
