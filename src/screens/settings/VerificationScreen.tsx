import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { accountService } from '../../services/api';

const VerificationScreen = () => {
  const { theme } = useTheme();
  const { showSuccess, showError, showConfirm } = useModal();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<string>('none');
  const [step, setStep] = useState<'intro' | 'form' | 'submitted'>('intro');
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    reason: '',
    socialProof: '',
  });

  // Reload status every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkVerificationStatus();
    }, [])
  );

  const checkVerificationStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await accountService.getVerificationStatus();
      if (response.success && response.data) {
        setVerificationStatus(response.data.verification_status);
        if (response.data.verification_status === 'pending') {
          setStep('submitted');
        }
      }
    } catch (error) {
      console.error('Failed to check verification status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!formData.fullName.trim()) {
      showError('Error', 'Please enter your full name');
      return;
    }
    if (!formData.reason.trim()) {
      showError('Error', 'Please tell us why you want to be verified');
      return;
    }

    showConfirm(
      'Submit Verification Request',
      'Are you sure you want to submit your verification request? Our team will review it within 24-48 hours.',
      async () => {
        setLoading(true);
        try {
          const response = await accountService.requestVerification({
            full_name: formData.fullName.trim(),
            reason: formData.reason.trim(),
            social_proof: formData.socialProof.trim() || undefined,
          });

          if (response.success) {
            setStep('submitted');
            setVerificationStatus('pending');
            showSuccess('Request Submitted', 'Your verification request has been submitted successfully!');
          } else {
            showError('Error', response.message || 'Failed to submit verification request');
          }
        } catch (error: any) {
          showError('Error', error.message || 'Failed to submit verification request');
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const benefits = [
    {
      icon: 'checkmark-circle',
      title: 'Verified Badge',
      description: 'Get a verified badge on your profile',
    },
    {
      icon: 'shield-checkmark',
      title: 'Trust & Credibility',
      description: 'Build trust with other community members',
    },
    {
      icon: 'star',
      title: 'Priority Features',
      description: 'Early access to new features',
    },
    {
      icon: 'people',
      title: 'Community Recognition',
      description: 'Stand out in the URGE community',
    },
  ];

  const requirements = [
    'Must have an active account for at least 7 days',
    'Profile must be complete with photo and bio',
    'Must follow community guidelines',
    'Valid social media presence (optional but recommended)',
  ];

  if (user?.isVerified) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>URGE Verified</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.verifiedContainer}>
          <View style={[styles.verifiedBadge, { backgroundColor: '#4CAF50' }]}>
            <Icon name="checkmark-circle" size={64} color="#FFFFFF" />
          </View>
          <Text style={[styles.verifiedTitle, { color: theme.text }]}>
            You're Verified!
          </Text>
          <Text style={[styles.verifiedSubtitle, { color: theme.textSecondary }]}>
            Your account has been verified. The verified badge is displayed on your profile.
          </Text>

          <View
            style={[
              styles.infoBox,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
          >
            <Icon name="shield-checkmark" size={24} color="#4CAF50" />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>
                Verification Benefits Active
              </Text>
              <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
                You have access to all verified member benefits including priority support and early feature access.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'submitted') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>URGE Verified</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.submittedContainer}>
          <View style={[styles.submittedIcon, { backgroundColor: theme.primary + '20' }]}>
            <Icon name="hourglass" size={48} color={theme.primary} />
          </View>
          <Text style={[styles.submittedTitle, { color: theme.text }]}>
            Request Submitted
          </Text>
          <Text style={[styles.submittedSubtitle, { color: theme.textSecondary }]}>
            Your verification request has been submitted. Our team will review it within 24-48 hours. You'll receive a notification once a decision is made.
          </Text>

          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'form') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('intro')}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Request Verification</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: theme.text }]}>Full Name *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={theme.textSecondary}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: theme.text }]}>
              Why do you want to be verified? *
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Tell us about yourself and why you'd like to be verified..."
              placeholderTextColor={theme.textSecondary}
              value={formData.reason}
              onChangeText={(text) => setFormData({ ...formData, reason: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { color: theme.text }]}>
              Social Media Links (Optional)
            </Text>
            <Text style={[styles.formHint, { color: theme.textSecondary }]}>
              Providing social media links helps us verify your identity faster
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Instagram, Twitter, LinkedIn URLs..."
              placeholderTextColor={theme.textSecondary}
              value={formData.socialProof}
              onChangeText={(text) => setFormData({ ...formData, socialProof: text })}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSubmitVerification}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Icon name="send" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Get URGE Verified</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <View style={[styles.badgeContainer, { backgroundColor: theme.primary + '20' }]}>
            <Icon name="checkmark-circle" size={64} color={theme.primary} />
          </View>
          <Text style={[styles.introTitle, { color: theme.text }]}>
            Get Verified on URGE
          </Text>
          <Text style={[styles.introSubtitle, { color: theme.textSecondary }]}>
            Join our verified community members and unlock exclusive benefits
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Benefits</Text>
          {benefits.map((benefit, index) => (
            <View
              key={index}
              style={[styles.benefitRow, { backgroundColor: theme.surface }]}
            >
              <View style={[styles.benefitIcon, { backgroundColor: theme.primary + '20' }]}>
                <Icon name={benefit.icon} size={24} color={theme.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={[styles.benefitTitle, { color: theme.text }]}>
                  {benefit.title}
                </Text>
                <Text style={[styles.benefitDescription, { color: theme.textSecondary }]}>
                  {benefit.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Requirements</Text>
          <View style={[styles.requirementsBox, { backgroundColor: theme.surface }]}>
            {requirements.map((requirement, index) => (
              <View key={index} style={styles.requirementRow}>
                <Icon name="ellipse" size={6} color={theme.textSecondary} />
                <Text style={[styles.requirementText, { color: theme.text }]}>
                  {requirement}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.requestButton, { backgroundColor: theme.primary }]}
          onPress={() => setStep('form')}
        >
          <Icon name="shield-checkmark" size={24} color="#FFFFFF" />
          <Text style={styles.requestButtonText}>Request Verification</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
  },
  requirementsBox: {
    padding: 16,
    borderRadius: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  requirementText: {
    fontSize: 14,
    flex: 1,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Form styles
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  // Verified styles
  verifiedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  verifiedBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifiedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  verifiedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    width: '100%',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Submitted styles
  submittedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  submittedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  submittedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  submittedSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  doneButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default VerificationScreen;
