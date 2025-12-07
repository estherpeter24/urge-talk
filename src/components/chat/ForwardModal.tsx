import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { Conversation } from '../../types';

interface ForwardModalProps {
  visible: boolean;
  availableChats: Conversation[];
  selectedChatIds: string[];
  searchQuery: string;
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onToggleChat: (chatId: string) => void;
  onConfirmForward: () => void;
}

/**
 * ForwardModal - A reusable modal for forwarding messages to other chats
 * Supports search, multi-select, and forwarding to selected chats
 */
const ForwardModal: React.FC<ForwardModalProps> = ({
  visible,
  availableChats,
  selectedChatIds,
  searchQuery,
  onClose,
  onSearchChange,
  onToggleChat,
  onConfirmForward,
}) => {
  const { theme } = useTheme();

  const filteredChats = availableChats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.forwardModalContainer}>
        <View style={[styles.forwardModal, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.forwardHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.forwardCancelButton}>
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.forwardTitle, { color: theme.text }]}>Forward message to...</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search Bar */}
          <View style={[styles.forwardSearchContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            <Icon name="search" size={20} color={theme.textSecondary} style={styles.forwardSearchIcon} />
            <TextInput
              style={[styles.forwardSearchInput, { color: theme.text }]}
              placeholder="Search chats..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
          </View>

          {/* Chat List */}
          <FlatList
            data={filteredChats}
            keyExtractor={item => item.id}
            style={styles.forwardChatList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.forwardChatItem, { borderBottomColor: theme.border }]}
                onPress={() => onToggleChat(item.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.forwardChatAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.forwardChatAvatarText}>
                    {item.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.forwardChatInfo}>
                  <Text style={[styles.forwardChatName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.lastMessage && (
                    <Text style={[styles.forwardChatLastMessage, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.lastMessage.content}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.forwardCheckbox,
                  { borderColor: selectedChatIds.includes(item.id) ? theme.primary : theme.border },
                  selectedChatIds.includes(item.id) && { backgroundColor: theme.primary }
                ]}>
                  {selectedChatIds.includes(item.id) && (
                    <Icon name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.forwardEmptyContainer}>
                <Icon name="chatbubbles-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.forwardEmptyText, { color: theme.textSecondary }]}>
                  {searchQuery ? 'No chats found' : 'No chats available'}
                </Text>
              </View>
            }
          />

          {/* Forward Button */}
          {selectedChatIds.length > 0 && (
            <View style={[styles.forwardButtonContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.forwardButton, { backgroundColor: theme.primary }]}
                onPress={onConfirmForward}
                activeOpacity={0.8}
              >
                <Icon name="arrow-forward" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.forwardButtonText}>
                  Forward to {selectedChatIds.length} {selectedChatIds.length === 1 ? 'chat' : 'chats'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  forwardModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  forwardModal: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  forwardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  forwardCancelButton: {
    padding: 4,
  },
  forwardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  forwardSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  forwardSearchIcon: {
    marginRight: 8,
  },
  forwardSearchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  forwardChatList: {
    flex: 1,
  },
  forwardChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  forwardChatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  forwardChatAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forwardChatInfo: {
    flex: 1,
    marginRight: 12,
  },
  forwardChatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  forwardChatLastMessage: {
    fontSize: 14,
  },
  forwardCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forwardEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  forwardEmptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  forwardButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  forwardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  forwardButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForwardModal;
