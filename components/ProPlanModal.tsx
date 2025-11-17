import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    Modal,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface ProPlanModalProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

export const ProPlanModal: React.FC<ProPlanModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { colors, isDarkMode } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const translateY = React.useRef(new Animated.Value(MODAL_HEIGHT)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeModal();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible]);

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const monthlyFeatures = [
    { icon: 'body', text: 'AI physique projection' },
    { icon: 'barbell', text: 'Custom weekly workouts' },
    { icon: 'restaurant', text: 'Personalized diet plans' },
    { icon: 'stats-chart', text: 'Progress reports + charts' },
  ];

  const yearlyFeatures = [
    { icon: 'body', text: 'Full AI physique projection' },
    { icon: 'barbell', text: 'Custom weekly workouts' },
    { icon: 'restaurant', text: 'Personalized diet plans' },
    { icon: 'stats-chart', text: 'Progress reports + charts' },
    { icon: 'chatbubbles', text: 'AI Coach chat (24/7)' },
    { icon: 'ribbon', text: 'Streak badges & milestones' },
    { icon: 'people', text: 'Priority support' },
  ];

  const currentFeatures = selectedPlan === 'monthly' ? monthlyFeatures : yearlyFeatures;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeModal}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeModal}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.background,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Handle Bar */}
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Card 1: Title Card */}
            <View style={styles.cardContainer}>
              <LinearGradient
                colors={isDarkMode ? ['#2D2D2D', '#1A1A1A'] : ['#EFBF04', '#FAFAFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, isDarkMode && { borderWidth: 1, borderColor: Colors.gray[700] }]}
              >
                <View style={[styles.proBadge, { backgroundColor: isDarkMode ? Colors.gray[800] : Colors.goldLight }]}>
                  <Ionicons name="trophy" size={14} color={isDarkMode ? Colors.gold : Colors.gold} />
                  <Text style={[styles.proBadgeText, { color: isDarkMode ? Colors.gold : Colors.goldDark }]}>FORGE PRO</Text>
                </View>
                
                <Text style={[styles.title, { color: colors.text }]}>
                  <Text style={styles.titleUnlock}>Unlock</Text> Your Full{'\n'}Potential
                </Text>
                
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Get AI-powered coaching and transform{'\n'}your physique faster
                </Text>
              </LinearGradient>
            </View>

            {/* Card 2: Pricing Card */}
            <View style={styles.cardContainer}>
              <LinearGradient
                colors={isDarkMode ? ['#2D2D2D', '#1F1F1F'] : ['#F9FAFB', '#EBE389']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.card, isDarkMode && { borderWidth: 1, borderColor: Colors.gray[700] }]}
              >
                {/* Limited Time Offer Badge */}
                <View style={[styles.offerBadge, isDarkMode && { backgroundColor: 'rgba(255, 107, 74, 0.15)' }]}>
                  <Ionicons name="sparkles" size={14} color={Colors.primary} />
                  <Text style={styles.offerText}>Limited Time Offer</Text>
                </View>

                {/* Price */}
                <View style={styles.priceRow}>
                  <View style={styles.priceContainer}>
                    {selectedPlan === 'yearly' && <Text style={[styles.oldPrice, { color: isDarkMode ? Colors.gray[600] : Colors.gray[300] }]}>$120</Text>}
                    <Text style={[styles.newPrice, { color: isDarkMode ? Colors.primary : Colors.primary }]}>
                      {selectedPlan === 'monthly' ? '$9.99' : '$49.99'}
                    </Text>
                  </View>
                  {selectedPlan === 'yearly' && (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveText}>Save 25%</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.perYear, { color: isDarkMode ? Colors.gray[500] : Colors.gray[400] }]}>
                  {selectedPlan === 'monthly' ? 'per month' : 'per year'}
                </Text>

                {/* Plan Selection */}
                <View style={styles.planButtons}>
                  <TouchableOpacity
                    style={[
                      styles.planButton,
                      { 
                        backgroundColor: isDarkMode ? colors.card : Colors.white,
                        borderColor: selectedPlan === 'monthly' ? Colors.primary : colors.border 
                      },
                      selectedPlan === 'monthly' && styles.planButtonActive,
                    ]}
                    onPress={() => setSelectedPlan('monthly')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.planButtonTitle,
                      { color: selectedPlan === 'monthly' ? colors.text : colors.textSecondary },
                    ]}>
                      Monthly
                    </Text>
                    <Text style={[
                      styles.planButtonPrice,
                      selectedPlan === 'monthly' && styles.planButtonPriceActive,
                      { color: selectedPlan === 'monthly' ? Colors.primary : colors.textSecondary },
                    ]}>
                      $9.99/month
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.planButton,
                      { 
                        backgroundColor: isDarkMode ? colors.card : Colors.white,
                        borderColor: selectedPlan === 'yearly' ? Colors.primary : colors.border 
                      },
                      selectedPlan === 'yearly' && styles.planButtonActive,
                    ]}
                    onPress={() => setSelectedPlan('yearly')}
                    activeOpacity={0.7}
                  >
                    {selectedPlan === 'yearly' && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Popular</Text>
                      </View>
                    )}
                    <Text style={[
                      styles.planButtonTitle,
                      { color: selectedPlan === 'yearly' ? colors.text : colors.textSecondary },
                    ]}>
                      Yearly
                    </Text>
                    <Text style={[
                      styles.planButtonPrice,
                      selectedPlan === 'yearly' && styles.planButtonPriceActive,
                      { color: selectedPlan === 'yearly' ? Colors.primary : colors.textSecondary },
                    ]}>
                      $49.99/year
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              <View style={styles.featuresHeader}>
                <Ionicons name="flash" size={18} color={colors.text} />
                <Text style={[styles.featuresTitle, { color: colors.text }]}>Premium Features</Text>
              </View>

              <View style={styles.featuresList}>
                {currentFeatures.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.checkIconContainer}>
                      <Ionicons name="checkmark-circle" size={22} color={colors.text} />
                    </View>
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* CTA Buttons */}
            <TouchableOpacity 
              activeOpacity={0.9} 
              style={[
                styles.freeTrialButton, 
                { 
                  backgroundColor: isDarkMode ? Colors.gray[800] : colors.background,
                  borderColor: isDarkMode ? Colors.gray[600] : colors.text 
                }
              ]} 
              disabled
            >
              <Text style={[styles.freeTrialButtonText, { color: colors.text }]}>Start Free Trial - 7 Days</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} disabled>
              <LinearGradient
                colors={isDarkMode ? [Colors.primary, '#E85D3F'] : [Colors.black, Colors.gray[800]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaButtonText}>
                  Get Premium - {selectedPlan === 'monthly' ? '$9.99/mo' : '$49.99/yr'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: 8,
  },
  cardContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 20,
  },
  proBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 36,
    textAlign: 'center',
  },
  titleUnlock: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    textAlign: 'center',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginBottom: 16,
  },
  offerText: {
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  oldPrice: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  newPrice: {
    fontSize: 44,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  saveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  saveText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.white,
  },
  perYear: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    marginBottom: 24,
    textAlign: 'center',
  },
  planButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  planButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    position: 'relative',
  },
  planButtonActive: {
    backgroundColor: 'rgba(255, 107, 74, 0.03)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.white,
  },
  planButtonTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
  },
  planButtonPrice: {
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  planButtonPriceActive: {
    fontFamily: Fonts.semiBold,
  },
  featuresSection: {
    marginBottom: 28,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  featuresList: {
    gap: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIconContainer: {
    width: 22,
    height: 22,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  ctaButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.white,
  },
  freeTrialButton: {
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  freeTrialButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
});
