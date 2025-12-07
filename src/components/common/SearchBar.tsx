import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';

interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onClear?: () => void;
  style?: ViewStyle;
  showSearchIcon?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  autoFocus = false,
  onClear,
  style,
  showSearchIcon = true,
  ...textInputProps
}) => {
  const { theme } = useTheme();

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View
      style={[
        styles.searchBox,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {showSearchIcon && (
        <Icon name="search" size={Theme.iconSize.sm} color={theme.textSecondary} style={styles.searchIcon} />
      )}
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        {...textInputProps}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton} activeOpacity={0.7}>
          <Icon name="close-circle" size={Theme.iconSize.sm} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    paddingVertical: Theme.spacing.sm,
  },
  clearButton: {
    padding: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
  },
});

export default SearchBar;
