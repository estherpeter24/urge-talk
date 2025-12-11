import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { ChatStackParamList, Conversation, ConversationType, SocketEvent, Message } from '../../types';
import { Colors } from '../../constants/colors';
import { conversationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { socketService } from '../../services/socket/socketService';

type ChatListNavigationProp = NativeStackNavigationProp<ChatStackParamList, 'ChatList'>;
type FilterType = 'All' | 'Unread' | 'Favourite';

// Helper function to get message preview icon and text for WhatsApp-like display
const getMessagePreview = (message: any): { icon?: string; text: string } => {
  if (!message) return { text: 'No messages yet' };

  const messageType = message.messageType || message.type;
  const content = message.content || '';

  // Handle different message types with Ionicons
  switch (messageType) {
    case 'IMAGE':
      return { icon: 'image-outline', text: 'Photo' };
    case 'VIDEO':
      return { icon: 'videocam-outline', text: 'Video' };
    case 'AUDIO':
      return { icon: 'mic-outline', text: 'Audio' };
    case 'DOCUMENT':
      try {
        const docData = typeof content === 'object' ? content : JSON.parse(content);
        return { icon: 'document-outline', text: docData.name || 'Document' };
      } catch {
        return { icon: 'document-outline', text: 'Document' };
      }
    case 'LOCATION':
      return { icon: 'location-outline', text: 'Location' };
    case 'CONTACT':
      try {
        const contactData = typeof content === 'object' ? content : JSON.parse(content);
        return { icon: 'person-outline', text: contactData.name || 'Contact' };
      } catch {
        return { icon: 'person-outline', text: 'Contact' };
      }
    case 'TEXT':
    default:
      return { text: content || 'Message' };
  }
};

const ChatListScreen = () => {
  const navigation = useNavigation<ChatListNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useModal();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load conversations from API
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await conversationService.getConversations(50, 0);

      if (response.success && response.data) {
        setConversations(response.data.conversations || []);
      } else {
        showError('Error', response.message || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      showError('Error', 'Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  // Load conversations on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  // Listen for new messages via socket to update conversation list in real-time
  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      console.log('[ChatListScreen] Received new message via socket:', message);

      // Get conversation ID from the message
      const conversationId = message.conversationId || message.conversation_id;
      if (!conversationId) return;

      setConversations(prevConversations => {
        // Find the conversation this message belongs to
        const existingConvIndex = prevConversations.findIndex(c => c.id === conversationId);

        if (existingConvIndex >= 0) {
          // Update existing conversation
          const updatedConversations = [...prevConversations];
          const conv = { ...updatedConversations[existingConvIndex] };

          // Update last message
          conv.lastMessage = {
            id: message.id,
            content: message.content,
            messageType: message.messageType || message.message_type || 'TEXT',
            createdAt: message.createdAt || message.created_at || new Date().toISOString(),
            senderId: message.senderId || message.sender_id,
          };

          // Increment unread count if message is from another user
          const currentUserId = user?.id;
          const senderId = message.senderId || message.sender_id;
          if (currentUserId && senderId !== currentUserId) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }

          // Remove from current position
          updatedConversations.splice(existingConvIndex, 1);
          // Add to top of list (most recent)
          updatedConversations.unshift(conv);

          return updatedConversations;
        } else {
          // New conversation - reload the list to get full details
          loadConversations();
          return prevConversations;
        }
      });
    };

    // Subscribe to message:received events
    socketService.addEventListener(SocketEvent.MESSAGE_RECEIVED, handleNewMessage);

    // Cleanup on unmount
    return () => {
      socketService.removeEventListener(SocketEvent.MESSAGE_RECEIVED, handleNewMessage);
    };
  }, [user?.id]);

  // Filter conversations based on active filter and search query
  const filteredConversations = conversations.filter((conv) => {
    // Apply search filter
    if (searchQuery) {
      const matchesSearch =
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase());
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
    setSelectedChats((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );
  };

  const handleArchiveSelected = async () => {
    if (selectedChats.length === 0) return;

    try {
      // Archive all selected conversations
      await Promise.all(
        selectedChats.map((chatId) => conversationService.archiveConversation(chatId))
      );

      // Remove archived chats from the list
      setConversations((prev) =>
        prev.filter((conv) => !selectedChats.includes(conv.id))
      );

      showSuccess('Success', `${selectedChats.length} conversation(s) archived`);
      setIsSelectionMode(false);
      setSelectedChats([]);
    } catch (error) {
      console.error('Failed to archive conversations:', error);
      showError('Error', 'Failed to archive conversations. Please try again.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedChats.length === 0) return;

    const chatsToDelete = [...selectedChats];
    const count = chatsToDelete.length;

    showConfirm(
      'Delete Conversations',
      `Are you sure you want to delete ${count} conversation(s)? This action cannot be undone.`,
      async () => {
        // Immediately update UI
        setConversations((prev) =>
          prev.filter((conv) => !chatsToDelete.includes(conv.id))
        );
        setIsSelectionMode(false);
        setSelectedChats([]);

        try {
          // Delete all selected conversations from API
          const results = await Promise.all(
            chatsToDelete.map(async (chatId) => {
              console.log('Deleting conversation:', chatId);
              const response = await conversationService.deleteConversation(chatId);
              console.log('Delete response:', response);
              return response;
            })
          );

          // Check if any deletions failed
          const failed = results.filter((r) => !r.success);
          if (failed.length > 0) {
            console.error('Some deletions failed:', failed);
            showError('Warning', `${failed.length} conversation(s) failed to delete.`);
            // Reload to restore failed ones
            loadConversations();
          } else {
            showSuccess('Success', `${count} conversation(s) deleted`);
          }
        } catch (error) {
          console.error('Failed to delete conversations:', error);
          showError('Error', 'Failed to delete conversations. Please refresh.');
          // Reload conversations to restore state
          loadConversations();
        }
      }
    );
  };

  const getConversationDisplayInfo = (conversation: Conversation) => {
    if (conversation.type === ConversationType.DIRECT) {
      // For direct conversations, show the other participant's info
      // Handle case where user is not yet loaded
      const currentUserId = user?.id;
      const otherParticipant = currentUserId
        ? conversation.participants?.find(p => p.id !== currentUserId)
        : conversation.participants?.[0];
      return {
        name: otherParticipant?.display_name || conversation.name || 'Unknown',
        avatar: otherParticipant?.avatar_url,
        phone: otherParticipant?.phone_number,
      };
    } else {
      // For group conversations, use conversation name and avatar
      return {
        name: conversation.name || 'Group',
        avatar: conversation.avatar,
        phone: undefined,
      };
    }
  };

  const formatTime = (date: string | Date | undefined): string => {
    if (!date) return '';

    // Parse date as UTC if it doesn't have timezone info
    let messageDate: Date;
    if (typeof date === 'string') {
      // If the string doesn't end with Z or timezone offset, treat it as UTC
      if (!date.endsWith('Z') && !date.match(/[+-]\d{2}:\d{2}$/)) {
        messageDate = new Date(date + 'Z');
      } else {
        messageDate = new Date(date);
      }
    } else {
      messageDate = date;
    }

    // Handle invalid date
    if (isNaN(messageDate.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return messageDate.toLocaleDateString();
  };

  const renderChatItem = ({ item }: { item: Conversation }) => {
    const isSelected = selectedChats.includes(item.id);
    const displayInfo = getConversationDisplayInfo(item);

    return (
      <TouchableOpacity
        style={[styles(theme).chatItem, isSelected && styles(theme).selectedChatItem]}
        onPress={() => {
          if (isSelectionMode) {
            toggleChatSelection(item.id);
          } else {
            // Navigate to GroupChat for group conversations, ChatRoom for direct
            if (item.type === ConversationType.GROUP) {
              navigation.navigate('GroupChat', {
                groupId: item.id,
              });
            } else {
              navigation.navigate('ChatRoom', {
                conversationId: item.id,
                recipientName: displayInfo.name,
                recipientPhone: displayInfo.phone,
              });
            }
          }
        }}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedChats([item.id]);
          }
        }}
        activeOpacity={0.7}
      >
        {isSelectionMode && (
          <View style={styles(theme).selectionCheckbox}>
            <Icon
              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isSelected ? theme.primary : theme.textSecondary}
            />
          </View>
        )}

        <View style={styles(theme).avatarContainer}>
          {displayInfo.avatar ? (
            <Image source={{ uri: displayInfo.avatar }} style={styles(theme).avatar} />
          ) : (
            <View style={[
              styles(theme).avatar,
              styles(theme).avatarPlaceholder,
              item.type === ConversationType.GROUP && { backgroundColor: theme.primary }
            ]}>
              <Icon
                name={item.type === ConversationType.GROUP ? "people" : "person"}
                size={24}
                color={item.type === ConversationType.GROUP ? "#FFFFFF" : theme.textSecondary}
              />
            </View>
          )}
          {item.isTyping && (
            <View style={styles(theme).typingIndicator}>
              <Text style={styles(theme).typingText}>typing...</Text>
            </View>
          )}
        </View>

        <View style={styles(theme).chatContent}>
          <View style={styles(theme).chatHeader}>
            <Text style={styles(theme).chatName} numberOfLines={1}>
              {displayInfo.name}
            </Text>
            {item.lastMessage && (
              <Text style={styles(theme).chatTime}>
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>

          <View style={styles(theme).chatFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {(() => {
                const preview = getMessagePreview(item.lastMessage);
                return (
                  <>
                    {preview.icon && (
                      <Icon
                        name={preview.icon}
                        size={16}
                        color={theme.textSecondary}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text style={styles(theme).lastMessage} numberOfLines={1}>
                      {preview.text}
                    </Text>
                  </>
                );
              })()}
            </View>
            {item.unreadCount > 0 && (
              <View style={styles(theme).unreadBadge}>
                <Text style={styles(theme).unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterTab = (filter: FilterType) => {
    const isActive = activeFilter === filter;
    const unreadCount = conversations.filter((c) => c.unreadCount > 0).length;
    const favouriteCount = conversations.filter((c) => c.isFavourite).length;

    return (
      <TouchableOpacity
        key={filter}
        style={[styles(theme).filterTab, isActive && styles(theme).activeFilterTab]}
        onPress={() => setActiveFilter(filter)}
      >
        <Text style={[styles(theme).filterText, isActive && styles(theme).activeFilterText]}>
          {filter}
        </Text>
        {filter === 'Unread' && unreadCount > 0 && (
          <View style={styles(theme).filterBadge}>
            <Text style={styles(theme).filterBadgeText}>{unreadCount}</Text>
          </View>
        )}
        {filter === 'Favourite' && favouriteCount > 0 && (
          <View style={styles(theme).filterBadge}>
            <Text style={styles(theme).filterBadgeText}>{favouriteCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles(theme).container}>
        <View style={styles(theme).loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles(theme).loadingText}>Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles(theme).container}>
      {/* Header */}
      <View style={styles(theme).header}>
        <Text style={styles(theme).headerTitle}>Chats</Text>
        <View style={styles(theme).headerActions}>
          <TouchableOpacity style={styles(theme).headerButton} onPress={() => {}}>
            <Icon name="camera-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles(theme).headerButton}
            onPress={() => navigation.navigate('NewChat')}
          >
            <Icon name="create-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles(theme).searchContainer}>
        <Icon name="search" size={20} color={theme.textSecondary} style={styles(theme).searchIcon} />
        <TextInput
          style={styles(theme).searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearching(true)}
          onBlur={() => setIsSearching(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles(theme).filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles(theme).filterContainer}
          contentContainerStyle={styles(theme).filterContent}
        >
          {(['All', 'Unread', 'Favourite'] as FilterType[]).map(renderFilterTab)}
          <TouchableOpacity
            style={styles(theme).archivedTab}
            onPress={() => navigation.navigate('ArchivedChats')}
          >
            <Icon name="archive-outline" size={16} color={theme.text} />
            <Text style={styles(theme).archivedTabText}>Archived</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Selection Mode Toolbar */}
      {isSelectionMode && (
        <View style={styles(theme).selectionToolbar}>
          <TouchableOpacity
            onPress={toggleSelectionMode}
            style={styles(theme).cancelButton}
          >
            <Text style={styles(theme).cancelSelection}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles(theme).selectionCount}>
            {selectedChats.length} selected
          </Text>
          <View style={styles(theme).selectionActions}>
            <TouchableOpacity
              style={styles(theme).selectionAction}
              onPress={handleArchiveSelected}
            >
              <Icon name="archive-outline" size={22} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles(theme).selectionAction}
              onPress={handleDeleteSelected}
            >
              <Icon name="trash-outline" size={22} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Chat List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles(theme).listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles(theme).emptyContainer}>
            <Icon name="chatbubbles-outline" size={64} color={theme.textSecondary} />
            <Text style={styles(theme).emptyText}>No conversations yet</Text>
            <Text style={styles(theme).emptySubtext}>
              Start a new chat to begin messaging
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textSecondary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 16,
    },
    headerButton: {
      padding: 4,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      height: 44,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
    },
    filterWrapper: {
      paddingBottom: 12,
      borderBottomWidth: 0,
    },
    filterContainer: {
      maxHeight: 44,
    },
    filterContent: {
      paddingHorizontal: 16,
      gap: 10,
      alignItems: 'center',
    },
    filterTab: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      backgroundColor: theme.surface,
      gap: 6,
      borderWidth: 1,
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    activeFilterTab: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    activeFilterText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    filterBadge: {
      backgroundColor: theme.error,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    filterBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: 'bold',
    },
    archivedTab: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 25,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    archivedTabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    selectionToolbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginTop: 4,
    },
    cancelButton: {
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    cancelSelection: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.primary,
    },
    selectionCount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    selectionActions: {
      flexDirection: 'row',
      gap: 16,
    },
    selectionAction: {
      padding: 4,
    },
    listContent: {
      paddingBottom: 16,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
    },
    selectedChatItem: {
      backgroundColor: theme.surface,
    },
    selectionCheckbox: {
      marginRight: 12,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: 12,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    avatarPlaceholder: {
      backgroundColor: theme.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    typingIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    typingText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '500',
    },
    chatContent: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    chatName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
      marginRight: 8,
    },
    chatTime: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    chatFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    lastMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      flex: 1,
      marginRight: 8,
    },
    unreadBadge: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
    },
    unreadCount: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default ChatListScreen;
