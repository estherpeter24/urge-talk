import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  FlatList,
  Image,
  TextInput,
  Modal,
  Clipboard,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../constants/config';
import { PrivacySettings } from '../../types';
import { settingsService } from '../../services/api';

interface BlockedUserInfo {
  id: string;
  displayName: string;
  phoneNumber?: string;
  avatar?: string;
}

type TwoFAStep = 'status' | 'setup' | 'verify' | 'backup_codes' | 'disable' | 'regenerate';

const PrivacyScreen = () => {
  const { theme } = useTheme();
  const { showModal, showConfirm, showSuccess, showError } = useModal();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [blockedUsersLoading, setBlockedUsersLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserInfo[]>([]);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    showOnlineStatus: true,
    showLastSeen: true,
    showProfilePhoto: true,
    showReadReceipts: true,
    blockedUsers: [],
  });

  // 2FA State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>('status');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFALoading, setTwoFALoading] = useState(false);

  // Clear Cache State
  const [clearingCache, setClearingCache] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      // Load privacy settings from backend
      const privacyResponse = await settingsService.getPrivacySettings();
      if (privacyResponse.success && privacyResponse.data) {
        const backendSettings = {
          showOnlineStatus: privacyResponse.data.showOnlineStatus,
          showLastSeen: privacyResponse.data.showLastSeen,
          showProfilePhoto: privacyResponse.data.showProfilePhoto,
          showReadReceipts: privacyResponse.data.showReadReceipts,
          blockedUsers: settings.blockedUsers,
        };
        setSettings(backendSettings);
        await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(backendSettings));
      } else {
        // Fallback to local settings if backend fails
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      }

      // Load blocked users from backend
      await loadBlockedUsers();

      // Load 2FA status
      await load2FAStatus();
    } catch (error) {
      console.error('Error loading privacy data:', error);
      // Fallback to local settings on error
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_SETTINGS);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  };

  const load2FAStatus = async () => {
    try {
      const response = await settingsService.get2FAStatus();
      if (response.success && response.data) {
        setTwoFAEnabled(response.data.enabled);
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const response = await settingsService.getBlockedUsers();
      if (response.success && response.data) {
        const blockedUsersData = response.data.blocked_users || [];

        if (blockedUsersData.length === 0) {
          setBlockedUsers([]);
          const newSettings = { ...settings, blockedUsers: [] };
          await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(newSettings));
          setSettings(newSettings);
          return;
        }

        // Map the response to our local interface
        const userDetails: BlockedUserInfo[] = blockedUsersData.map((user: any) => ({
          id: user.id,
          displayName: user.display_name || 'Unknown User',
          phoneNumber: user.phone_number,
          avatar: user.avatar_url,
        }));

        setBlockedUsers(userDetails);
        // Update local settings with blocked user IDs
        const blockedIds = blockedUsersData.map((u: any) => u.id);
        const newSettings = { ...settings, blockedUsers: blockedIds };
        await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(newSettings));
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const saveSettings = async (newSettings: PrivacySettings) => {
    try {
      // Save to local storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRIVACY_SETTINGS,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);

      // Sync with backend
      await settingsService.updatePrivacySettings({
        showOnlineStatus: newSettings.showOnlineStatus,
        showLastSeen: newSettings.showLastSeen,
        showProfilePhoto: newSettings.showProfilePhoto,
        showReadReceipts: newSettings.showReadReceipts,
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      showError('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof Omit<PrivacySettings, 'blockedUsers'>) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleUnblockUser = async (userId: string, userName: string) => {
    showConfirm(
      'Unblock User',
      `Are you sure you want to unblock ${userName}?`,
      async () => {
        setBlockedUsersLoading(true);
        try {
          const response = await settingsService.unblockUser(userId);
          if (response.success) {
            // Remove user from local state
            setBlockedUsers(prev => prev.filter(u => u.id !== userId));
            const newBlockedIds = settings.blockedUsers.filter(id => id !== userId);
            const newSettings = { ...settings, blockedUsers: newBlockedIds };
            await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_SETTINGS, JSON.stringify(newSettings));
            setSettings(newSettings);
            showSuccess('Success', `${userName} has been unblocked`);
          } else {
            showError('Error', response.message || 'Failed to unblock user');
          }
        } catch (error: any) {
          console.error('Error unblocking user:', error);
          showError('Error', error.message || 'Failed to unblock user');
        } finally {
          setBlockedUsersLoading(false);
        }
      }
    );
  };

  // ============= 2FA Functions =============

  const handle2FAPress = () => {
    setTwoFAStep(twoFAEnabled ? 'status' : 'setup');
    setTwoFACode('');
    setShow2FAModal(true);
  };

  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    try {
      const response = await settingsService.setup2FA();
      if (response.success && response.data) {
        setTwoFASecret(response.data.secret);
        setTwoFAStep('verify');
      } else {
        showError('Error', response.message || 'Failed to setup 2FA');
      }
    } catch (error: any) {
      console.error('Error setting up 2FA:', error);
      showError('Error', error.message || 'Failed to setup 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) {
      showError('Error', 'Please enter a 6-digit code');
      return;
    }

    setTwoFALoading(true);
    try {
      const response = await settingsService.verify2FA(twoFACode);
      if (response.success && response.data) {
        setBackupCodes(response.data.backup_codes);
        setTwoFAEnabled(true);
        setTwoFAStep('backup_codes');
      } else {
        showError('Error', response.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      showError('Error', error.message || 'Failed to verify code');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (twoFACode.length !== 6) {
      showError('Error', 'Please enter a 6-digit code');
      return;
    }

    setTwoFALoading(true);
    try {
      const response = await settingsService.disable2FA(twoFACode);
      if (response.success) {
        setTwoFAEnabled(false);
        setShow2FAModal(false);
        showSuccess('Success', 'Two-factor authentication has been disabled');
      } else {
        showError('Error', response.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      showError('Error', error.message || 'Failed to disable 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (twoFACode.length !== 6) {
      showError('Error', 'Please enter a 6-digit code');
      return;
    }

    setTwoFALoading(true);
    try {
      const response = await settingsService.regenerateBackupCodes(twoFACode);
      if (response.success && response.data) {
        setBackupCodes(response.data.backup_codes);
        setTwoFAStep('backup_codes');
        setTwoFACode('');
      } else {
        showError('Error', response.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Error regenerating backup codes:', error);
      showError('Error', error.message || 'Failed to regenerate codes');
    } finally {
      setTwoFALoading(false);
    }
  };

  const copySecret = () => {
    Clipboard.setString(twoFASecret);
    Alert.alert('Copied', 'Secret key copied to clipboard');
  };

  const copyBackupCodes = () => {
    Clipboard.setString(backupCodes.join('\n'));
    Alert.alert('Copied', 'Backup codes copied to clipboard');
  };

  // ============= Clear Cache Function =============

  const handleClearCache = async () => {
    showConfirm(
      'Clear Cache',
      'This will clear all cached images, media files, and temporary data. Your messages and account data will not be affected.',
      async () => {
        setClearingCache(true);
        try {
          // Clear image cache
          const cacheKeys = await AsyncStorage.getAllKeys();
          const cachePrefixes = ['@image_cache_', '@media_cache_', '@temp_'];
          const keysToRemove = cacheKeys.filter(key =>
            cachePrefixes.some(prefix => key.startsWith(prefix))
          );

          if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
          }

          // Clear React Native's Image cache (if using FastImage or similar)
          // For standard Image component, there's no direct cache clearing

          showSuccess('Success', `Cache cleared successfully. Removed ${keysToRemove.length} cached items.`);
        } catch (error: any) {
          console.error('Error clearing cache:', error);
          showError('Error', error.message || 'Failed to clear cache');
        } finally {
          setClearingCache(false);
        }
      }
    );
  };

  // ============= Render Functions =============

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

  const renderBlockedUser = ({ item }: { item: BlockedUserInfo }) => (
    <View style={[styles.blockedUserRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <View style={[styles.blockedUserAvatar, { backgroundColor: theme.surfaceElevated }]}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <Icon name="person" size={24} color={theme.textSecondary} />
        )}
      </View>
      <View style={styles.blockedUserInfo}>
        <Text style={[styles.blockedUserName, { color: theme.text }]}>{item.displayName}</Text>
        {item.phoneNumber && (
          <Text style={[styles.blockedUserPhone, { color: theme.textSecondary }]}>{item.phoneNumber}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.unblockButton, { backgroundColor: theme.error + '20' }]}
        onPress={() => handleUnblockUser(item.id, item.displayName)}
        disabled={blockedUsersLoading}
      >
        <Text style={[styles.unblockButtonText, { color: theme.error }]}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  const handleBlockedUsers = () => {
    setShowBlockedList(true);
  };

  // ============= 2FA Modal Content =============

  const render2FAModalContent = () => {
    switch (twoFAStep) {
      case 'status':
        return (
          <View style={styles.modalContent}>
            <View style={[styles.twoFAIconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Icon name="shield-checkmark" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Two-Factor Authentication
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Your account is protected with 2FA. You'll need to enter a verification code when signing in.
            </Text>

            <TouchableOpacity
              style={[styles.twoFAButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setTwoFAStep('regenerate')}
            >
              <Icon name="key" size={20} color={theme.primary} />
              <Text style={[styles.twoFAButtonText, { color: theme.text }]}>
                Regenerate Backup Codes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.twoFAButton, { backgroundColor: theme.error + '10', borderColor: theme.error + '30' }]}
              onPress={() => setTwoFAStep('disable')}
            >
              <Icon name="shield-outline" size={20} color={theme.error} />
              <Text style={[styles.twoFAButtonText, { color: theme.error }]}>
                Disable Two-Factor Authentication
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'setup':
        return (
          <View style={styles.modalContent}>
            <View style={[styles.twoFAIconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Icon name="shield-checkmark" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Enable Two-Factor Authentication
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Add an extra layer of security to your account. You'll need an authenticator app like Google Authenticator or Authy.
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handleSetup2FA}
              disabled={twoFALoading}
            >
              {twoFALoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'verify':
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Setup Authenticator App
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Add this account to your authenticator app using the secret key below:
            </Text>

            <TouchableOpacity
              style={[styles.secretBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
              onPress={copySecret}
            >
              <Text style={[styles.secretText, { color: theme.text }]}>{twoFASecret}</Text>
              <Icon name="copy-outline" size={20} color={theme.primary} />
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Enter the 6-digit code from your app:
            </Text>
            <TextInput
              style={[styles.codeInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={twoFACode}
              onChangeText={(text) => setTwoFACode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={theme.textTertiary}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: twoFACode.length === 6 ? 1 : 0.5 }]}
              onPress={handleVerify2FA}
              disabled={twoFALoading || twoFACode.length !== 6}
            >
              {twoFALoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Enable</Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'backup_codes':
        return (
          <View style={styles.modalContent}>
            <View style={[styles.twoFAIconContainer, { backgroundColor: theme.success + '20' }]}>
              <Icon name="checkmark-circle" size={48} color={theme.success} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Save Your Backup Codes
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Store these codes safely. You can use them to access your account if you lose access to your authenticator app.
            </Text>

            <View style={[styles.backupCodesContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              {backupCodes.map((code, index) => (
                <Text key={index} style={[styles.backupCode, { color: theme.text }]}>
                  {code}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary }]}
              onPress={copyBackupCodes}
            >
              <Icon name="copy-outline" size={18} color={theme.primary} />
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                Copy All Codes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={() => {
                setShow2FAModal(false);
                showSuccess('Success', 'Two-factor authentication is now enabled');
              }}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        );

      case 'disable':
        return (
          <View style={styles.modalContent}>
            <View style={[styles.twoFAIconContainer, { backgroundColor: theme.error + '20' }]}>
              <Icon name="warning" size={48} color={theme.error} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Disable Two-Factor Authentication
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              This will make your account less secure. Enter your verification code to confirm.
            </Text>

            <TextInput
              style={[styles.codeInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={twoFACode}
              onChangeText={(text) => setTwoFACode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit code"
              placeholderTextColor={theme.textTertiary}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.error, opacity: twoFACode.length === 6 ? 1 : 0.5 }]}
              onPress={handleDisable2FA}
              disabled={twoFALoading || twoFACode.length !== 6}
            >
              {twoFALoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Disable 2FA</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setTwoFAStep('status')}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'regenerate':
        return (
          <View style={styles.modalContent}>
            <View style={[styles.twoFAIconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Icon name="key" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Regenerate Backup Codes
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              This will invalidate your previous backup codes. Enter your verification code to generate new ones.
            </Text>

            <TextInput
              style={[styles.codeInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={twoFACode}
              onChangeText={(text) => setTwoFACode(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit code"
              placeholderTextColor={theme.textTertiary}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: twoFACode.length === 6 ? 1 : 0.5 }]}
              onPress={handleRegenerateBackupCodes}
              disabled={twoFALoading || twoFACode.length !== 6}
            >
              {twoFALoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Generate New Codes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={() => setTwoFAStep('status')}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy & Security</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Show blocked users list
  if (showBlockedList) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowBlockedList(false)}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Blocked Users</Text>
          <View style={styles.placeholder} />
        </View>

        {blockedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="checkmark-circle" size={64} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Blocked Users</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              You haven't blocked anyone yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={blockedUsers}
            renderItem={renderBlockedUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.blockedList}
            showsVerticalScrollIndicator={false}
          />
        )}
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
                {blockedUsers.length}
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { backgroundColor: theme.surface }]}
            onPress={handle2FAPress}
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
                {twoFAEnabled ? 'Enabled - Your account is protected' : 'Add extra security to your account'}
              </Text>
            </View>
            {twoFAEnabled && (
              <View style={[styles.enabledBadge, { backgroundColor: theme.success + '20' }]}>
                <Text style={[styles.enabledBadgeText, { color: theme.success }]}>ON</Text>
              </View>
            )}
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
            onPress={handleClearCache}
            activeOpacity={0.7}
            disabled={clearingCache}
          >
            <View style={styles.settingIcon}>
              {clearingCache ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Icon name="trash" size={24} color={theme.primary} />
              )}
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

      {/* 2FA Modal */}
      <Modal
        visible={show2FAModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShow2FAModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShow2FAModal(false)}
            >
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {render2FAModalContent()}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 24,
    alignItems: 'center',
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
  enabledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  enabledBadgeText: {
    fontSize: 11,
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
  // Blocked users list styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  blockedList: {
    paddingTop: 8,
  },
  blockedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  blockedUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  blockedUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  blockedUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  blockedUserPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  modalContent: {
    alignItems: 'center',
  },
  twoFAIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  twoFAButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  twoFAButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  secretText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  codeInput: {
    width: '100%',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    letterSpacing: 8,
  },
  backupCodesContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  backupCode: {
    fontSize: 14,
    fontFamily: 'monospace',
    width: '48%',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default PrivacyScreen;
