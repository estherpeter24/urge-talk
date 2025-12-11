import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { AuthStackParamList } from '../../types';
import { authService } from '../../services/api/authService';
import { validatePhoneNumber, getPhoneValidationError } from '../../utils/validators';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

type Step = 'phone' | 'code' | 'password';

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { theme } = useTheme();
  const { showSuccess, showError } = useModal();

  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  const handleSendCode = async () => {
    const phoneError = getPhoneValidationError(phoneNumber);
    if (phoneError) {
      showError('Error', phoneError);
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword(phoneNumber);
      if (response.success) {
        showSuccess('Success', 'Verification code sent to your phone');
        setStep('code');
      } else {
        showError('Error', response.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleCodeKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const fullCode = code || verificationCode.join('');
    if (fullCode.length !== 6) {
      showError('Error', 'Please enter the complete verification code');
      return;
    }

    setLoading(true);
    try {
      // Verify the code with the backend
      const response = await authService.verifyResetCode(phoneNumber, fullCode);
      if (response.success) {
        setStep('password');
      } else {
        showError('Error', response.message || 'Invalid verification code');
        setVerificationCode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      showError('Error', error.message || 'Invalid verification code');
      setVerificationCode(['', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      showError('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      showError('Error', 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const fullCode = verificationCode.join('');
      const response = await authService.resetPassword(phoneNumber, fullCode, newPassword);
      if (response.success) {
        showSuccess('Success', 'Password reset successfully! Please login with your new password.', () => {
          navigation.navigate('Login');
        });
      } else {
        showError('Error', response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword(phoneNumber);
      if (response.success) {
        showSuccess('Success', 'Verification code resent');
        setVerificationCode(['', '', '', '', '', '']);
        codeInputRefs.current[0]?.focus();
      } else {
        showError('Error', response.message || 'Failed to resend code');
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="lock-closed" size={48} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Enter your phone number and we'll send you a verification code
      </Text>

      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="call-outline" size={20} color={theme.primary} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Enter phone number"
          placeholderTextColor={theme.textTertiary}
          keyboardType="phone-pad"
          maxLength={15}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
        onPress={handleSendCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Send Verification Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={[styles.backButtonText, { color: theme.primary }]}>Back to Login</Text>
      </TouchableOpacity>
    </>
  );

  const renderCodeStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="keypad" size={48} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Verify Code</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Enter the 6-digit code sent to {phoneNumber}
      </Text>

      <View style={styles.codeContainer}>
        {verificationCode.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { codeInputRefs.current[index] = ref; }}
            style={[
              styles.codeInput,
              {
                backgroundColor: theme.surface,
                borderColor: digit ? theme.primary : theme.border,
                color: theme.text,
              },
            ]}
            value={digit}
            onChangeText={(value) => handleCodeChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleCodeKeyPress(nativeEvent.key, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
        onPress={() => handleVerifyCode()}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendCode}
        disabled={loading}
      >
        <Text style={[styles.resendText, { color: theme.textSecondary }]}>
          Didn't receive code? <Text style={{ color: theme.primary }}>Resend</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('phone')}
      >
        <Text style={[styles.backButtonText, { color: theme.primary }]}>Change Phone Number</Text>
      </TouchableOpacity>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Icon name="key" size={48} color={theme.primary} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>New Password</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Create a new password for your account
      </Text>

      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="lock-closed-outline" size={20} color={theme.primary} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password (min 8 chars)"
          placeholderTextColor={theme.textTertiary}
          secureTextEntry
        />
      </View>

      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="lock-closed-outline" size={20} color={theme.primary} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
          placeholderTextColor={theme.textTertiary}
          secureTextEntry
        />
      </View>

      {newPassword && confirmPassword && newPassword !== confirmPassword && (
        <Text style={[styles.errorText, { color: theme.error }]}>Passwords do not match</Text>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading || newPassword !== confirmPassword}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'phone' && renderPhoneStep()}
          {step === 'code' && renderCodeStep()}
          {step === 'password' && renderPasswordStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ForgotPasswordScreen;
