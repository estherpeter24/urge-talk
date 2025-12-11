import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/config';
import { NotificationSettings } from '../../types';
import { settingsService } from '../../services/api/settingsService';

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const { showError } = useModal();
  const navigation = useNavigation();

  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    showPreview: true,
    sound: true,
    vibration: true,
    messageNotifications: true,
    groupNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // First try to load from API
      const response = await settingsService.getNotificationSettings();
      if (response.data?.settings) {
        const apiSettings: NotificationSettings = {
          enabled: response.data.settings.enabled,
          showPreview: response.data.settings.show_preview,
          sound: response.data.settings.sound,
          vibration: response.data.settings.vibration,
          messageNotifications: response.data.settings.message_notifications,
          groupNotifications: response.data.settings.group_notifications,
        };
        setSettings(apiSettings);
        // Also save to local storage as cache
        await AsyncStorage.setItem(
          STORAGE_KEYS.NOTIFICATION_SETTINGS,
          JSON.stringify(apiSettings)
        );
      }
    } catch (error) {
      console.error('Error loading notification settings from API:', error);
      // Fallback to local storage if API fails
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (localError) {
        console.error('Error loading from local storage:', localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    setIsSaving(true);
    try {
      // Save to API with snake_case keys
      const apiPayload = {
        enabled: newSettings.enabled,
        show_preview: newSettings.showPreview,
        sound: newSettings.sound,
        vibration: newSettings.vibration,
        message_notifications: newSettings.messageNotifications,
        group_notifications: newSettings.groupNotifications,
      };
      await settingsService.updateNotificationSettings(apiPayload);

      // Also save to local storage as cache
      await AsyncStorage.setItem(
        STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showError('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };

    // If disabling main notifications, disable all sub-settings
    if (key === 'enabled' && !newSettings.enabled) {
      newSettings.showPreview = false;
      newSettings.sound = false;
      newSettings.vibration = false;
      newSettings.messageNotifications = false;
      newSettings.groupNotifications = false;
    }

    saveSettings(newSettings);
  };

  const SettingRow = ({
    icon,
    title,
    description,
    value,
    onToggle,
    disabled = false,
  }: {
    icon: string;
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
    disabled?: boolean;
  }) => (
    <View
      style={[
        styles.settingRow,
        { backgroundColor: theme.surface, opacity: disabled ? 0.5 : 1 },
      ]}
    >
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
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        <View style={styles.placeholder}>
          {isSaving && <ActivityIndicator size="small" color={theme.primary} />}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Toggle */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            GENERAL
          </Text>
          <SettingRow
            icon="notifications"
            title="Enable Notifications"
            description="Receive notifications for messages and updates"
            value={settings.enabled}
            onToggle={() => toggleSetting('enabled')}
          />
        </View>

        {/* Notification Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            NOTIFICATION OPTIONS
          </Text>
          <SettingRow
            icon="eye"
            title="Show Preview"
            description="Display message preview in notifications"
            value={settings.showPreview}
            onToggle={() => toggleSetting('showPreview')}
            disabled={!settings.enabled}
          />
          <SettingRow
            icon="musical-notes"
            title="Sound"
            description="Play sound for notifications"
            value={settings.sound}
            onToggle={() => toggleSetting('sound')}
            disabled={!settings.enabled}
          />
          <SettingRow
            icon="phone-portrait"
            title="Vibration"
            description="Vibrate on new notifications"
            value={settings.vibration}
            onToggle={() => toggleSetting('vibration')}
            disabled={!settings.enabled}
          />
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            NOTIFICATION TYPES
          </Text>
          <SettingRow
            icon="chatbubble"
            title="Message Notifications"
            description="Notifications for direct messages"
            value={settings.messageNotifications}
            onToggle={() => toggleSetting('messageNotifications')}
            disabled={!settings.enabled}
          />
          <SettingRow
            icon="people"
            title="Group Notifications"
            description="Notifications for group messages"
            value={settings.groupNotifications}
            onToggle={() => toggleSetting('groupNotifications')}
            disabled={!settings.enabled}
          />
        </View>

        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}
        >
          <Icon name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Some notification settings may be overridden by your device's system settings.
            Check your device settings if notifications are not working.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

export default NotificationsScreen;
