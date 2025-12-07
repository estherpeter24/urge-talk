import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const TermsPrivacyScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  const termsContent = [
    {
      title: '1. Acceptance of Terms',
      content:
        'By accessing and using URGE, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use this application.',
    },
    {
      title: '2. Use License',
      content:
        'Permission is granted to temporarily use URGE for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose or for any public display; attempt to reverse engineer any software contained in URGE; remove any copyright or other proprietary notations from the materials.',
    },
    {
      title: '3. User Account',
      content:
        'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. URGE reserves the right to refuse service, terminate accounts, or remove content at our sole discretion.',
    },
    {
      title: '4. User Conduct',
      content:
        'You agree not to use URGE to: harass, abuse, threaten, or intimidate other users; post or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable; impersonate any person or entity; violate any local, state, national, or international law.',
    },
    {
      title: '5. Content',
      content:
        'You retain all rights to any content you submit, post or display on or through URGE. By submitting, posting or displaying content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish and distribute such content.',
    },
    {
      title: '6. Termination',
      content:
        'We may terminate or suspend your account and bar access to URGE immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.',
    },
    {
      title: '7. Disclaimer',
      content:
        'URGE is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, and hereby disclaim all warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.',
    },
  ];

  const privacyContent = [
    {
      title: '1. Information We Collect',
      content:
        'We collect information you provide directly to us, including your name, phone number, email address, profile information, and messages. We also collect usage data such as app interactions, device information, and location data (with your permission).',
    },
    {
      title: '2. How We Use Your Information',
      content:
        'We use your information to: provide, maintain, and improve our services; send you technical notices and support messages; respond to your comments and questions; communicate about products, services, and events; monitor and analyze trends and usage; detect, prevent, and address security issues.',
    },
    {
      title: '3. Information Sharing',
      content:
        'We do not share your personal information with third parties except: with your consent; to comply with laws or respond to legal requests; to protect the rights and safety of URGE and our users; with service providers who perform services on our behalf; in connection with a merger, sale, or asset transfer.',
    },
    {
      title: '4. End-to-End Encryption',
      content:
        'All messages sent through URGE are end-to-end encrypted. This means only you and the person you\'re communicating with can read what is sent. Nobody in between, not even URGE, can access your messages.',
    },
    {
      title: '5. Data Storage and Security',
      content:
        'We implement industry-standard security measures to protect your information. Your data is encrypted both in transit and at rest. We regularly review and update our security practices to protect against unauthorized access.',
    },
    {
      title: '6. Your Rights',
      content:
        'You have the right to: access the personal information we hold about you; request correction of inaccurate information; request deletion of your information; object to processing of your information; withdraw consent at any time; export your data in a portable format.',
    },
    {
      title: '7. Data Retention',
      content:
        'We retain your information for as long as your account is active or as needed to provide services. You can delete your account at any time, and we will delete your information within 30 days, except where we must retain it for legal purposes.',
    },
    {
      title: '8. Children\'s Privacy',
      content:
        'URGE is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we will delete it immediately.',
    },
  ];

  const content = activeTab === 'terms' ? termsContent : privacyContent;

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Legal</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: theme.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'terms' && { borderBottomColor: theme.primary },
          ]}
          onPress={() => setActiveTab('terms')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'terms' ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === 'terms' ? '700' : '500',
              },
            ]}
          >
            Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'privacy' && { borderBottomColor: theme.primary },
          ]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'privacy' ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === 'privacy' ? '700' : '500',
              },
            ]}
          >
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <View style={styles.updateInfo}>
          <Icon name="time-outline" size={16} color={theme.textTertiary} />
          <Text style={[styles.updateText, { color: theme.textTertiary }]}>
            Last updated: January 15, 2025
          </Text>
        </View>

        {/* Content Sections */}
        {content.map((section, index) => (
          <View
            key={index}
            style={[styles.section, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: theme.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}

        {/* Contact Info */}
        <View
          style={[
            styles.contactBox,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}
        >
          <Icon name="mail" size={20} color={theme.primary} />
          <View style={styles.contactText}>
            <Text style={[styles.contactTitle, { color: theme.text }]}>
              Questions or concerns?
            </Text>
            <Text style={[styles.contactDetail, { color: theme.textSecondary }]}>
              Contact us at legal@urge.chat
            </Text>
          </View>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  updateText: {
    fontSize: 13,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 13,
  },
});

export default TermsPrivacyScreen;
