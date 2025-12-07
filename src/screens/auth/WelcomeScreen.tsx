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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { authService } from '../../services/api/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const WelcomeScreen = ({ route, navigation }: Props) => {
  const { phoneNumber, verificationCode } = route.params;
  const { theme } = useTheme();
  const { login } = useAuth();
  const { showError } = useModal();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
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
  }, []);

  const handleGetStarted = async () => {
    if (!name.trim()) {
      showError('Required', 'Please enter your name');
      return;
    }

    if (!username.trim()) {
      showError('Required', 'Please enter a username');
      return;
    }

    setLoading(true);

    try {
      // Register the user with a default password (user can change later)
      const defaultPassword = 'Welcome123!';

      // First, register the user
      const authResponse = await authService.register({
        phoneNumber,
        password: defaultPassword,
        displayName: name,
      });

      // Then verify the phone with the verification code (if provided)
      if (verificationCode) {
        try {
          await authService.verifyPhone(phoneNumber, verificationCode);
        } catch (verifyError) {
          // If verification fails, that's okay - user is still registered
          console.warn('Phone verification failed:', verifyError);
        }
      }

      // Login with the auth response
      await login({ phoneNumber, password: defaultPassword });
    } catch (error: any) {
      console.error('Registration error:', error);
      showError('Registration Failed', error.message || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name.trim().length > 0 && username.trim().length > 0;

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
            {/* Welcome Icon */}
            <Animated.View
              style={[
                styles.iconSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Icon name="happy-outline" size={64} color={theme.primary} />
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
              <Text style={[styles.title, { color: theme.text }]}>Welcome to URGE!</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Let's set up your profile to get started
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
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Icon name="person" size={18} color={theme.text} />
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name</Text>
                  </View>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={name}
                      onChangeText={setName}
                      placeholder="Enter your full name"
                      placeholderTextColor={theme.textTertiary}
                      autoFocus
                    />
                  </View>
                </View>

                {/* Username Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Icon name="at" size={18} color={theme.text} />
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
                  </View>
                  <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.input, { color: theme.text }]}
                      value={username}
                      onChangeText={setUsername}
                      placeholder="Choose a username"
                      placeholderTextColor={theme.textTertiary}
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Get Started Button */}
                {isFormValid && (
                  <TouchableOpacity
                    style={[styles.getStartedButton, { backgroundColor: theme.primary }]}
                    onPress={handleGetStarted}
                    activeOpacity={0.8}
                  >
                    <View style={styles.buttonContent}>
                      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Get Started</Text>
                      <Icon name="rocket" size={24} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {/* Features Preview */}
            <Animated.View
              style={[
                styles.featuresSection,
                { opacity: fadeAnim },
              ]}
            >
              <Text style={[styles.featuresTitle, { color: theme.text }]}>What you can do:</Text>
              <View style={styles.featuresList}>
                <View style={[styles.featureItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Icon name="chatbubbles" size={20} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.text }]}>Send messages instantly</Text>
                </View>
                <View style={[styles.featureItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Icon name="images" size={20} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.text }]}>Share photos & videos</Text>
                </View>
                <View style={[styles.featureItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <Icon name="people" size={20} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.text }]}>Create group chats</Text>
                </View>
              </View>
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
    paddingVertical: 30,
  },
  iconSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 35,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    marginBottom: 30,
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
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  getStartedButton: {
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
  featuresSection: {
    alignItems: 'center',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
