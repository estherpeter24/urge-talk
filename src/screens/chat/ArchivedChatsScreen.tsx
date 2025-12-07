import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../context/ModalContext';
import { ChatStackParamList, Conversation, ConversationType } from '../../types';
import { Theme } from '../../constants/theme';
import { conversationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type ArchivedChatsNavigationProp = NativeStackNavigationProp<ChatStackParamList, 'ArchivedChats'>;

const ArchivedChatsScreen = () => {
  const navigation = useNavigation<ArchivedChatsNavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showSuccess, showError } = useModal();
  const [archivedChats, setArchivedChats] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadArchivedChats = async () => {
    try {
      setLoading(true);
      const response = await conversationService.getArchivedConversations(50, 0);
      if (response.success && response.data) {
        setArchivedChats(response.data.conversations || []);
      } else {
        showError('Error', response.message || 'Failed to load archived chats');
      }
    } catch (error) {
      console.error('Failed to load archived chats:', error);
      showError('Error', 'Failed to load archived chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArchivedChats();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadArchivedChats();
    }, [])
  );

  const handleUnarchive = async (chatId: string) => {
    try {
      await conversationService.unarchiveConversation(chatId);
      setArchivedChats(archivedChats.filter(chat => chat.id !== chatId));
      showSuccess('Success', 'Conversation unarchived');
    } catch (error) {
      console.error('Failed to unarchive conversation:', error);
      showError('Error', 'Failed to unarchive conversation. Please try again.');
    }
  };

  const getConversationDisplayInfo = (conversation: Conversation) => {
    if (conversation.type === ConversationType.DIRECT) {
      const otherParticipant = conversation.participants?.find(p => p.id !== user?.id);
      return {
        name: otherParticipant?.display_name || 'Unknown',
        avatar: otherParticipant?.avatar_url,
      };
    } else {
      return {
        name: conversation.name || 'Group',
        avatar: conversation.avatar,
      };
    }
  };

  const renderArchivedChat = ({ item }: { item: Conversation }) => {
    const displayInfo = getConversationDisplayInfo(item);

    return (
      <TouchableOpacity
        style={[
          styles.chatItem,
          {
            backgroundColor: theme.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
          },
        ]}
        onPress={() =>
          navigation.navigate('ChatRoom', {
            conversationId: item.id,
            recipientName: displayInfo.name,
          })
        }
      >
        <View style={styles.avatar}>
          {displayInfo.avatar ? (
            <Image source={{ uri: displayInfo.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {displayInfo.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>
              {displayInfo.name}
            </Text>
            {item.lastMessage && (
              <Text style={[styles.chatTime, { color: theme.textSecondary }]}>
                {new Date(item.lastMessage.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.chatFooter}>
            <Text
              style={[styles.lastMessage, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: theme.secondary }]}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.unarchiveButton}
          onPress={() => handleUnarchive(item.id)}
        >
          <Icon name="arrow-undo-outline" size={24} color={theme.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Archived</Text>
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
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Archived</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: theme.surfaceElevated }]}>
        <Icon name="information-circle-outline" size={20} color={theme.textSecondary} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          These chats stay archived when you receive new messages
        </Text>
      </View>

      {/* Archived Chats List */}
      <FlatList
        data={archivedChats}
        renderItem={renderArchivedChat}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="archive-outline" size={80} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No archived chats
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Archived chats will appear here
            </Text>
          </View>
        }
      />
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
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 50,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  listContent: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    alignItems: 'center',
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
  unarchiveButton: {
    padding: 8,
    marginLeft: 8,
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
});

export default ArchivedChatsScreen;
