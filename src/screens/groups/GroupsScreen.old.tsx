import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { mockGroupChats, GroupChat, getUserById } from '../../data/mockData';

interface Group {
  id: string;
  name: string;
  members: number;
  lastMessage: string;
  unread: number;
  icon: string;
}

const GroupsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    // Load mock group data
    const formattedGroups: Group[] = mockGroupChats.map((groupChat: GroupChat) => {
      const senderName = getUserById(groupChat.lastMessage.senderId)?.name || 'Unknown';
      return {
        id: groupChat.id,
        name: groupChat.name,
        members: groupChat.participants.length,
        lastMessage: `${senderName}: ${groupChat.lastMessage.text}`,
        unread: groupChat.unreadCount,
        icon: groupChat.icon,
      };
    });
    setGroups(formattedGroups);
  }, []);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateGroup = () => {
    navigation.navigate('Chats', { screen: 'CreateGroup' });
  };

  const handleGroupPress = (group: Group) => {
    navigation.navigate('Chats', {
      screen: 'GroupChat',
      params: { groupId: group.id }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Groups</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateGroup}
            activeOpacity={0.7}
          >
            <Icon name="add-circle" size={32} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
            ]}
          >
            <Icon name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search groups..."
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
        </View>

        {/* Groups List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="people-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.text }]}>
                {searchQuery ? 'No groups found' : 'No groups yet'}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create a new group to get started'}
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.groupsList,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {filteredGroups.map((group, index) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.groupItem,
                    index === filteredGroups.length - 1 && styles.groupItemLast,
                    {
                      borderBottomColor: theme.border,
                    },
                  ]}
                  onPress={() => handleGroupPress(group)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.groupIconContainer,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Icon name={group.icon} size={24} color="#FFFFFF" />
                  </View>

                  <View style={styles.groupInfo}>
                    <View style={styles.groupHeader}>
                      <Text style={[styles.groupName, { color: theme.text }]}>
                        {group.name}
                      </Text>
                      {group.unread > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: theme.error }]}>
                          <Text style={styles.unreadText}>{group.unread}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.groupMembers, { color: theme.textSecondary }]}>
                      {group.members} members
                    </Text>
                    <Text
                      style={[styles.lastMessage, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {group.lastMessage}
                    </Text>
                  </View>

                  <Icon name="chevron-forward" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={handleCreateGroup}
          activeOpacity={0.8}
        >
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  createButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  groupsList: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  groupItemLast: {
    borderBottomWidth: 0,
  },
  groupIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  groupMembers: {
    fontSize: 13,
    marginBottom: 4,
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    fontWeight: '400',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default GroupsScreen;
