import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../types';
import { Theme } from '../../constants/theme';
import { authService } from '../../services/api/authService';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { theme } = useTheme();
  const { showSuccess, showError } = useModal();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(phoneNumber);
      showSuccess(
        'Success',
        'Password reset instructions sent to your phone',
        () => navigation.navigate('Login')
      );
    } catch (error: any) {
      showError('Error', error.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.primary }]}>Forgot Password</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your phone number to receive password reset instructions
        </Text>

        <Input
          label="Phone Number"
          placeholder="+234 XXX XXX XXXX"
          value={phoneNumber}
          onChangeText={(text) => {
            setPhoneNumber(text);
            setError('');
          }}
          keyboardType="phone-pad"
          leftIcon="call-outline"
          error={error}
          autoCapitalize="none"
          containerStyle={styles.input}
        />

        <Button
          title="Send Reset Code"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          style={styles.submitButton}
        />

        <Button
          title="Back to Login"
          onPress={() => navigation.navigate('Login')}
          variant="text"
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: Theme.fontSize.xxxl * 1.2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  input: {
    marginBottom: Theme.spacing.lg,
  },
  submitButton: {
    marginBottom: Theme.spacing.md,
  },
});

export default ForgotPasswordScreen;
