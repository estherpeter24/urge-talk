import React from 'react';
import { View, Text, Switch, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';

interface SettingsToggleRowProps {
  icon?: string;
  iconColor?: string;
  title: string;
  description?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

const SettingsToggleRow: React.FC<SettingsToggleRowProps> = ({
  icon,
  iconColor,
  title,
  description,
  value,
  onToggle,
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();

  return (
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
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary + '80' }}
        thumbColor={value ? theme.primary : theme.textSecondary}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
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
    marginRight: Theme.spacing.md,
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
});

export default SettingsToggleRow;
