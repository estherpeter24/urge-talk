import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';

interface SettingsRowProps {
  icon?: string;
  iconColor?: string;
  title: string;
  description?: string;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  iconColor,
  title,
  description,
  showArrow = true,
  rightComponent,
  onPress,
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const content = (
    <View style={[styles.container, { backgroundColor: theme.surface }, style]}>
      {icon && (
        <View style={styles.iconContainer}>
          <Icon name={icon} size={Theme.iconSize.md} color={iconColor || theme.primary} />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        {description && (
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.rightContainer}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Icon name="chevron-forward" size={Theme.iconSize.sm} color={theme.textSecondary} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    minHeight: 60,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.sm,
  },
  iconContainer: {
    marginRight: Theme.spacing.md,
  },
  textContainer: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  title: {
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
    lineHeight: 18,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SettingsRow;
