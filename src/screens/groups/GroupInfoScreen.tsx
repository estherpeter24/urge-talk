import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Share,
  Switch,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import { ChatStackParamList } from '../../types';
import {
  groupService,
  Group,
  GroupMember,
  GroupEvent,
  GroupRole,
  isAdminRole,
  isCofounderRole,
  getRoleDisplayName,
} from '../../services/api/groupService';
import { userService } from '../../services/api/userService';
import { conversationService } from '../../services/api/conversationService';

type GroupInfoScreenRouteProp = RouteProp<ChatStackParamList, 'GroupInfo'>;
type NavigationProp = NativeStackNavigationProp<ChatStackParamList>;

const THEME_COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6',
  '#AF52DE', '#FF2D55', '#00C7BE', '#FFD60A', '#8E8E93',
];

const GroupInfoScreen = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showConfirm, showError, showSuccess, showWarning } = useModal();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GroupInfoScreenRouteProp>();
  const { groupId } = route.params;

  // State
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);

  // Add Members modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  // Selected member for role change
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);

  // Event creation form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartTime, setEventStartTime] = useState(new Date());
  const [eventEndTime, setEventEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour later
  const [eventIsOnline, setEventIsOnline] = useState(false);
  const [eventMeetingLink, setEventMeetingLink] = useState('');

  // Date/Time picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Mute state (per-user, not group-wide)
  const [isMuted, setIsMuted] = useState(false);

  // Current user's role - check both group.current_user_role and members array
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const currentUserRole = group?.current_user_role || currentUserMember?.role || 'MEMBER';
  const isFounder = currentUserRole === 'FOUNDER';
  const isAdmin = isAdminRole(currentUserRole);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [groupRes, eventsRes] = await Promise.all([
        groupService.getGroup(groupId),
        groupService.getEvents(groupId),
      ]);

      if (groupRes.success && groupRes.data) {
        setGroup(groupRes.data);
        setMembers(groupRes.data.members || []);

        // Fetch conversation mute status
        if (groupRes.data.conversation_id) {
          const convRes = await conversationService.getConversation(groupRes.data.conversation_id);
          if (convRes.success && convRes.data) {
            setIsMuted((convRes.data as any).isMuted || false);
          }
        }
      }

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data);
      }
    } catch (error) {
      console.error('Load group data error:', error);
      showError('Error', 'Failed to load group information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupData();
  };

  const handleShareGroup = async () => {
    if (!group?.settings?.invite_link) {
      showError('Error', 'Invite link is not available');
      return;
    }

    try {
      const inviteUrl = `urgetalk://join/${group.settings.invite_link}`;
      await Share.share({
        message: `Join "${group.name}" on URGE Talk!\n\n${inviteUrl}`,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleRegenerateInviteLink = async () => {
    if (!isFounder) return;

    showConfirm(
      'Regenerate Invite Link',
      'This will invalidate the current invite link. Are you sure?',
      async () => {
        try {
          const response = await groupService.regenerateInviteLink(groupId);
          if (response.success) {
            loadGroupData();
            showSuccess('Success', 'Invite link regenerated');
          }
        } catch (error) {
          showError('Error', 'Failed to regenerate invite link');
        }
      }
    );
  };

  const handleUpdateRole = async (memberId: string, newRole: GroupRole) => {
    if (!isFounder) return;

    try {
      const response = await groupService.updateMemberRole(groupId, memberId, newRole);
      if (response.success) {
        loadGroupData();
        setShowRoleModal(false);
        setSelectedMember(null);
        showSuccess('Success', 'Role updated successfully');
      }
    } catch (error) {
      showError('Error', 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    showConfirm(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the group?`,
      async () => {
        try {
          const response = await groupService.removeMember(groupId, memberId);
          if (response.success) {
            loadGroupData();
            showSuccess('Success', 'Member removed');
          }
        } catch (error) {
          showError('Error', 'Failed to remove member');
        }
      }
    );
  };

  // Search for users to add
  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await userService.searchUsers(query);
      if (response.success && response.data) {
        // Filter out users who are already members
        const memberIds = members.map(m => m.user_id);
        const filteredUsers = response.data.users.filter(
          (u: any) => !memberIds.includes(u.id)
        );
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Add selected members to group
  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      showError('Error', 'Please select at least one user to add');
      return;
    }

    setAddingMembers(true);
    try {
      const response = await groupService.addMembers(groupId, selectedUsers);
      if (response.success) {
        showSuccess('Success', `Added ${response.data?.added || selectedUsers.length} member(s)`);
        setShowAddMembersModal(false);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUsers([]);
        loadGroupData();
      }
    } catch (error) {
      showError('Error', 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  const handleUpdateSettings = async (key: string, value: boolean | string) => {
    if (!isFounder) return;

    try {
      const response = await groupService.updateSettings(groupId, { [key]: value });
      if (response.success) {
        loadGroupData();
      }
    } catch (error) {
      showError('Error', 'Failed to update settings');
    }
  };

  // Handle mute toggle using conversation API (per-user setting)
  const handleMuteToggle = async (value: boolean) => {
    if (!group?.conversation_id) return;

    try {
      const response = value
        ? await conversationService.muteConversation(group.conversation_id)
        : await conversationService.unmuteConversation(group.conversation_id);

      if (response.success) {
        setIsMuted(value);
        showSuccess('Success', value ? 'Notifications muted' : 'Notifications unmuted');
      }
    } catch (error) {
      showError('Error', 'Failed to update notification settings');
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      showError('Error', 'Event title is required');
      return;
    }

    try {
      const response = await groupService.createEvent(groupId, {
        title: eventTitle,
        description: eventDescription || undefined,
        location: eventLocation || undefined,
        start_time: eventStartTime.toISOString(),
        end_time: eventEndTime.toISOString(),
        is_online: eventIsOnline,
        meeting_link: eventMeetingLink || undefined,
      });

      if (response.success) {
        setShowCreateEventModal(false);
        resetEventForm();
        loadGroupData();
        showSuccess('Success', 'Event created');
      }
    } catch (error) {
      showError('Error', 'Failed to create event');
    }
  };

  const resetEventForm = () => {
    setEventTitle('');
    setEventDescription('');
    setEventLocation('');
    setEventStartTime(new Date());
    setEventEndTime(new Date(Date.now() + 60 * 60 * 1000));
    setEventIsOnline(false);
    setEventMeetingLink('');
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
  };

  // Date/Time picker handlers
  const onStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(eventStartTime);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setEventStartTime(newDate);
    }
  };

  const onStartTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(eventStartTime);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setEventStartTime(newDate);
    }
  };

  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(eventEndTime);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setEventEndTime(newDate);
    }
  };

  const onEndTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(eventEndTime);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setEventEndTime(newDate);
    }
  };

  // Format helpers
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleAttendEvent = async (eventId: string, status: 'going' | 'maybe' | 'not_going') => {
    try {
      const response = await groupService.attendEvent(groupId, eventId, status);
      if (response.success) {
        loadGroupData();
      }
    } catch (error) {
      showError('Error', 'Failed to update attendance');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    showConfirm(
      'Delete Event',
      'Are you sure you want to delete this event?',
      async () => {
        try {
          const response = await groupService.deleteEvent(groupId, eventId);
          if (response.success) {
            loadGroupData();
          }
        } catch (error) {
          showError('Error', 'Failed to delete event');
        }
      }
    );
  };

  const handleLeaveGroup = () => {
    if (isFounder) {
      showWarning(
        'Cannot Leave',
        'As the founder, you must transfer ownership before leaving the group.'
      );
      return;
    }

    showConfirm(
      'Leave Group',
      'Are you sure you want to leave this group?',
      async () => {
        try {
          const response = await groupService.leaveGroup(groupId);
          if (response.success) {
            navigation.goBack();
            navigation.goBack();
          }
        } catch (error) {
          showError('Error', 'Failed to leave group');
        }
      }
    );
  };

  const handleDeleteGroup = () => {
    if (!isFounder) return;

    showConfirm(
      'Delete Group',
      'This action cannot be undone. All messages and data will be permanently deleted.',
      async () => {
        try {
          const response = await groupService.deleteGroup(groupId);
          if (response.success) {
            navigation.goBack();
            navigation.goBack();
          }
        } catch (error) {
          showError('Error', 'Failed to delete group');
        }
      }
    );
  };

  const getRoleBadgeColor = (role: GroupRole) => {
    switch (role) {
      case 'FOUNDER':
        return '#FFD700';
      case 'ACCOUNTANT':
        return '#4CAF50';
      case 'MODERATOR':
        return '#2196F3';
      case 'RECRUITER':
        return '#9C27B0';
      case 'SUPPORT':
        return '#FF9800';
      case 'CHEERLEADER':
        return '#E91E63';
      default:
        return theme.textSecondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Group Info</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Group Avatar & Name */}
        <View style={styles.profileSection}>
          <View style={[styles.avatarContainer, { backgroundColor: group.settings?.theme_color || theme.primary }]}>
            {group.avatar_url ? (
              <Image source={{ uri: group.avatar_url }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {(group.name || 'G').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={[styles.groupName, { color: theme.text }]}>{group.name}</Text>
          {group.description && (
            <Text style={[styles.groupDescription, { color: theme.textSecondary }]}>
              {group.description}
            </Text>
          )}
          <View style={styles.roleContainer}>
            <Text style={[styles.roleText, { color: getRoleBadgeColor(currentUserRole) }]}>
              {getRoleDisplayName(currentUserRole)}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleShareGroup}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.primary + '20' }]}>
              <Icon name="share-social" size={20} color={theme.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Share Group</Text>
              <Text style={[styles.actionSubtitle, { color: theme.textSecondary }]}>
                Invite others to join
              </Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowMembersModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleRow}>
              <Icon name="people" size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Members</Text>
            </View>
            <View style={styles.sectionRight}>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => setShowAddMembersModal(true)}
                  style={styles.addButton}
                >
                  <Icon name="person-add" size={22} color={theme.primary} />
                </TouchableOpacity>
              )}
              <Text style={[styles.memberCount, { color: theme.textSecondary }]}>
                {members.length}
              </Text>
              <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
            </View>
          </TouchableOpacity>

          {/* Preview first 5 members */}
          {members.slice(0, 5).map((member) => (
            <View key={member.user_id} style={styles.memberPreview}>
              <View style={[styles.memberAvatar, { backgroundColor: getRoleBadgeColor(member.role) }]}>
                <Text style={styles.memberAvatarText}>
                  {(member.display_name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
                  {member.display_name}
                  {member.user_id === user?.id && ' (You)'}
                </Text>
                <Text style={[styles.memberRole, { color: getRoleBadgeColor(member.role) }]}>
                  {getRoleDisplayName(member.role)}
                </Text>
              </View>
              {member.is_online && (
                <View style={[styles.onlineDot, { backgroundColor: '#34C759' }]} />
              )}
            </View>
          ))}

          {members.length > 5 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setShowMembersModal(true)}
            >
              <Text style={[styles.viewAllText, { color: theme.primary }]}>
                View all {members.length} members
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Events Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowEventsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleRow}>
              <Icon name="calendar" size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Events</Text>
            </View>
            <View style={styles.sectionRight}>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => setShowCreateEventModal(true)}
                  style={styles.addButton}
                >
                  <Icon name="add-circle" size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
              <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
            </View>
          </TouchableOpacity>

          {events.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No upcoming events
            </Text>
          ) : (
            events.slice(0, 3).map((event) => (
              <View key={event.id} style={styles.eventPreview}>
                <View style={[styles.eventDate, { backgroundColor: theme.primary + '20' }]}>
                  <Text style={[styles.eventDay, { color: theme.primary }]}>
                    {new Date(event.start_time).getDate()}
                  </Text>
                  <Text style={[styles.eventMonth, { color: theme.primary }]}>
                    {new Date(event.start_time).toLocaleString('default', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventTitle, { color: theme.text }]} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={[styles.eventTime, { color: theme.textSecondary }]}>
                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {event.is_online && ' - Online'}
                  </Text>
                </View>
                <Text style={[styles.attendeesCount, { color: theme.textSecondary }]}>
                  {event.attendees_count}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Settings Section (Founder only) */}
        {isFounder && (
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowSettingsModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleRow}>
                <Icon name="settings" size={20} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Group Settings</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => isFounder && setShowThemeModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.sectionTitleRow}>
              <Icon name="color-palette" size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme Color</Text>
            </View>
            <View style={styles.sectionRight}>
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: group.settings?.theme_color || theme.primary },
                ]}
              />
              {isFounder && <Icon name="chevron-forward" size={20} color={theme.textTertiary} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.sectionTitleRow}>
              <Icon name="notifications" size={20} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Mute Notifications</Text>
            </View>
            <Switch
              value={isMuted}
              onValueChange={handleMuteToggle}
              trackColor={{ false: theme.border, true: theme.primary }}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleLeaveGroup}
            activeOpacity={0.7}
          >
            <Icon name="exit-outline" size={20} color={theme.error} />
            <Text style={[styles.dangerText, { color: theme.error }]}>Leave Group</Text>
          </TouchableOpacity>

          {isFounder && (
            <TouchableOpacity
              style={[styles.dangerRow, styles.dangerRowLast]}
              onPress={handleDeleteGroup}
              activeOpacity={0.7}
            >
              <Icon name="trash-outline" size={20} color={theme.error} />
              <Text style={[styles.dangerText, { color: theme.error }]}>Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowMembersModal(false)}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Members ({members.length})</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {members.map((member) => (
              <TouchableOpacity
                key={member.user_id}
                style={[styles.memberRow, { borderBottomColor: theme.border }]}
                onPress={() => {
                  if (isFounder && member.user_id !== user?.id) {
                    setSelectedMember(member);
                    setShowRoleModal(true);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.memberAvatar, { backgroundColor: getRoleBadgeColor(member.role) }]}>
                  <Text style={styles.memberAvatarText}>
                    {(member.display_name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: theme.text }]}>
                    {member.display_name}
                    {member.user_id === user?.id && ' (You)'}
                  </Text>
                  <Text style={[styles.memberRole, { color: getRoleBadgeColor(member.role) }]}>
                    {getRoleDisplayName(member.role)}
                  </Text>
                </View>
                {member.is_online && (
                  <View style={[styles.onlineDot, { backgroundColor: '#34C759' }]} />
                )}
                {isFounder && member.user_id !== user?.id && member.role !== 'FOUNDER' && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member.user_id, member.display_name)}
                    style={styles.removeButton}
                  >
                    <Icon name="remove-circle" size={24} color={theme.error} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Role Assignment Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.roleModalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.roleModalTitle, { color: theme.text }]}>
              Assign Role to {selectedMember?.display_name}
            </Text>

            {(['ACCOUNTANT', 'MODERATOR', 'RECRUITER', 'SUPPORT', 'CHEERLEADER', 'MEMBER'] as GroupRole[]).map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  selectedMember?.role === role && { backgroundColor: theme.primary + '20' },
                ]}
                onPress={() => selectedMember && handleUpdateRole(selectedMember.user_id, role)}
              >
                <View style={[styles.roleDot, { backgroundColor: getRoleBadgeColor(role) }]} />
                <View style={styles.roleOptionInfo}>
                  <Text style={[styles.roleOptionTitle, { color: theme.text }]}>
                    {getRoleDisplayName(role)}
                  </Text>
                  <Text style={[styles.roleOptionDesc, { color: theme.textSecondary }]}>
                    {getRoleDescription(role)}
                  </Text>
                </View>
                {selectedMember?.role === role && (
                  <Icon name="checkmark-circle" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Events Modal */}
      <Modal
        visible={showEventsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowEventsModal(false)}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Events</Text>
            {isAdmin && (
              <TouchableOpacity onPress={() => setShowCreateEventModal(true)}>
                <Icon name="add" size={24} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.modalContent}>
            {events.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="calendar-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.text }]}>
                  No events scheduled
                </Text>
                {isAdmin && (
                  <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: theme.primary }]}
                    onPress={() => setShowCreateEventModal(true)}
                  >
                    <Text style={styles.createButtonText}>Create Event</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              events.map((event) => (
                <View key={event.id} style={[styles.eventCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={styles.eventCardHeader}>
                    <View style={[styles.eventDate, { backgroundColor: theme.primary + '20' }]}>
                      <Text style={[styles.eventDay, { color: theme.primary }]}>
                        {new Date(event.start_time).getDate()}
                      </Text>
                      <Text style={[styles.eventMonth, { color: theme.primary }]}>
                        {new Date(event.start_time).toLocaleString('default', { month: 'short' })}
                      </Text>
                    </View>
                    <View style={styles.eventCardInfo}>
                      <Text style={[styles.eventCardTitle, { color: theme.text }]}>
                        {event.title}
                      </Text>
                      <Text style={[styles.eventCardTime, { color: theme.textSecondary }]}>
                        {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {event.end_time && ` - ${new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </Text>
                      {event.location && (
                        <View style={styles.eventLocationRow}>
                          <Icon name={event.is_online ? 'videocam' : 'location'} size={14} color={theme.textSecondary} />
                          <Text style={[styles.eventLocationText, { color: theme.textSecondary }]}>
                            {event.is_online ? 'Online Event' : event.location}
                          </Text>
                        </View>
                      )}
                    </View>
                    {isAdmin && (
                      <TouchableOpacity onPress={() => handleDeleteEvent(event.id)}>
                        <Icon name="trash-outline" size={20} color={theme.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {event.description && (
                    <Text style={[styles.eventDescription, { color: theme.textSecondary }]}>
                      {event.description}
                    </Text>
                  )}
                  <View style={styles.attendanceButtons}>
                    <TouchableOpacity
                      style={[styles.attendButton, { backgroundColor: '#34C759' }]}
                      onPress={() => handleAttendEvent(event.id, 'going')}
                    >
                      <Text style={styles.attendButtonText}>Going</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.attendButton, { backgroundColor: '#FF9500' }]}
                      onPress={() => handleAttendEvent(event.id, 'maybe')}
                    >
                      <Text style={styles.attendButtonText}>Maybe</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.attendButton, { backgroundColor: '#FF3B30' }]}
                      onPress={() => handleAttendEvent(event.id, 'not_going')}
                    >
                      <Text style={styles.attendButtonText}>Can't Go</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.attendeesLabel, { color: theme.textSecondary }]}>
                    {event.attendees_count} attending
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateEventModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowCreateEventModal(false)}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>New Event</Text>
            <TouchableOpacity onPress={handleCreateEvent}>
              <Text style={[styles.saveText, { color: theme.primary }]}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="Event title"
                placeholderTextColor={theme.textTertiary}
                value={eventTitle}
                onChangeText={setEventTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="Event description"
                placeholderTextColor={theme.textTertiary}
                value={eventDescription}
                onChangeText={setEventDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Start Date & Time */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Starts</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setShowStartDatePicker(!showStartDatePicker)}
                >
                  <Icon name="calendar-outline" size={18} color={theme.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.text }]}>
                    {formatDate(eventStartTime)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateTimeButton, styles.timeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setShowStartTimePicker(!showStartTimePicker)}
                >
                  <Icon name="time-outline" size={18} color={theme.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.text }]}>
                    {formatTime(eventStartTime)}
                  </Text>
                </TouchableOpacity>
              </View>
              {showStartDatePicker && (
                <>
                  <DateTimePicker
                    value={eventStartTime}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onStartDateChange}
                    minimumDate={new Date()}
                    themeVariant="dark"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[styles.pickerDoneButton, { backgroundColor: theme.primary }]}
                      onPress={() => setShowStartDatePicker(false)}
                    >
                      <Text style={styles.pickerDoneButtonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              {showStartTimePicker && (
                <>
                  <DateTimePicker
                    value={eventStartTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onStartTimeChange}
                    themeVariant="dark"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[styles.pickerDoneButton, { backgroundColor: theme.primary }]}
                      onPress={() => setShowStartTimePicker(false)}
                    >
                      <Text style={styles.pickerDoneButtonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            {/* End Date & Time */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Ends</Text>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[styles.dateTimeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setShowEndDatePicker(!showEndDatePicker)}
                >
                  <Icon name="calendar-outline" size={18} color={theme.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.text }]}>
                    {formatDate(eventEndTime)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dateTimeButton, styles.timeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setShowEndTimePicker(!showEndTimePicker)}
                >
                  <Icon name="time-outline" size={18} color={theme.primary} />
                  <Text style={[styles.dateTimeText, { color: theme.text }]}>
                    {formatTime(eventEndTime)}
                  </Text>
                </TouchableOpacity>
              </View>
              {showEndDatePicker && (
                <>
                  <DateTimePicker
                    value={eventEndTime}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onEndDateChange}
                    minimumDate={eventStartTime}
                    themeVariant="dark"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[styles.pickerDoneButton, { backgroundColor: theme.primary }]}
                      onPress={() => setShowEndDatePicker(false)}
                    >
                      <Text style={styles.pickerDoneButtonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              {showEndTimePicker && (
                <>
                  <DateTimePicker
                    value={eventEndTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onEndTimeChange}
                    themeVariant="dark"
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[styles.pickerDoneButton, { backgroundColor: theme.primary }]}
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <Text style={styles.pickerDoneButtonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <View style={[styles.switchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.switchLabel, { color: theme.text }]}>Online Event</Text>
              <Switch
                value={eventIsOnline}
                onValueChange={setEventIsOnline}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>

            {eventIsOnline ? (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Meeting Link</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="https://meet.example.com/..."
                  placeholderTextColor={theme.textTertiary}
                  value={eventMeetingLink}
                  onChangeText={setEventMeetingLink}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Location</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="Event location"
                  placeholderTextColor={theme.textTertiary}
                  value={eventLocation}
                  onChangeText={setEventLocation}
                />
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Group Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={[styles.settingsSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.settingRow}>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Public Group</Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    Anyone can find and view this group
                  </Text>
                </View>
                <Switch
                  value={group.settings?.is_public || false}
                  onValueChange={(value) => handleUpdateSettings('is_public', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>

              <View style={[styles.settingRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Allow Member Invites</Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    Members can invite others to join
                  </Text>
                </View>
                <Switch
                  value={group.settings?.allow_member_invites || false}
                  onValueChange={(value) => handleUpdateSettings('allow_member_invites', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>

              <View style={[styles.settingRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Require Admin Approval</Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    New members must be approved
                  </Text>
                </View>
                <Switch
                  value={group.settings?.require_admin_approval || false}
                  onValueChange={(value) => handleUpdateSettings('require_admin_approval', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>

              <View style={[styles.settingRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Only Admins Can Post</Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    Only founder and co-founders can send messages
                  </Text>
                </View>
                <Switch
                  value={group.settings?.only_admins_can_post || false}
                  onValueChange={(value) => handleUpdateSettings('only_admins_can_post', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>

              <View style={[styles.settingRow, { borderTopColor: theme.border, borderTopWidth: 1 }]}>
                <View>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>Invite Link Enabled</Text>
                  <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                    Allow joining via invite link
                  </Text>
                </View>
                <Switch
                  value={group.settings?.invite_link_enabled || false}
                  onValueChange={(value) => handleUpdateSettings('invite_link_enabled', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
            </View>

            {group.settings?.invite_link && (
              <View style={[styles.inviteLinkSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.inviteLinkLabel, { color: theme.textSecondary }]}>Invite Link</Text>
                <Text style={[styles.inviteLinkText, { color: theme.text }]} numberOfLines={1}>
                  urgetalk://join/{group.settings.invite_link}
                </Text>
                <View style={styles.inviteLinkActions}>
                  <TouchableOpacity
                    style={[styles.inviteLinkButton, { backgroundColor: theme.primary }]}
                    onPress={handleShareGroup}
                  >
                    <Icon name="share-social" size={16} color="#FFF" />
                    <Text style={styles.inviteLinkButtonText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.inviteLinkButton, { backgroundColor: theme.error }]}
                    onPress={handleRegenerateInviteLink}
                  >
                    <Icon name="refresh" size={16} color="#FFF" />
                    <Text style={styles.inviteLinkButtonText}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Theme Color Modal */}
      <Modal
        visible={showThemeModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.themeModalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.themeModalTitle, { color: theme.text }]}>Choose Theme Color</Text>
            <View style={styles.colorGrid}>
              {THEME_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    group.settings?.theme_color === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => {
                    handleUpdateSettings('theme_color', color);
                    setShowThemeModal(false);
                  }}
                >
                  {group.settings?.theme_color === color && (
                    <Icon name="checkmark" size={24} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Members Modal */}
      <Modal
        visible={showAddMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddMembersModal(false);
          setSearchQuery('');
          setSearchResults([]);
          setSelectedUsers([]);
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => {
              setShowAddMembersModal(false);
              setSearchQuery('');
              setSearchResults([]);
              setSelectedUsers([]);
            }}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Members</Text>
            <TouchableOpacity
              onPress={handleAddMembers}
              disabled={selectedUsers.length === 0 || addingMembers}
            >
              {addingMembers ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[
                  styles.addMembersButtonText,
                  { color: selectedUsers.length > 0 ? theme.primary : theme.textTertiary }
                ]}>
                  Add ({selectedUsers.length})
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="search" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search users by name or phone..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchUsers}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}>
                  <Icon name="close-circle" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedUsersContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedUsers.map((userId) => {
                  const userInfo = searchResults.find(u => u.id === userId);
                  return (
                    <TouchableOpacity
                      key={userId}
                      style={[styles.selectedUserChip, { backgroundColor: theme.primary + '20' }]}
                      onPress={() => toggleUserSelection(userId)}
                    >
                      <Text style={[styles.selectedUserName, { color: theme.primary }]}>
                        {userInfo?.display_name || 'User'}
                      </Text>
                      <Icon name="close" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <ScrollView style={styles.modalContent}>
            {searchLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : searchQuery.length < 2 ? (
              <View style={styles.emptyState}>
                <Icon name="search" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.text }]}>
                  Search for users to add
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
                  Type at least 2 characters to search
                </Text>
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="person-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.text }]}>
                  No users found
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              searchResults.map((userResult) => (
                <TouchableOpacity
                  key={userResult.id}
                  style={[
                    styles.searchResultItem,
                    { borderBottomColor: theme.border },
                    selectedUsers.includes(userResult.id) && { backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => toggleUserSelection(userResult.id)}
                >
                  <View style={[styles.memberAvatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.memberAvatarText}>
                      {(userResult.display_name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.searchResultInfo}>
                    <Text style={[styles.searchResultName, { color: theme.text }]}>
                      {userResult.display_name}
                    </Text>
                    {userResult.phone_number && (
                      <Text style={[styles.searchResultPhone, { color: theme.textSecondary }]}>
                        {userResult.phone_number}
                      </Text>
                    )}
                  </View>
                  {selectedUsers.includes(userResult.id) ? (
                    <Icon name="checkmark-circle" size={24} color={theme.primary} />
                  ) : (
                    <Icon name="add-circle-outline" size={24} color={theme.textSecondary} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const getRoleDescription = (role: GroupRole): string => {
  const descriptions: Record<GroupRole, string> = {
    FOUNDER: 'Has all permissions',
    ACCOUNTANT: 'Manages finances and verification fees',
    MODERATOR: 'Upholds ethics and moderation',
    RECRUITER: 'Vets who gets into community',
    SUPPORT: 'Helps members with challenges',
    CHEERLEADER: 'Keeps community active and engaged',
    MEMBER: 'Regular group member',
  };
  return descriptions[role] || '';
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
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
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: '#FFF',
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 8,
  },
  roleContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberCount: {
    fontSize: 14,
  },
  memberPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  eventDate: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventDay: {
    fontSize: 18,
    fontWeight: '700',
  },
  eventMonth: {
    fontSize: 11,
    fontWeight: '500',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 12,
    marginTop: 2,
  },
  attendeesCount: {
    fontSize: 12,
  },
  addButton: {
    marginRight: 8,
  },
  emptyText: {
    fontSize: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dangerRowLast: {
    borderTopWidth: 1,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  removeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  roleModalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  roleModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  roleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  roleOptionInfo: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  roleOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Events modal
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  eventCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  eventCardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventCardTime: {
    fontSize: 13,
    marginTop: 4,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  eventLocationText: {
    fontSize: 12,
  },
  eventDescription: {
    fontSize: 14,
    marginTop: 12,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  attendButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  attendButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  attendeesLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },

  // Create event form
  formGroup: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dateText: {
    fontSize: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },
  timeButton: {
    flex: 0.6,
  },
  dateTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
  },
  cancelText: {
    fontSize: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Settings modal
  settingsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: '80%',
  },
  inviteLinkSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  inviteLinkLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  inviteLinkText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  inviteLinkActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  inviteLinkButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Theme modal
  themeModalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  themeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },

  // Add Members Modal styles
  addMembersButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  selectedUsersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  selectedUserName: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultPhone: {
    fontSize: 13,
    marginTop: 2,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  pickerDoneButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  pickerDoneButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupInfoScreen;
