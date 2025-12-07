import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { Message } from '../../types';

interface MessageInfoModalProps {
  visible: boolean;
  message: Message | null;
  recipientName?: string;
  participants?: Array<{ id: string; name: string }>;
  onClose: () => void;
}

/**
 * MessageInfoModal - A reusable modal for displaying message delivery and read receipts
 * Shows when a message was delivered and read by recipients
 */
const MessageInfoModal: React.FC<MessageInfoModalProps> = ({
  visible,
  message,
  recipientName,
  participants,
  onClose,
}) => {
  const { theme } = useTheme();

  if (!message) return null;

  // For group chats, show all participants
  const isGroupChat = participants && participants.length > 0;
  const recipients = isGroupChat
    ? participants.filter(p => p.id !== 'current')
    : recipientName
    ? [{ id: 'recipient', name: recipientName }]
    : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.messageInfoContainer, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.messageInfoHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.messageInfoBackButton}>
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.messageInfoTitle, { color: theme.text }]}>Message info</Text>
        </View>

        {/* Message Content */}
        <ScrollView style={styles.messageInfoContent}>
          {/* Message Bubble */}
          <View style={styles.messageInfoBubbleContainer}>
            <View style={[styles.messageInfoBubble, { backgroundColor: theme.primary }]}>
              <Text style={styles.messageInfoBubbleText}>{message.content}</Text>
              <Text style={styles.messageInfoBubbleTime}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {/* Read By Section */}
          <View style={styles.messageInfoSection}>
            <View style={styles.messageInfoSectionHeader}>
              <Icon name="checkmark-done" size={18} color="#34B7F1" style={{ marginRight: 8 }} />
              <Text style={[styles.messageInfoSectionTitle, { color: theme.textSecondary }]}>Read</Text>
            </View>
            {recipients.slice(0, isGroupChat ? 2 : 1).map((recipient) => (
              <View key={`read-${recipient.id}`} style={[styles.messageInfoItem, { borderBottomColor: theme.border }]}>
                <View style={styles.messageInfoItemLeft}>
                  <View style={[styles.messageInfoAvatar, { backgroundColor: theme.surfaceElevated }]}>
                    <Icon name="person" size={20} color={theme.textSecondary} />
                  </View>
                  <Text style={[styles.messageInfoItemName, { color: theme.text }]}>{recipient.name}</Text>
                </View>
                <Text style={[styles.messageInfoItemTime, { color: theme.textSecondary }]}>
                  {new Date(message.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            ))}
          </View>

          {/* Delivered Section */}
          <View style={styles.messageInfoSection}>
            <View style={styles.messageInfoSectionHeader}>
              <Icon name="checkmark-done-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.messageInfoSectionTitle, { color: theme.textSecondary }]}>Delivered</Text>
            </View>
            {recipients.map((recipient) => (
              <View key={`delivered-${recipient.id}`} style={[styles.messageInfoItem, { borderBottomColor: theme.border }]}>
                <View style={styles.messageInfoItemLeft}>
                  <View style={[styles.messageInfoAvatar, { backgroundColor: theme.surfaceElevated }]}>
                    <Icon name="person" size={20} color={theme.textSecondary} />
                  </View>
                  <Text style={[styles.messageInfoItemName, { color: theme.text }]}>{recipient.name}</Text>
                </View>
                <Text style={[styles.messageInfoItemTime, { color: theme.textSecondary }]}>
                  {new Date(message.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  messageInfoContainer: {
    flex: 1,
  },
  messageInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  messageInfoBackButton: {
    padding: 8,
    marginRight: 12,
  },
  messageInfoTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  messageInfoContent: {
    flex: 1,
  },
  messageInfoBubbleContainer: {
    padding: 16,
    alignItems: 'flex-end',
  },
  messageInfoBubble: {
    maxWidth: '80%',
    borderRadius: 8,
    padding: 12,
  },
  messageInfoBubbleText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageInfoBubbleTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  messageInfoSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  messageInfoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  messageInfoSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  messageInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  messageInfoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageInfoAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageInfoItemName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  messageInfoItemTime: {
    fontSize: 13,
  },
});

export default MessageInfoModal;
