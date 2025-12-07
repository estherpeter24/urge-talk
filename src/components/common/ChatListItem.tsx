import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';
import Avatar from './Avatar';
import Badge from './Badge';

interface ChatListItemProps {
  avatar?: ImageSourcePropType | string;
  name: string;
  lastMessage?: string;
  timestamp?: string | Date;
  unreadCount?: number;
  isTyping?: boolean;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  avatar,
  name,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isTyping = false,
  isOnline = false,
  showOnlineStatus = false,
  isSelected = false,
  onPress,
  onLongPress,
  style,
}) => {
  const { theme } = useTheme();

  const formatTimestamp = (time?: string | Date): string => {
    if (!time) return '';

    const date = typeof time === 'string' ? new Date(time) : time;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? theme.primary + '20' : theme.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        style,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Avatar
        source={avatar}
        name={name}
        size={56}
        showOnlineStatus={showOnlineStatus}
        isOnline={isOnline}
        showTypingIndicator={isTyping}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {name}
          </Text>
          {timestamp && (
            <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
              {formatTimestamp(timestamp)}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text
            style={[
              styles.lastMessage,
              { color: isTyping ? theme.primary : theme.textSecondary },
              unreadCount > 0 && styles.unreadMessage,
            ]}
            numberOfLines={1}
          >
            {isTyping ? 'typing...' : lastMessage || 'No messages yet'}
          </Text>
          {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    minHeight: 80,
  },
  content: {
    flex: 1,
    marginLeft: Theme.spacing.md,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  name: {
    flex: 1,
    fontSize: Theme.fontSize.lg,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginRight: Theme.spacing.sm,
  },
  timestamp: {
    fontSize: Theme.fontSize.sm,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    marginRight: Theme.spacing.sm,
  },
  unreadMessage: {
    fontWeight: '600',
  },
});

export default ChatListItem;
