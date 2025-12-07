import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle, Modal } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  message?: string;
  overlay?: boolean;
  style?: ViewStyle;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  fullScreen = false,
  message,
  overlay = false,
  style,
}) => {
  const { theme } = useTheme();

  const content = (
    <View style={[fullScreen ? styles.fullScreenContainer : styles.container, style]}>
      {overlay && fullScreen && <View style={styles.overlay} />}
      <View style={[styles.content, fullScreen && styles.contentElevated, { backgroundColor: fullScreen ? theme.surface : 'transparent' }]}>
        <ActivityIndicator size={size} color={color || theme.primary} />
        {message && (
          <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
        )}
      </View>
    </View>
  );

  if (fullScreen && overlay) {
    return (
      <Modal transparent visible animationType="fade">
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
  },
  contentElevated: {
    ...Theme.shadow.medium,
  },
  message: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
