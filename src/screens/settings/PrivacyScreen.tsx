import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/config';
import { PrivacySettings } from '../../types';

const PrivacyScreen = () => {
  const { theme } = useTheme();
  const { showModal, showConfirm, showSuccess, showError } = useModal();
  const navigation = useNavigation();

  const [settings, setSettings] = useState<PrivacySettings>({
    showOnlineStatus: true,
    showLastSeen: true,
    showProfilePhoto: true,
    showReadReceipts: true,
    blockedUsers: [],
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const saveSettings = async (newSettings: PrivacySettings) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRIVACY_SETTINGS,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      showError('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof Omit<PrivacySettings, 'blockedUsers'>) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const SettingRow = ({
    icon,
    title,
    description,
    value,
    onToggle,
  }: {
    icon: string;
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={[styles.settingRow, { backgroundColor: theme.surface }]}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const handleBlockedUsers = () => {
    const message = settings.blockedUsers.length === 0
      ? 'You haven\'t blocked anyone yet'
      : `You have blocked ${settings.blockedUsers.length} user(s)`;

    showModal({
      type: 'info',
      title: 'Blocked Users',
      message,
      primaryButton: {
        text: 'OK',
        onPress: () => {},
      },
    });
  };

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            WHO CAN SEE MY INFORMATION
          </Text>
          <SettingRow
            icon="eye"
            title="Online Status"
            description="Let others see when you're online"
            value={settings.showOnlineStatus}
            onToggle={() => toggleSetting('showOnlineStatus')}
          />
          <SettingRow
            icon="time"
            title="Last Seen"
            description="Show when you were last active"
            value={settings.showLastSeen}
            onToggle={() => toggleSetting('showLastSeen')}
          />
          <SettingRow
            icon="person-circle"
            title="Profile Photo"
            description="Allow others to see your profile photo"
            value={settings.showProfilePhoto}
            onToggle={() => toggleSetting('showProfilePhoto')}
          />
        </View>

        {/* Message Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            MESSAGE SETTINGS
          </Text>
          <SettingRow
            icon="checkmark-done"
            title="Read Receipts"
            description="Let others know when you've read their messages"
            value={settings.showReadReceipts}
            onToggle={() => toggleSetting('showReadReceipts')}
          />
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SECURITY
          </Text>
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.surface }]}
            onPress={handleBlockedUsers}
            activeOpacity={0.7}
          >
            <View style={styles.settingIcon}>
              <Icon name="ban" size={24} color={theme.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Blocked Users
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Manage blocked contacts
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>
                {settings.blockedUsers.length}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.surface }]}
            onPress={() =>
              showConfirm(
                'Two-Factor Authentication',
                'Enable two-factor authentication to add an extra layer of security to your account.\n\nWhen enabled, you\'ll need to enter a verification code in addition to your password when signing in.',
                () => {
                  showSuccess('Success', 'Two-factor authentication has been enabled');
                }
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.settingIcon}>
              <Icon name="shield-checkmark" size={24} color={theme.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>
                Two-Factor Authentication
              </Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Add extra security to your account
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            DATA & STORAGE
          </Text>
          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.surface }]}
            onPress={() =>
              showConfirm(
                'Clear Cache',
                'Are you sure you want to clear the cache? This will free up storage space.',
                () => {
                  showSuccess('Success', 'Cache cleared successfully');
                }
              )
            }
            activeOpacity={0.7}
          >
            <View style={styles.settingIcon}>
              <Icon name="trash" size={24} color={theme.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Clear Cache</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                Free up storage space
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}
        >
          <Icon name="lock-closed" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Your privacy is important. These settings help you control who can see your
            information and how your data is used.
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 2,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    marginHorizontal: 24,
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

export default PrivacyScreen;
