import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Contacts from 'react-native-contacts';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { ChatStackParamList, User } from '../../types';
import { Theme } from '../../constants/theme';
import { userService } from '../../services/api/userService';
import { conversationService } from '../../services/api';

interface ContactItem {
  id: string;
  name: string;
  phoneNumber: string;
  isRegistered: boolean;
  user?: User;
}

type NewChatNavigationProp = NativeStackNavigationProp<ChatStackParamList, 'NewChat'>;

const NewChatScreen = () => {
  const navigation = useNavigation<NewChatNavigationProp>();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [contactsPermission, setContactsPermission] = useState<boolean>(false);

  useFocusEffect(
    React.useCallback(() => {
      const initializeScreen = async () => {
        setLoading(true);

        // Load current user
        try {
          const userResponse = await userService.getCurrentUser();
          if (userResponse.success && userResponse.data) {
            setCurrentUserId(userResponse.data.id);
          }
        } catch (error) {
          console.error('Failed to load current user:', error);
        }

        // Load all users directly (skip contacts for now)
        await loadAllUsers();
      };

      initializeScreen();
    }, [])
  );

  const syncContactsWithBackend = async () => {
    try {
      console.log('🔄 Syncing contacts with backend...');

      // Get device contacts
      const deviceContacts = await Contacts.getAll();
      console.log('📱 Found', deviceContacts.length, 'device contacts');

      // Get all registered users from backend
      const response = await userService.getAllUsers(500, 0);
      const registeredUsers = response.success && response.data ? response.data.users : [];
      console.log('👥 Found', registeredUsers.length, 'registered users');

      // Create a map of phone numbers to users
      const usersByPhone = new Map<string, User>();
      registeredUsers.forEach(user => {
        const phoneNumber = user.phoneNumber || '';
        const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
        if (cleanPhone) {
          usersByPhone.set(cleanPhone, user);
        }
      });

      // Match device contacts with registered users
      const contactItems: ContactItem[] = [];
      const seenPhones = new Set<string>();

      deviceContacts.forEach(contact => {
        const displayName = contact.displayName || contact.givenName || 'Unknown';

        contact.phoneNumbers.forEach(phoneObj => {
          const phoneNumber = phoneObj.number || '';
          const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
          if (cleanPhone && !seenPhones.has(cleanPhone)) {
            seenPhones.add(cleanPhone);

            const registeredUser = usersByPhone.get(cleanPhone);
            contactItems.push({
              id: contact.recordID + '_' + cleanPhone,
              name: displayName,
              phoneNumber: phoneNumber,
              isRegistered: !!registeredUser,
              user: registeredUser,
            });
          }
        });
      });

      // Sort: registered users first, then alphabetically
      contactItems.sort((a, b) => {
        if (a.isRegistered && !b.isRegistered) return -1;
        if (!a.isRegistered && b.isRegistered) return 1;
        return a.name.localeCompare(b.name);
      });

      console.log('✅ Synced', contactItems.length, 'contacts');
      setContacts(contactItems);
      setContactsPermission(true);
    } catch (error) {
      console.error('❌ Error syncing contacts:', error);
      await loadAllUsers();
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      console.log('🔄 Loading all users...');
      const response = await userService.getAllUsers(50, 0);
      console.log('📡 Response:', response);

      if (response.success && response.data) {
        const contactItems: ContactItem[] = response.data.users.map(user => ({
          id: user.id,
          name: user.displayName || 'Unknown',
          phoneNumber: user.phoneNumber || '',
          isRegistered: true,
          user: user,
        }));
        setContacts(contactItems);
        console.log('✅ Loaded', contactItems.length, 'users');
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestContactsPermission = async () => {
    try {
      console.log('🔐 Requesting contacts permission...');
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'URGE needs access to your contacts to help you connect with friends.',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setContactsPermission(true);
          await syncContacts();
        } else {
          setContactsPermission(false);
          loadUsers();
        }
      } else {
        // iOS
        const permission = await Contacts.checkPermission();
        console.log('📋 iOS contacts permission status:', permission);
        if (permission === 'authorized') {
          console.log('✅ Permission authorized, syncing contacts...');
          setContactsPermission(true);
          await syncContacts();
        } else if (permission === 'undefined') {
          console.log('❓ Permission undefined, requesting...');
          const requested = await Contacts.requestPermission();
          console.log('📋 Request result:', requested);
          if (requested === 'authorized') {
            setContactsPermission(true);
            await syncContacts();
          } else {
            console.log('❌ Permission denied, loading users as fallback');
            setContactsPermission(false);
            loadUsers();
          }
        } else {
          console.log('🚫 Permission denied, loading users as fallback');
          setContactsPermission(false);
          loadUsers();
        }
      }
      await loadCurrentUser();
    } catch (error) {
      console.error('❌ Error requesting contacts permission:', error);
      loadUsers();
    }
  };

  const syncContacts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Starting contact sync...');
      // Get device contacts
      const deviceContacts = await Contacts.getAll();
      console.log('📱 Device contacts loaded:', deviceContacts.length);

      // Get registered users from backend
      console.log('🌐 Fetching registered users from backend...');
      const response = await userService.getAllUsers(500, 0);
      console.log('📡 Backend response:', response);
      const registeredUsers = response.success && response.data ? response.data.users : [];
      console.log('👥 Registered users count:', registeredUsers.length);

      // Create a map of phone numbers to users
      const usersByPhone = new Map<string, User>();
      registeredUsers.forEach(user => {
        const phoneNumber = user.phoneNumber || '';
        const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
        if (cleanPhone) {
          usersByPhone.set(cleanPhone, user);
        }
      });

      // Map device contacts to ContactItems
      const contactItems: ContactItem[] = [];
      const seenPhones = new Set<string>();

      deviceContacts.forEach(contact => {
        const displayName = contact.displayName || contact.givenName || 'Unknown';

        contact.phoneNumbers.forEach(phoneObj => {
          const phoneNumber = phoneObj.number || '';
          const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
          if (cleanPhone && !seenPhones.has(cleanPhone)) {
            seenPhones.add(cleanPhone);

            const registeredUser = usersByPhone.get(cleanPhone);
            contactItems.push({
              id: contact.recordID + '_' + cleanPhone,
              name: displayName,
              phoneNumber: phoneNumber,
              isRegistered: !!registeredUser,
              user: registeredUser,
            });
          }
        });
      });

      // Sort: registered users first, then by name
      contactItems.sort((a, b) => {
        if (a.isRegistered && !b.isRegistered) return -1;
        if (!a.isRegistered && b.isRegistered) return 1;
        return a.name.localeCompare(b.name);
      });

      setContacts(contactItems);
      console.log('✅ Contact sync completed. Total contacts:', contactItems.length);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error syncing contacts:', error);
      // Fallback to showing all users
      await loadUsersAsFallback();
    }
  };

  const loadUsersAsFallback = async () => {
    try {
      console.log('🔄 Loading users as fallback...');
      const response = await userService.getAllUsers(50, 0);
      console.log('📡 Fallback response:', response);
      if (response.success && response.data) {
        const contactItems: ContactItem[] = response.data.users.map(user => ({
          id: user.id,
          name: user.displayName || 'Unknown',
          phoneNumber: user.phoneNumber || '',
          isRegistered: true,
          user: user,
        }));
        setContacts(contactItems);
        console.log('✅ Fallback loaded. Total users:', contactItems.length);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const response = await userService.getCurrentUser();
      if (response.success && response.data) {
        setCurrentUserId(response.data.id);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadUsers = async () => {
    await loadUsersAsFallback();
  };

  const filteredContacts = contacts
    .filter(contact => contact.user?.id !== currentUserId) // Exclude current user
    .filter(contact => {
      if (!searchQuery) return true;
      return (
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phoneNumber.includes(searchQuery)
      );
    });

  const handleContactPress = async (contact: ContactItem) => {
    if (!contact.isRegistered || !contact.user) {
      // Show invite options
      handleInviteContact(contact);
      return;
    }

    const user = contact.user;
    try {
      // Create a new conversation with this user
      const response = await conversationService.createConversation({
        type: 'DIRECT',
        participant_ids: [user.id],
      });

      if (response.success && response.data) {
        const conversation = response.data;
        // Use replace instead of navigate to remove NewChatScreen from stack
        // This way, pressing back from ChatRoom goes directly to ChatListScreen
        navigation.replace('ChatRoom', {
          conversationId: conversation.id,
          recipientName: user.displayName || 'Unknown',
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Alert.alert('Error', 'Failed to start chat. Please try again.');
    }
  };

  const handleInviteContact = (contact: ContactItem) => {
    Alert.alert(
      'Invite to URGE',
      `${contact.name} is not on URGE yet. Would you like to invite them?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Invite via SMS', onPress: () => inviteViaSMS(contact) },
        { text: 'Share Link', onPress: () => inviteViaShare(contact) },
      ]
    );
  };

  const inviteViaSMS = async (contact: ContactItem) => {
    const message = `Hey! I'm using URGE for messaging. Join me on URGE: https://urge.app/download`;
    const url = `sms:${contact.phoneNumber}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open SMS app');
      }
    } catch (error) {
      console.error('Error opening SMS:', error);
      Alert.alert('Error', 'Failed to open SMS app');
    }
  };

  const inviteViaShare = async (contact: ContactItem) => {
    try {
      await Share.share({
        message: `Hey ${contact.name}! Join me on URGE for secure messaging. Download: https://urge.app/download`,
        title: 'Join me on URGE',
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const renderContactItem = ({ item }: { item: ContactItem }) => {
    const displayName = item.name;
    const isOnline = item.user?.isOnline || false;

    return (
      <TouchableOpacity
        style={[
          styles.userItem,
          {
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
        ]}
        onPress={() => handleContactPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: item.isRegistered ? theme.primary : theme.textSecondary }]}>
          <Text style={styles.avatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
          {isOnline && (
            <View style={[styles.onlineIndicator, { borderColor: theme.surface }]} />
          )}
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {displayName}
            </Text>
            {isOnline && (
              <Text style={[styles.statusText, { color: theme.secondary }]}>
                Online
              </Text>
            )}
          </View>
          <Text style={[styles.userPhone, { color: theme.textSecondary }]}>
            {item.phoneNumber}
          </Text>
        </View>
        {item.isRegistered ? (
          <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
        ) : (
          <Text style={[styles.inviteButton, { color: theme.primary }]}>Invite</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading users...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Icon name="search-outline" size={Theme.iconSize.sm} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by name or number..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {filteredContacts.length > 0 ? (
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={80} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.text }]}>
            {searchQuery ? 'No users found' : 'No contacts available'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
            {searchQuery ? 'Try a different search term' : 'Start by inviting people to join URGE'}
          </Text>
        </View>
      )}
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
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    paddingVertical: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.xl,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00D46E',
    borderWidth: 2,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  userName: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  statusText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: '500',
  },
  userPhone: {
    fontSize: Theme.fontSize.sm,
  },
  inviteButton: {
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '600',
    marginTop: Theme.spacing.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: Theme.fontSize.md,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
});

export default NewChatScreen;
