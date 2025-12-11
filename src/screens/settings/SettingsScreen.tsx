import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { Theme } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types';
import { APP_CONFIG } from '../../constants/config';

type SettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsMain'>;

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  badgeColor?: string;
}

const SettingsScreen = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { showSuccess, showError, showConfirm } = useModal();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const handleLogout = () => {
    showConfirm(
      'Logout',
      'Are you sure you want to logout?',
      () => {
        logout();
      },
      () => {
        // Cancel - do nothing
      }
    );
  };

  // Handle Subscriptions
  const handleSubscriptions = () => {
    navigation.navigate('Subscriptions');
  };

  // Handle Get Verified
  const handleGetVerified = () => {
    if (user?.isVerified) {
      showSuccess('Already Verified', 'Your account is already URGE verified!');
    } else {
      navigation.navigate('Verification');
    }
  };

  // Handle Social Media Links
  const handleSocialMedia = () => {
    navigation.navigate('SocialMedia');
  };

  // Handle Help & Support - Opens email
  const handleHelpSupport = async () => {
    const email = APP_CONFIG.SUPPORT_EMAIL || 'support@urge.app';
    const subject = encodeURIComponent('URGE App Support Request');
    const body = encodeURIComponent(`
Hi URGE Support Team,

I need help with:

---
User ID: ${user?.id || 'N/A'}
Phone: ${user?.phoneNumber || 'N/A'}
App Version: ${APP_CONFIG.VERSION}
Platform: ${Platform.OS}
`);

    const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        // Show alternative contact options
        Alert.alert(
          'Contact Support',
          `Email us at: ${email}`,
          [
            { text: 'Copy Email', onPress: () => copyToClipboard(email) },
            { text: 'OK' },
          ]
        );
      }
    } catch (error) {
      showError('Error', 'Could not open email client');
    }
  };

  // Handle Invite Friends - Share app link
  const handleInviteFriends = async () => {
    try {
      const appStoreLink = Platform.select({
        ios: 'https://apps.apple.com/app/urge-app/id123456789',
        android: 'https://play.google.com/store/apps/details?id=com.urge.app',
      });

      const message = `Hey! Join me on URGE - the best messaging app for our community. Download it here: ${appStoreLink}`;

      const result = await Share.share({
        message,
        title: 'Invite to URGE',
      });

      if (result.action === Share.sharedAction) {
        showSuccess('Thanks!', 'Thanks for sharing URGE with your friends!');
      }
    } catch (error) {
      showError('Error', 'Could not share the app');
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text: string) => {
    try {
      const Clipboard = require('react-native').Clipboard;
      if (Clipboard) {
        Clipboard.setString(text);
        showSuccess('Copied', 'Email address copied to clipboard');
      }
    } catch (error) {
      // Clipboard not available
    }
  };

  const handleRateApp = () => {
    const iosAppId = 'YOUR_IOS_APP_ID';
    const androidPackage = 'com.urge.app';

    const storeUrl = Platform.select({
      ios: `https://apps.apple.com/app/id${iosAppId}?action=write-review`,
      android: `market://details?id=${androidPackage}`,
    });

    if (storeUrl) {
      Linking.canOpenURL(storeUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(storeUrl);
            showSuccess('Thank You!', 'Your feedback helps us improve URGE');
          } else {
            const webUrl = Platform.select({
              ios: `https://apps.apple.com/app/id${iosAppId}`,
              android: `https://play.google.com/store/apps/details?id=${androidPackage}`,
            });
            if (webUrl) {
              Linking.openURL(webUrl);
            }
          }
        })
        .catch(() => {
          showError('Error', 'Could not open app store');
        });
    }
  };

  const SettingsItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    showBadge = false,
    badgeText,
    badgeColor,
  }: SettingsItemProps) => (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
        <Icon name={icon} size={Theme.iconSize.md} color={theme.primary} />
      </View>
      <View style={styles.settingsContent}>
        <Text style={[styles.settingsText, { color: theme.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingsSubtext, { color: theme.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {showBadge && badgeText && (
        <View style={[styles.badge, { backgroundColor: badgeColor || theme.primary }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      )}
      {showArrow && (
        <Icon name="chevron-forward" size={Theme.iconSize.sm} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Account Settings</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Manage your account and preferences
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account</Text>

          <SettingsItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => {
              const parentNav = navigation.getParent();
              if (parentNav) {
                parentNav.navigate('Profile', { screen: 'EditProfile' });
              }
            }}
          />

          <SettingsItem
            icon="card-outline"
            title="Subscriptions"
            subtitle="View and manage your subscriptions"
            onPress={handleSubscriptions}
          />

          <SettingsItem
            icon="checkmark-circle-outline"
            title="Get URGE Verified"
            subtitle={user?.isVerified ? 'Your account is verified' : 'Verify your account'}
            onPress={handleGetVerified}
            showBadge={user?.isVerified}
            badgeText="Verified"
            badgeColor="#4CAF50"
          />

          <SettingsItem
            icon="share-social-outline"
            title="Social Media Accounts"
            subtitle="Connect your social profiles"
            onPress={handleSocialMedia}
          />
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Privacy & Security</Text>

          <SettingsItem
            icon="lock-closed-outline"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => navigation.navigate('Privacy')}
          />

          <SettingsItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Configure notification preferences"
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Preferences</Text>

          <TouchableOpacity
            style={[styles.settingsItem, { backgroundColor: theme.surface }]}
            onPress={toggleTheme}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Icon name={isDark ? 'moon' : 'sunny-outline'} size={Theme.iconSize.md} color={theme.primary} />
            </View>
            <View style={styles.settingsContent}>
              <Text style={[styles.settingsText, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.settingsSubtext, { color: theme.textSecondary }]}>
                {isDark ? 'Currently enabled' : 'Currently disabled'}
              </Text>
            </View>
            <View style={[styles.toggleIndicator, { backgroundColor: isDark ? theme.primary : theme.border }]}>
              <View style={[
                styles.toggleDot,
                { backgroundColor: '#FFFFFF', transform: [{ translateX: isDark ? 12 : 0 }] }
              ]} />
            </View>
          </TouchableOpacity>

          <SettingsItem
            icon="language-outline"
            title="Language"
            subtitle="English (US)"
            onPress={() => navigation.navigate('Language')}
          />
        </View>

        {/* Support & Share Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Support & Share</Text>

          <SettingsItem
            icon="mail-outline"
            title="Help & Support"
            subtitle="Contact us via email"
            onPress={handleHelpSupport}
          />

          <SettingsItem
            icon="people-outline"
            title="Invite Friends"
            subtitle="Share URGE with friends"
            onPress={handleInviteFriends}
          />

          <SettingsItem
            icon="star-outline"
            title="Rate App"
            subtitle="Rate us on the App Store"
            onPress={handleRateApp}
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>About</Text>

          <SettingsItem
            icon="document-text-outline"
            title="Terms & Privacy Policy"
            subtitle="Read our terms and conditions"
            onPress={() => navigation.navigate('TermsPrivacy')}
          />

          <SettingsItem
            icon="information-circle-outline"
            title="About URGE"
            subtitle={`Version ${APP_CONFIG.VERSION}`}
            onPress={() => {
              Alert.alert(
                'About URGE',
                `${APP_CONFIG.APP_NAME}\nVersion ${APP_CONFIG.VERSION}\n\nA secure messaging app for the URGE community.`,
                [{ text: 'OK' }]
              );
            }}
            showArrow={false}
          />
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: theme.error }]}
            onPress={handleLogout}
          >
            <Icon name="log-out-outline" size={Theme.iconSize.md} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: theme.textSecondary }]}>
          {APP_CONFIG.APP_NAME} v{APP_CONFIG.VERSION}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Theme.spacing.xxl + 20,
    paddingBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: Theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.xs,
    fontWeight: '600',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContent: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  settingsText: {
    fontSize: Theme.fontSize.md,
    fontWeight: '500',
  },
  settingsSubtext: {
    fontSize: Theme.fontSize.sm,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
    marginRight: Theme.spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.xs,
    fontWeight: '600',
  },
  toggleIndicator: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
  },
  toggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    marginLeft: Theme.spacing.sm,
  },
  version: {
    textAlign: 'center',
    padding: Theme.spacing.lg,
    fontSize: Theme.fontSize.sm,
  },
});

export default SettingsScreen;
