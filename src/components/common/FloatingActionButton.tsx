import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';

interface FloatingActionButtonProps {
  icon?: string;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  backgroundColor?: string;
  iconColor?: string;
  iconSize?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon = 'add',
  onPress,
  size = 'large',
  position = 'bottom-right',
  backgroundColor,
  iconColor = '#FFFFFF',
  iconSize,
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const sizeMap = {
    small: { width: 48, height: 48, iconSize: 20 },
    medium: { width: 56, height: 56, iconSize: 24 },
    large: { width: 64, height: 64, iconSize: 28 },
  };

  const positionMap: Record<string, ViewStyle> = {
    'bottom-right': { bottom: Theme.spacing.lg, right: Theme.spacing.lg },
    'bottom-left': { bottom: Theme.spacing.lg, left: Theme.spacing.lg },
    'top-right': { top: Theme.spacing.lg, right: Theme.spacing.lg },
    'top-left': { top: Theme.spacing.lg, left: Theme.spacing.lg },
  };

  const fabSize = sizeMap[size];
  const fabPosition = positionMap[position];

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          width: fabSize.width,
          height: fabSize.height,
          borderRadius: fabSize.width / 2,
          backgroundColor: backgroundColor || theme.primary,
        },
        fabPosition,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Icon
        name={icon}
        size={iconSize || fabSize.iconSize}
        color={iconColor}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default FloatingActionButton;
