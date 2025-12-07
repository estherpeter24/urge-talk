import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useNavigation } from '@react-navigation/native';

const HelpSupportScreen = () => {
  const { theme } = useTheme();
  const { showSuccess, showError } = useModal();
  const navigation = useNavigation();

  const handleEmail = () => {
    const email = 'support@urge.chat';
    Linking.openURL(`mailto:${email}`)
      .then(() => {
        showSuccess('Email App Opened', `Opening email to ${email}`);
      })
      .catch(() => {
        showError('Error', 'Could not open email app');
      });
  };

  const handleWebsite = () => {
    const url = 'https://www.urge.chat/help';
    Linking.openURL(url)
      .then(() => {
        showSuccess('Opening Website', 'Redirecting to help center');
      })
      .catch(() => {
        showError('Error', 'Could not open website');
      });
  };

  const handlePhone = () => {
    const phone = '+1-800-URGE-HELP';
    Linking.openURL(`tel:${phone}`)
      .catch(() => {
        showError('Error', 'Could not initiate phone call');
      });
  };

  const faqItems = [
    {
      question: 'How do I reset my password?',
      answer: 'Go to Login screen, tap "Forgot Password", enter your phone number, and follow the instructions sent to you.',
    },
    {
      question: 'How do I change my profile picture?',
      answer: 'Navigate to Profile > Edit Profile > Tap on your profile picture > Choose from camera or gallery.',
    },
    {
      question: 'How do I enable notifications?',
      answer: 'Go to Settings > Notifications and toggle on the notifications you want to receive.',
    },
    {
      question: 'How do I block a user?',
      answer: 'Open the chat with the user > Tap the menu icon > Select "Block User".',
    },
    {
      question: 'Is my data encrypted?',
      answer: 'Yes! All messages are end-to-end encrypted. Your privacy and security are our top priorities.',
    },
    {
      question: 'How do I delete my account?',
      answer: 'Contact our support team at support@urge.chat to request account deletion.',
    },
  ];

  const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
    <View style={[styles.faqItem, { backgroundColor: theme.surface }]}>
      <View style={styles.faqHeader}>
        <Icon name="help-circle" size={20} color={theme.primary} />
        <Text style={[styles.faqQuestion, { color: theme.text }]}>{question}</Text>
      </View>
      <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{answer}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            CONTACT US
          </Text>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: theme.surface }]}
            onPress={handleEmail}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
              <Icon name="mail" size={24} color={theme.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: theme.text }]}>Email Support</Text>
              <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>
                support@urge.chat
              </Text>
              <Text style={[styles.contactSubtext, { color: theme.textTertiary }]}>
                We typically respond within 24 hours
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: theme.surface }]}
            onPress={handleWebsite}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.info + '15' }]}>
              <Icon name="globe" size={24} color={theme.info} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: theme.text }]}>Help Center</Text>
              <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>
                www.urge.chat/help
              </Text>
              <Text style={[styles.contactSubtext, { color: theme.textTertiary }]}>
                Browse articles and guides
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: theme.surface }]}
            onPress={handlePhone}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.success + '15' }]}>
              <Icon name="call" size={24} color={theme.success} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: theme.text }]}>Phone Support</Text>
              <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>
                +1-800-URGE-HELP
              </Text>
              <Text style={[styles.contactSubtext, { color: theme.textTertiary }]}>
                Mon-Fri, 9 AM - 6 PM EST
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            FREQUENTLY ASKED QUESTIONS
          </Text>
          {faqItems.map((item, index) => (
            <FAQItem key={index} question={item.question} answer={item.answer} />
          ))}
        </View>

        {/* Quick Tips */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            QUICK TIPS
          </Text>
          <View
            style={[
              styles.tipsBox,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
          >
            <View style={styles.tipItem}>
              <Icon name="flash" size={18} color={theme.warning} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Use the search function to quickly find conversations
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="flash" size={18} color={theme.warning} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Long press on a message to see more options
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="flash" size={18} color={theme.warning} />
              <Text style={[styles.tipText, { color: theme.text }]}>
                Swipe left on a chat to quickly archive or delete
              </Text>
            </View>
          </View>
        </View>

        {/* App Info */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}
        >
          <Icon name="shield-checkmark" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Your feedback helps us improve. Don't hesitate to reach out with suggestions or
            report issues!
          </Text>
        </View>
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
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 24,
    letterSpacing: 1,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  contactSubtext: {
    fontSize: 12,
  },
  faqItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 30,
  },
  tipsBox: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default HelpSupportScreen;
