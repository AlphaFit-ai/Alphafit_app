import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (language: LanguageOption) => void;
  selectedLanguage: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const LanguageSelector = ({ visible, onClose, onSelect, selectedLanguage }: LanguageSelectorProps) => {
  const { colors, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleSelect = (language: LanguageOption) => {
    onSelect(language);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[styles.overlay, { opacity: fadeAnim }]}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View 
          style={[
            styles.container, 
            { 
              backgroundColor: colors.card,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
          </View>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Select Language</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.list}>
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.item,
                  { borderBottomColor: colors.border },
                  selectedLanguage === language.code && [
                    styles.itemActive, 
                    { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.gray[50] }
                  ],
                ]}
                onPress={() => handleSelect(language)}
                activeOpacity={0.7}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.flag}>{language.flag}</Text>
                  <Text style={[styles.name, { color: colors.text }]}>{language.name}</Text>
                </View>
                {selectedLanguage === language.code && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  list: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  itemActive: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  flag: {
    fontSize: 32,
  },
  name: {
    fontSize: 17,
    fontFamily: Fonts.medium,
  },
});
