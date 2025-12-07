import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { authService } from '../../services/api/authService';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme } = useTheme();
  const { login } = useAuth();
  const { showError } = useModal();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 35,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleSendCode = async () => {
    if (phoneNumber.trim().length < 10) {
      showError('Invalid Input', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);

    try {
      // Send verification code for login
      await authService.sendVerificationCode(phoneNumber);

      // Navigate to Verification screen with login mode
      navigation.navigate('Verification', { phoneNumber, mode: 'login' });
    } catch (error: any) {
      console.error('Send code error:', error);
      showError('Error', error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = phoneNumber.trim().length >= 10;

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
            {/* Logo Section */}
            <Animated.View
              style={[
                styles.logoSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={[styles.logoCircle, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <Icon name="chatbubbles" size={40} color={theme.primary} />
              </View>
              <Text style={[styles.brandName, { color: theme.text }]}>URGE</Text>
            </Animated.View>

            {/* Header */}
            <Animated.View
              style={[
                styles.headerSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, 10) }],
                },
              ]}
            >
              <Text style={[styles.title, { color: theme.text }]}>Welcome Back!</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Enter your phone number to receive a verification code
              </Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View
              style={[
                styles.formCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, 20) }],
                },
              ]}
            >
              <View style={[styles.cardContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Phone Number Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Icon name="call" size={18} color={theme.text} />
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Phone Number</Text>
                  </View>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="Enter your phone number"
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="phone-pad"
                      autoFocus
                    />
                  </View>
                </View>

                {/* Continue Button */}
                {isFormValid && (
                  <TouchableOpacity
                    style={[styles.signInButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
                    onPress={handleSendCode}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                        {loading ? 'Sending code...' : 'Continue'}
                      </Text>
                      <Icon name="arrow-forward" size={24} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}
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
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
                style={styles.signUpLink}
              >
                <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                  Don't have an account?{' '}
                  <Text style={[styles.footerLinkText, { color: theme.text }]}>Sign Up</Text>
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
  logoSection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    marginBottom: 24,
  },
  cardContent: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  inputGroup: {
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
    letterSpacing: 0.3,
  },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signInButton: {
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContent: {
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
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  signUpLink: {
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

export default LoginScreen;
