import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { accountService, SocialLinks } from '../../services/api';

interface SocialAccount {
  id: string;
  platform: string;
  icon: string;
  color: string;
  placeholder: string;
  baseUrl: string;
  username: string;
  isConnected: boolean;
}

interface ThemeType {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  primary: string;
  border: string;
  error: string;
}

interface SocialAccountCardProps {
  account: SocialAccount;
  theme: ThemeType;
  isEditing: boolean;
  saving: boolean;
  inputValue: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDisconnect: () => void;
  onOpenProfile: () => void;
  onChangeText: (text: string) => void;
}

const PLATFORM_CONFIG = [
  {
    id: 'instagram',
    platform: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    placeholder: 'your_username',
    baseUrl: 'https://instagram.com/',
  },
  {
    id: 'twitter',
    platform: 'Twitter / X',
    icon: 'logo-twitter',
    color: '#1DA1F2',
    placeholder: 'your_handle',
    baseUrl: 'https://twitter.com/',
  },
  {
    id: 'linkedin',
    platform: 'LinkedIn',
    icon: 'logo-linkedin',
    color: '#0A66C2',
    placeholder: 'your-profile',
    baseUrl: 'https://linkedin.com/in/',
  },
  {
    id: 'tiktok',
    platform: 'TikTok',
    icon: 'musical-notes',
    color: '#000000',
    placeholder: '@your_username',
    baseUrl: 'https://tiktok.com/@',
  },
  {
    id: 'youtube',
    platform: 'YouTube',
    icon: 'logo-youtube',
    color: '#FF0000',
    placeholder: 'channel_name',
    baseUrl: 'https://youtube.com/@',
  },
  {
    id: 'facebook',
    platform: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    placeholder: 'profile.name',
    baseUrl: 'https://facebook.com/',
  },
];

// Moved outside to prevent re-creation on every render
const SocialAccountCard = React.memo(({
  account,
  theme,
  isEditing,
  saving,
  inputValue,
  onEdit,
  onCancel,
  onSave,
  onDisconnect,
  onOpenProfile,
  onChangeText,
}: SocialAccountCardProps) => {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: account.color + '20' }]}>
          <Icon name={account.icon} size={24} color={account.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.platformName, { color: theme.text }]}>
            {account.platform}
          </Text>
          {account.isConnected && !isEditing ? (
            <TouchableOpacity onPress={onOpenProfile}>
              <Text style={[styles.usernameText, { color: theme.primary }]}>
                @{account.username}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {isEditing ? 'Editing...' : 'Not connected'}
            </Text>
          )}
        </View>
        {account.isConnected && !isEditing && (
          <View style={[styles.connectedBadge, { backgroundColor: '#4CAF50' }]}>
            <Icon name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputPrefix, { color: theme.textSecondary }]}>
              @
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surfaceElevated, color: theme.text },
              ]}
              placeholder={account.placeholder}
              placeholderTextColor={theme.textSecondary}
              value={inputValue}
              onChangeText={onChangeText}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={onSave}
            />
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cardActions}>
          {account.isConnected ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.surfaceElevated }]}
                onPress={onEdit}
              >
                <Icon name="pencil" size={16} color={theme.text} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.error + '20' }]}
                onPress={onDisconnect}
              >
                <Icon name="unlink" size={16} color={theme.error} />
                <Text style={[styles.actionButtonText, { color: theme.error }]}>
                  Disconnect
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: theme.primary }]}
              onPress={onEdit}
            >
              <Icon name="add" size={18} color="#FFFFFF" />
              <Text style={styles.connectButtonText}>Connect</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

const SocialMediaScreen = () => {
  const { theme } = useTheme();
  const { showSuccess, showError, showConfirm } = useModal();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  // Separate state for the input being edited to prevent focus loss
  const [editingValue, setEditingValue] = useState('');

  // Reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSocialLinks();
    }, [])
  );

  const loadSocialLinks = async () => {
    try {
      setLoading(true);
      const response = await accountService.getSocialLinks();

      if (response.success && response.data) {
        const socialLinks = response.data.social_links || {};
        const accountsList: SocialAccount[] = PLATFORM_CONFIG.map(config => ({
          ...config,
          username: (socialLinks as any)[config.id] || '',
          isConnected: !!(socialLinks as any)[config.id],
        }));
        setAccounts(accountsList);
      } else {
        // Initialize with empty accounts if API fails
        const accountsList: SocialAccount[] = PLATFORM_CONFIG.map(config => ({
          ...config,
          username: '',
          isConnected: false,
        }));
        setAccounts(accountsList);
      }
    } catch (error) {
      console.error('Failed to load social links:', error);
      // Initialize with empty accounts
      const accountsList: SocialAccount[] = PLATFORM_CONFIG.map(config => ({
        ...config,
        username: '',
        isConnected: false,
      }));
      setAccounts(accountsList);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = useCallback((accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    setEditingValue(account?.username || '');
    setEditingId(accountId);
  }, [accounts]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingValue('');
  }, []);

  const handleSaveAccount = useCallback(async (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    setSaving(true);
    try {
      // Build the update object with all current links
      const linksUpdate: SocialLinks = {};
      accounts.forEach(acc => {
        if (acc.id === accountId) {
          if (editingValue.trim()) {
            (linksUpdate as any)[acc.id] = editingValue.trim();
          }
        } else if (acc.username) {
          (linksUpdate as any)[acc.id] = acc.username;
        }
      });

      const response = await accountService.updateSocialLinks(linksUpdate);

      if (response.success) {
        // Update local state
        setAccounts(prev =>
          prev.map(acc =>
            acc.id === accountId
              ? { ...acc, username: editingValue.trim(), isConnected: editingValue.trim().length > 0 }
              : acc
          )
        );
        setEditingId(null);
        setEditingValue('');
        showSuccess(
          'Saved',
          editingValue.trim()
            ? `${account.platform} account connected successfully`
            : `${account.platform} account disconnected`
        );
      } else {
        showError('Error', response.message || 'Failed to save changes');
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, [accounts, editingValue, showSuccess, showError]);

  const handleDisconnect = useCallback((account: SocialAccount) => {
    showConfirm(
      'Disconnect Account',
      `Are you sure you want to disconnect your ${account.platform} account?`,
      async () => {
        setSaving(true);
        try {
          const response = await accountService.disconnectSocialAccount(account.id);

          if (response.success) {
            setAccounts(prev =>
              prev.map(acc =>
                acc.id === account.id
                  ? { ...acc, username: '', isConnected: false }
                  : acc
              )
            );
            showSuccess('Disconnected', `${account.platform} account has been disconnected`);
          } else {
            showError('Error', response.message || 'Failed to disconnect account');
          }
        } catch (error: any) {
          showError('Error', error.message || 'Failed to disconnect account');
        } finally {
          setSaving(false);
        }
      }
    );
  }, [showConfirm, showSuccess, showError]);

  const handleOpenProfile = useCallback(async (account: SocialAccount) => {
    if (!account.username) return;

    const url = account.baseUrl + account.username.replace('@', '');
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        showError('Error', 'Cannot open this link');
      }
    } catch (error) {
      showError('Error', 'Failed to open profile');
    }
  }, [showError]);

  const connectedCount = accounts.filter(a => a.isConnected).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Social Media</Text>
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
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Social Media</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introSection}>
            <Icon name="share-social" size={48} color={theme.primary} />
            <Text style={[styles.introTitle, { color: theme.text }]}>
              Connect Your Accounts
            </Text>
            <Text style={[styles.introSubtitle, { color: theme.textSecondary }]}>
              Link your social media profiles so others can find and follow you
            </Text>
          </View>

          <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>
                {connectedCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Connected
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.text }]}>
                {accounts.length - connectedCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Available
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            YOUR ACCOUNTS
          </Text>

          {accounts.map((account) => (
            <SocialAccountCard
              key={account.id}
              account={account}
              theme={theme}
              isEditing={editingId === account.id}
              saving={saving}
              inputValue={editingId === account.id ? editingValue : account.username}
              onEdit={() => handleEditAccount(account.id)}
              onCancel={handleCancelEdit}
              onSave={() => handleSaveAccount(account.id)}
              onDisconnect={() => handleDisconnect(account)}
              onOpenProfile={() => handleOpenProfile(account)}
              onChangeText={setEditingValue}
            />
          ))}

          <View
            style={[
              styles.infoBox,
              { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
            ]}
          >
            <Icon name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Your connected social media accounts will be visible on your profile. Other users can tap on them to visit your profiles.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
  },
  usernameText: {
    fontSize: 14,
    marginTop: 2,
  },
  statusText: {
    fontSize: 13,
    marginTop: 2,
  },
  connectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editContainer: {
    marginTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefix: {
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginTop: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default SocialMediaScreen;
