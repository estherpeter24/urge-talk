import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { groupService } from '../../services/api/groupService';
import { userService } from '../../services/api/userService';
import { User } from '../../types';

const CreateGroupScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { showError, showSuccess } = useModal();
  const { user: currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [appUsers, setAppUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load app users on mount
  useEffect(() => {
    loadAppUsers();
  }, []);

  const loadAppUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers(100, 0);
      if (response.success && response.data) {
        // Filter out current user from the list
        const users = (response.data.users || response.data || []).filter(
          (u: User) => u.id !== currentUser?.id
        );
        setAppUsers(users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      showError('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = appUsers.filter(user =>
    (user.displayName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.phoneNumber || '').includes(searchQuery)
  );

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showError('Error', 'Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      showError('Error', 'Please select at least one member');
      return;
    }

    setCreating(true);
    try {
      const response = await groupService.createGroup({
        name: groupName.trim(),
        member_ids: selectedMembers,
        is_public: false,
        allow_member_invites: true,
        require_admin_approval: false,
      });

      if (response.success) {
        showSuccess(
          'Success',
          `Group "${groupName}" created successfully!`,
          () => navigation.goBack()
        );
      } else {
        showError('Error', response.message || 'Failed to create group');
      }
    } catch (error: any) {
      console.error('Create group error:', error);
      const errorMessage = error?.message || 'Failed to create group';
      showError('Error', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const getUserDisplayName = (user: User): string => {
    return user.displayName || user.phoneNumber || 'Unknown User';
  };

  const getUserInitial = (user: User): string => {
    const name = getUserDisplayName(user);
    return name.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Create Group
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView>
        {/* Group Name Input */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Icon name="people" size={24} color={theme.primary} style={styles.icon} />
          <TextInput
            style={[styles.groupNameInput, { color: theme.text }]}
            placeholder="Group name"
            placeholderTextColor={theme.textSecondary}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
          />
        </View>

        {/* Selected Members Count */}
        <View style={[styles.infoSection, { backgroundColor: theme.surfaceElevated }]}>
          <Text style={[styles.infoText, { color: theme.text }]}>
            {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchSection, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Icon name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search users..."
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

        {/* User List */}
        <View style={styles.contactList}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SELECT MEMBERS
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading users...
              </Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery ? 'No users found' : 'No users available'}
              </Text>
            </View>
          ) : (
            filteredUsers.map(user => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.contactItem,
                  { backgroundColor: theme.surface, borderBottomColor: theme.border },
                ]}
                onPress={() => toggleMember(user.id)}
              >
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.avatarText}>
                    {getUserInitial(user)}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactName, { color: theme.text }]}>
                    {getUserDisplayName(user)}
                  </Text>
                  {user.phoneNumber && (
                    <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                      {user.phoneNumber}
                    </Text>
                  )}
                </View>
                {user.isOnline && (
                  <View style={[styles.onlineIndicator, { backgroundColor: theme.success || '#4CAF50' }]} />
                )}
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: selectedMembers.includes(user.id) ? theme.primary : theme.border,
                      backgroundColor: selectedMembers.includes(user.id) ? theme.primary : 'transparent',
                    },
                  ]}
                >
                  {selectedMembers.includes(user.id) && (
                    <Icon name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Button */}
      {groupName.trim().length > 0 && selectedMembers.length > 0 && (
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: theme.primary },
              creating && styles.buttonDisabled,
            ]}
            onPress={handleCreateGroup}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Icon name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Group</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  contactList: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CreateGroupScreen;
