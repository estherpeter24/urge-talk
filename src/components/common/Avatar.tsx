import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';

interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: number;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  showTypingIndicator?: boolean;
  shape?: 'circle' | 'rounded' | 'square';
  style?: ViewStyle;
  backgroundColor?: string;
  textColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 50,
  showOnlineStatus = false,
  isOnline = false,
  showTypingIndicator = false,
  shape = 'circle',
  style,
  backgroundColor,
  textColor,
}) => {
  const { theme } = useTheme();

  // Generate initials from name
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const borderRadiusMap = {
    circle: size / 2,
    rounded: Theme.borderRadius.lg,
    square: 0,
  };

  const avatarStyle: ViewStyle & ImageStyle = {
    width: size,
    height: size,
    borderRadius: borderRadiusMap[shape],
    backgroundColor: backgroundColor || theme.surfaceElevated,
  };

  const statusIndicatorSize = size * 0.25;
  const statusIndicatorStyle: ViewStyle = {
    width: statusIndicatorSize,
    height: statusIndicatorSize,
    borderRadius: statusIndicatorSize / 2,
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: isOnline ? theme.success : theme.textSecondary,
    borderWidth: 2,
    borderColor: theme.background,
  };

  const renderContent = () => {
    // If image source is provided
    if (source) {
      const imageSource = typeof source === 'string' ? { uri: source } : source;
      return (
        <Image
          source={imageSource}
          style={avatarStyle}
          resizeMode="cover"
        />
      );
    }

    // Otherwise show initials
    return (
      <View style={[avatarStyle, styles.initialsContainer, style]}>
        <Text
          style={[
            styles.initialsText,
            {
              color: textColor || theme.text,
              fontSize: size * 0.4,
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {renderContent()}

      {/* Online status indicator */}
      {showOnlineStatus && <View style={statusIndicatorStyle} />}

      {/* Typing indicator */}
      {showTypingIndicator && (
        <View style={[statusIndicatorStyle, { backgroundColor: theme.primary }]}>
          <View style={styles.typingDot} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typingDot: {
    // Placeholder for animated typing indicator
  },
});

export default Avatar;
