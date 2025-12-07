import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';

interface BadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  showZero?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  count,
  maxCount = 99,
  size = 'medium',
  color,
  textColor = '#FFFFFF',
  style,
  showZero = false,
}) => {
  const { theme } = useTheme();

  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeMap = {
    small: {
      minWidth: 16,
      height: 16,
      fontSize: 10,
      paddingHorizontal: 4,
    },
    medium: {
      minWidth: 20,
      height: 20,
      fontSize: 11,
      paddingHorizontal: 6,
    },
    large: {
      minWidth: 24,
      height: 24,
      fontSize: 12,
      paddingHorizontal: 8,
    },
  };

  const sizeStyles = sizeMap[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color || theme.secondary,
          minWidth: sizeStyles.minWidth,
          height: sizeStyles.height,
          borderRadius: sizeStyles.height / 2,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            color: textColor,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default Badge;
