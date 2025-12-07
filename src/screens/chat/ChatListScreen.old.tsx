import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { ChatStackParamList, Conversation } from '../../types';
import { Theme } from '../../constants/theme';
import { getAllChats, getUserById, Chat, GroupChat, formatTimestamp } from '../../data/mockData';

type ChatListNavigationProp = NativeStackNavigationProp<ChatStackParamList, 'ChatList'>;

type FilterType = 'All' | 'Unread' | 'Favourite';

const ChatListScreen = () => {
  const navigation = useNavigation<ChatListNavigationProp>();
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [archivedCount, setArchivedCount] = useState(3);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);

  // Load mock data on mount
  useEffect(() => {
    const mockChats = getAllChats();

    // Convert mock chats to Conversation format
    const formattedConversations: Conversation[] = mockChats.map((chat) => {
      if (chat.type === 'group') {
        const groupChat = chat as GroupChat;
        return {
          id: groupChat.id,
          name: groupChat.name,
          avatar: undefined,
          lastMessage: {
            content: groupChat.lastMessage.text,
            createdAt: groupChat.lastMessage.timestamp,
          },
          unreadCount: groupChat.unreadCount,
          isTyping: false,
        };
      } else {
        // One-on-one chat
        const otherUserId = chat.participants.find(id => id !== 'current');
        const otherUser = otherUserId ? getUserById(otherUserId) : undefined;

        return {
          id: chat.id,
          name: otherUser?.name || 'Unknown',
          avatar: otherUser?.avatar,
          lastMessage: {
            content: chat.lastMessage.text,
            createdAt: chat.lastMessage.timestamp,
          },
          unreadCount: chat.unreadCount,
          isTyping: false,
        };
      }
    });

    setConversations(formattedConversations);
  }, []);

  // Filter conversations based on active filter and search query
  const filteredConversations = conversations.filter((conv) => {
    // Apply search filter
    if (searchQuery) {
      const matchesSearch =
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Apply tab filter
    if (activeFilter === 'Unread') {
      return conv.unreadCount > 0;
    } else if (activeFilter === 'Favourite') {
      return conv.isFavourite === true;
    }

    return true;
  });

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedChats([]);
  };

  const toggleChatSelection = (chatId: string) => {
    if (selectedChats.includes(chatId)) {
      setSelectedChats(selectedChats.filter(id => id !== chatId));
    } else {
      setSelectedChats([...selectedChats, chatId]);
    }
  };

  const handleDelete = () => {
    // Delete selected chats
    setConversations(conversations.filter(conv => !selectedChats.includes(conv.id)));
    setSelectedChats([]);
    setIsSelectionMode(false);
  };

  const handleArchive = () => {
    // Archive selected chats
    setConversations(conversations.filter(conv => !selectedChats.includes(conv.id)));
    setArchivedCount(archivedCount + selectedChats.length);
    setSelectedChats([]);
    setIsSelectionMode(false);
  };

  const handleReadAll = () => {
    // Mark selected chats as read
    setConversations(conversations.map(conv =>
      selectedChats.includes(conv.id) ? { ...conv, unreadCount: 0 } : conv
    ));
    setSelectedChats([]);
    setIsSelectionMode(false);
  };

  const renderChatItem = ({ item }: { item: Conversation }) => {
    const isSelected = selectedChats.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          {
            backgroundColor: isSelected ? theme.primary + '20' : theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleChatSelection(item.id);
          } else {
            navigation.navigate('ChatRoom', {
              conversationId: item.id,
              recipientName: item.name || 'Unknown',
            });
          }
        }}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedChats([item.id]);
          }
        }}
      >
        {isSelectionMode && (
          <View style={styles.checkboxContainer}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? theme.primary : 'transparent',
                  borderColor: isSelected ? theme.primary : theme.textSecondary,
                },
              ]}
            >
              {isSelected && <Icon name="checkmark" size={18} color="#FFFFFF" />}
            </View>
          </View>
        )}

        <View style={styles.avatar}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {item.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        {item.isTyping && (
          <View
            style={[
              styles.typingIndicator,
              {
                backgroundColor: theme.secondary,
                borderColor: theme.surface,
              },
            ]}
          />
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>
            {item.name || 'Unknown'}
          </Text>
          {item.lastMessage && (
            <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
              {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>

        <View style={styles.chatFooter}>
          <Text
            style={[styles.lastMessage, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.isTyping
              ? 'typing...'
              : item.lastMessage?.content || 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.secondary }]}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View style={styles.headerTop}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity
                style={styles.backButton}
                onPress={toggleSelectionMode}
              >
                <Icon name="close" size={24} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                {selectedChats.length} selected
              </Text>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleReadAll}
                  disabled={selectedChats.length === 0}
                >
                  <Icon
                    name="checkmark-done-outline"
                    size={24}
                    color={selectedChats.length > 0 ? theme.text : theme.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleArchive}
                  disabled={selectedChats.length === 0}
                >
                  <Icon
                    name="archive-outline"
                    size={24}
                    color={selectedChats.length > 0 ? theme.text : theme.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleDelete}
                  disabled={selectedChats.length === 0}
                >
                  <Icon
                    name="trash-outline"
                    size={24}
                    color={selectedChats.length > 0 ? theme.error : theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : isSearching ? (
            <View style={styles.searchContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
              >
                <Icon name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Icon name="close-circle" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <Text style={[styles.headerTitle, { color: theme.text }]}>URGE</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setIsSearching(true)}
                >
                  <Icon name="search-outline" size={24} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={toggleSelectionMode}
                >
                  <Icon name="ellipsis-vertical" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Filter Tabs */}
        {!isSearching && !isSelectionMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {(['All', 'Unread', 'Favourite'] as FilterType[]).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  activeFilter === filter && { backgroundColor: theme.primary },
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: activeFilter === filter ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <FlatList
        data={filteredConversations}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          archivedCount > 0 ? (
            <TouchableOpacity
              style={[styles.archivedItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
              onPress={() => navigation.navigate('ArchivedChats')}
            >
              <Icon name="archive-outline" size={24} color={theme.primary} style={styles.archivedIcon} />
              <Text style={[styles.archivedText, { color: theme.text }]}>Archived</Text>
              <Text style={[styles.archivedCount, { color: theme.textSecondary }]}>{archivedCount}</Text>
              <Icon name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={80} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {searchQuery ? 'Try a different search term' : 'Start a new chat to begin messaging'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('NewChat')}
      >
        <Icon name="add" size={Theme.iconSize.lg} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 8,
  },
  filterContainer: {
    marginTop: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  archivedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  archivedIcon: {
    marginRight: 16,
  },
  archivedText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  archivedCount: {
    fontSize: 14,
    marginRight: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  checkboxContainer: {
    justifyContent: 'center',
    alignItems: 'center',
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
  chatItem: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
  },
  avatar: {
    marginRight: Theme.spacing.md,
    position: 'relative',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.xl,
    fontWeight: '600',
  },
  typingIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  chatName: {
    fontSize: Theme.fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  chatTime: {
    fontSize: Theme.fontSize.sm,
    marginLeft: Theme.spacing.sm,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: Theme.fontSize.md,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: Theme.fontSize.xs,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Theme.spacing.xxl * 2,
  },
  emptyText: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '600',
    marginTop: Theme.spacing.lg,
  },
  emptySubtext: {
    fontSize: Theme.fontSize.md,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: Theme.spacing.lg,
    bottom: Theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadow.medium,
  },
});

export default ChatListScreen;
