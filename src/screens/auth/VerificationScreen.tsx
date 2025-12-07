import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Verification'>;

const VerificationScreen = ({ route, navigation }: Props) => {
  const { phoneNumber, mode = 'register' } = route.params;
  const { theme } = useTheme();
  const { showSuccess, showError } = useModal();
  const { verifyPhone: verifyPhoneAuth } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCodeChange = (text: string, index: number) => {
    if (text.length > 1) {
      text = text.charAt(0);
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (index === 5 && text && newCode.every(digit => digit)) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setLoading(true);

    try {
      // Validate code format
      if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
        throw new Error('Invalid verification code format');
      }

      if (mode === 'login') {
        // For existing users (login), use AuthContext's verifyPhone
        try {
          await verifyPhoneAuth(phoneNumber, verificationCode);
          showSuccess('Success', 'Welcome back!');
          // AuthContext will automatically trigger navigation based on isAuthenticated state
        } catch (error: any) {
          // If verify-phone fails, it means user doesn't exist yet
          throw new Error('Account not found. Please complete registration first.');
        }
      } else {
        // For new users (registration), navigate to Welcome screen to complete registration
        navigation.navigate('Welcome', { phoneNumber, verificationCode });
      }
    } catch (error: any) {
      console.error('Verify code error:', error);

      // Clear the code inputs on error
      setCode(['', '', '', '', '', '']);
      inputRefs[0].current?.focus();

      // Show error message
      const errorMessage = error.message || 'Invalid verification code. Please try again.';
      showError('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);

    try {
      // Request new verification code
      await authService.sendVerificationCode(phoneNumber);

      // Show success message
      showSuccess('Code Sent', 'A new verification code has been sent to your phone');
    } catch (error: any) {
      console.error('Resend code error:', error);
      showError('Error', error.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isCodeComplete = code.every(digit => digit.trim() !== '');

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
            {/* Back Button */}
            <Animated.View
              style={[
                styles.backButtonContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Icon name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
            </Animated.View>

            {/* Icon Section */}
            <Animated.View
              style={[
                styles.iconSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <Icon name="shield-checkmark" size={56} color={theme.primary} />
              </View>
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
              <Text style={[styles.title, { color: theme.text }]}>Verify Your Number</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Enter the 6-digit code sent to
              </Text>
              <Text style={[styles.phoneText, { color: theme.text }]}>{phoneNumber}</Text>
            </Animated.View>

            {/* Code Input Section */}
            <Animated.View
              style={[
                styles.codeSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, 20) }],
                },
              ]}
            >
              <View style={styles.codeInputContainer}>
                {code.map((digit, index) => (
                  <View key={index} style={styles.codeInputWrapper}>
                    <TextInput
                      ref={inputRefs[index]}
                      style={[
                        styles.codeInput,
                        { backgroundColor: theme.surfaceElevated, borderColor: theme.border, color: theme.text },
                        digit && [styles.codeInputFilled, { backgroundColor: theme.surface, color: theme.primary }],
                      ]}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      autoFocus={index === 0}
                      selectTextOnFocus
                    />
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Verify Button */}
            <Animated.View
              style={[
                styles.buttonSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: Animated.add(slideAnim, 30) }],
                },
              ]}
            >
              {isCodeComplete && (
                <TouchableOpacity
                  style={[styles.verifyButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
                  onPress={() => handleVerify(code.join(''))}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <View style={styles.verifyButtonContent}>
                    <Text style={[styles.verifyButtonText, { color: '#FFFFFF' }]}>
                      {loading ? 'Verifying...' : 'Verify Code'}
                    </Text>
                    <Icon name="checkmark-circle" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}
            </Animated.View>

            {/* Resend Section */}
            <Animated.View
              style={[
                styles.resendSection,
                { opacity: fadeAnim },
              ]}
            >
              <Text style={[styles.resendText, { color: theme.textSecondary }]}>Didn't receive the code?</Text>
              <TouchableOpacity
                onPress={handleResend}
                activeOpacity={0.7}
                style={styles.resendButton}
              >
                <Text style={[styles.resendLink, { color: theme.text }]}>Resend Code</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Info Section */}
            <Animated.View
              style={[
                styles.infoSection,
                { opacity: fadeAnim },
              ]}
            >
              <Icon name="time-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>Code expires in 5 minutes</Text>
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
  backButtonContainer: {
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '700',
  },
  codeSection: {
    marginBottom: 30,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  codeInputWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  codeInput: {
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
    paddingVertical: 14,
  },
  codeInputFilled: {
  },
  buttonSection: {
    marginBottom: 24,
  },
  verifyButton: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  verifyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default VerificationScreen;
