import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  iconSize?: number;
  title: string;
  subtitle?: string;
  actionButton?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'text';
  };
  style?: ViewStyle;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'cloud-offline-outline',
  iconSize = 80,
  title,
  subtitle,
  actionButton,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Icon name={icon} size={iconSize} color={theme.textSecondary} style={styles.icon} />
      <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      )}
      {actionButton && (
        <Button
          title={actionButton.label}
          onPress={actionButton.onPress}
          variant={actionButton.variant || 'primary'}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  icon: {
    marginBottom: Theme.spacing.lg,
    opacity: 0.6,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Theme.spacing.lg,
  },
  button: {
    marginTop: Theme.spacing.md,
    minWidth: 150,
  },
});

export default EmptyState;
