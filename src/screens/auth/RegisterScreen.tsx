import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { Theme } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { authService } from '../../services/api/authService';
import { validatePhoneNumber, getPhoneValidationError } from '../../utils/validators';

const { width, height } = Dimensions.get('window');

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { theme } = useTheme();
  const { showError } = useModal();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 30,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleContinue = async () => {
    const trimmedPhone = phoneNumber.trim();
    const phoneError = getPhoneValidationError(trimmedPhone);
    if (phoneError) {
      showError('Invalid Input', phoneError);
      return;
    }

    setLoading(true);

    try {
      // Send verification code to phone number
      await authService.sendVerificationCode(trimmedPhone);

      // Navigate to Verification screen
      navigation.navigate('Verification', { phoneNumber: trimmedPhone });
    } catch (error: any) {
      console.error('Send code error:', error);
      showError('Error', error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const logoScale = logoRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.1, 1],
  });

  const isValid = validatePhoneNumber(phoneNumber);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.backgroundGradientStart, theme.backgroundGradientEnd, theme.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Animated Logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: logoScale },
                  ],
                },
              ]}
            >
              <View style={[styles.logoCircle, { borderColor: theme.border }]}>
                <LinearGradient
                  colors={[theme.surfaceElevated, theme.surface]}
                  style={styles.logoGradient}
                >
                  <Icon name="chatbubbles" size={48} color={theme.primary} />
                </LinearGradient>
              </View>
            </Animated.View>

            {/* Header Text */}
            <Animated.View
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, 20) }],
                },
              ]}
            >
              <Text style={[styles.brandName, { color: theme.text }]}>URGE</Text>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>Join the Conversation</Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Create your account to start connecting
              </Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, 40) }],
                },
              ]}
            >
              <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Phone Number Section */}
                <View style={styles.inputSection}>
                  <View style={styles.labelRow}>
                    <Icon name="call" size={16} color={theme.text} />
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Phone Number</Text>
                  </View>

                  <View style={[styles.inputBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, isFocused && styles.inputBoxFocused]}>
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                      placeholderTextColor={theme.textTertiary}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      maxLength={15}
                    />
                    {phoneNumber.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setPhoneNumber('')}
                        style={styles.clearIcon}
                        activeOpacity={0.7}
                      >
                        <Icon name="close-circle" size={20} color={theme.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.hintRow}>
                    <Icon name="information-circle" size={14} color={theme.textSecondary} />
                    <Text style={[styles.hintText, { color: theme.textSecondary }]}>We'll send you a verification code</Text>
                  </View>
                </View>

                {/* Continue Button */}
                {isValid && (
                  <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
                    onPress={handleContinue}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonContainer}>
                      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                        {loading ? 'Sending Code...' : 'Continue'}
                      </Text>
                      <Icon name="arrow-forward-circle" size={24} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}

                {/* Features Grid - Inside Container */}
                <View style={[styles.featuresGrid, { borderTopColor: theme.border }]}>
                  <View style={styles.featureBox}>
                    <Icon name="flash" size={18} color={theme.text} />
                    <Text style={[styles.featureLabel, { color: theme.textSecondary }]}>Instant</Text>
                  </View>
                  <View style={styles.featureBox}>
                    <Icon name="lock-closed" size={18} color={theme.text} />
                    <Text style={[styles.featureLabel, { color: theme.textSecondary }]}>Private</Text>
                  </View>
                  <View style={styles.featureBox}>
                    <Icon name="people" size={18} color={theme.text} />
                    <Text style={[styles.featureLabel, { color: theme.textSecondary }]}>Connect</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View
              style={[
                styles.footer,
                { opacity: fadeAnim },
              ]}
            >
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
                style={styles.loginLink}
              >
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  Already have an account?{' '}
                  <Text style={[styles.footerLinkText, { color: theme.text }]}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  inputSection: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputBoxFocused: {
    borderColor: 'rgba(74, 144, 226, 0.8)',
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  clearIcon: {
    padding: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  continueButton: {
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  securityText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    marginTop: 12,
    borderTopWidth: 1,
  },
  featureBox: {
    alignItems: 'center',
    gap: 6,
  },
  featureLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loginLink: {
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
  },
  footerLinkText: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
