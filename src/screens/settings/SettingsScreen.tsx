import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { Theme } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types';

type SettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsMain'>;

const SettingsScreen = () => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { showSuccess, showError } = useModal();
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  const handleRateApp = () => {
    // App Store / Play Store URLs
    const iosAppId = 'YOUR_IOS_APP_ID'; // Replace with actual App Store ID
    const androidPackage = 'com.urge.app'; // Replace with actual package name

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
            // Fallback to web version
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

  const SettingsItem = ({ icon, title, onPress, showArrow = true }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <Icon name={icon} size={Theme.iconSize.md} color={theme.primary} />
      <Text style={[styles.settingsText, { color: theme.text }]}>{title}</Text>
      {showArrow && (
        <Icon name="chevron-forward" size={Theme.iconSize.sm} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Account</Text>
        <SettingsItem
          icon="person-outline"
          title="Edit Profile"
          onPress={() => {
            const parentNav = navigation.getParent();
            if (parentNav) {
              parentNav.navigate('Profile', { screen: 'EditProfile' });
            }
          }}
        />
        <SettingsItem icon="lock-closed-outline" title="Privacy & Security" onPress={() => navigation.navigate('Privacy')} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Preferences</Text>
        <TouchableOpacity
          style={[styles.settingsItem, { backgroundColor: theme.surface }]}
          onPress={toggleTheme}
        >
          <Icon name="moon-outline" size={Theme.iconSize.md} color={theme.primary} />
          <Text style={[styles.settingsText, { color: theme.text }]}>
            Dark Mode: {isDark ? 'On' : 'Off'}
          </Text>
        </TouchableOpacity>
        <SettingsItem icon="notifications-outline" title="Notifications" onPress={() => navigation.navigate('Notifications')} />
        <SettingsItem icon="language-outline" title="Language" onPress={() => navigation.navigate('Language')} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>About</Text>
        <SettingsItem icon="information-circle-outline" title="Help & Support" onPress={() => navigation.navigate('HelpSupport')} />
        <SettingsItem icon="document-text-outline" title="Terms & Privacy" onPress={() => navigation.navigate('TermsPrivacy')} />
        <SettingsItem icon="heart-outline" title="Rate App" onPress={handleRateApp} />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: theme.error }]}
          onPress={logout}
        >
          <Icon name="log-out-outline" size={Theme.iconSize.md} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

        <Text style={[styles.version, { color: theme.textSecondary }]}>Version 1.0.0</Text>
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
    paddingBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: '600',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
    textTransform: 'uppercase',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  settingsText: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    marginLeft: Theme.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
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
