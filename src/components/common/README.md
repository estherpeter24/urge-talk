# Reusable Components Library

This directory contains a comprehensive collection of reusable React Native components for the URGE chat application. These components are designed to be flexible, themeable, and TypeScript-safe.

## Components

### 1. Avatar
Display user profile pictures with fallback to initials, online status, and typing indicators.

```tsx
import { Avatar } from '@/components/common';

<Avatar
  source={{ uri: 'https://...' }}
  name="John Doe"
  size={50}
  showOnlineStatus
  isOnline
  shape="circle"
/>
```

**Props:**
- `source?: ImageSourcePropType | string` - Image source
- `name?: string` - Name for fallback initials
- `size?: number` - Avatar size (default: 50)
- `showOnlineStatus?: boolean` - Show online indicator
- `isOnline?: boolean` - Online status
- `showTypingIndicator?: boolean` - Show typing indicator
- `shape?: 'circle' | 'rounded' | 'square'` - Avatar shape
- `backgroundColor?: string` - Background color
- `textColor?: string` - Text color for initials

---

### 2. Badge
Display notification badges with count.

```tsx
import { Badge } from '@/components/common';

<Badge count={5} size="medium" />
```

**Props:**
- `count: number` - Badge count
- `maxCount?: number` - Maximum count before showing "+" (default: 99)
- `size?: 'small' | 'medium' | 'large'` - Badge size
- `color?: string` - Background color
- `textColor?: string` - Text color
- `showZero?: boolean` - Show badge when count is 0

---

### 3. ChatListItem
Complete chat item with avatar, name, message preview, timestamp, and unread badge.

```tsx
import { ChatListItem } from '@/components/common';

<ChatListItem
  avatar="https://..."
  name="John Doe"
  lastMessage="Hey, how are you?"
  timestamp={new Date()}
  unreadCount={3}
  isOnline
  onPress={() => {}}
/>
```

**Props:**
- `avatar?: ImageSourcePropType | string` - Avatar image
- `name: string` - Contact name
- `lastMessage?: string` - Preview of last message
- `timestamp?: string | Date` - Message timestamp
- `unreadCount?: number` - Unread message count
- `isTyping?: boolean` - Show typing indicator
- `isOnline?: boolean` - Online status
- `showOnlineStatus?: boolean` - Display online indicator
- `isSelected?: boolean` - Selection state
- `onPress?: () => void` - Press handler
- `onLongPress?: () => void` - Long press handler

---

### 4. EmptyState
Display empty state screens with icon, text, and optional action button.

```tsx
import { EmptyState } from '@/components/common';

<EmptyState
  icon="chatbubbles-outline"
  title="No conversations yet"
  subtitle="Start a new chat to begin messaging"
  actionButton={{
    label: "New Chat",
    onPress: () => {},
    variant: "primary"
  }}
/>
```

**Props:**
- `icon?: string` - Icon name (Ionicons)
- `iconSize?: number` - Icon size (default: 80)
- `title: string` - Main title
- `subtitle?: string` - Subtitle text
- `actionButton?: { label, onPress, variant }` - Optional action button

---

### 5. FloatingActionButton (FAB)
Floating action button for primary actions.

```tsx
import { FloatingActionButton } from '@/components/common';

<FloatingActionButton
  icon="add"
  onPress={() => {}}
  position="bottom-right"
  size="large"
/>
```

**Props:**
- `icon?: string` - Icon name (default: 'add')
- `onPress: () => void` - Press handler
- `size?: 'small' | 'medium' | 'large'` - Button size
- `position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`
- `backgroundColor?: string` - Background color
- `iconColor?: string` - Icon color
- `disabled?: boolean` - Disabled state

---

### 6. GradientScreenContainer
Container with gradient background, keyboard avoidance, and scrolling support.

```tsx
import { GradientScreenContainer } from '@/components/common';

<GradientScreenContainer
  scrollable
  showKeyboardAvoidance
>
  {/* Your content */}
</GradientScreenContainer>
```

**Props:**
- `children: React.ReactNode` - Content
- `scrollable?: boolean` - Enable scrolling (default: true)
- `showKeyboardAvoidance?: boolean` - Enable keyboard avoidance (default: true)
- `contentContainerStyle?: ViewStyle` - Content container style
- `showsVerticalScrollIndicator?: boolean` - Show scroll indicator
- `keyboardShouldPersistTaps?: 'always' | 'never' | 'handled'`

---

### 7. LoadingSpinner
Loading indicator with optional message and overlay.

```tsx
import { LoadingSpinner } from '@/components/common';

<LoadingSpinner
  size="large"
  message="Loading..."
  fullScreen
  overlay
/>
```

**Props:**
- `size?: 'small' | 'large'` - Spinner size
- `color?: string` - Spinner color
- `fullScreen?: boolean` - Full screen mode
- `message?: string` - Loading message
- `overlay?: boolean` - Show overlay

---

### 8. ScreenHeader
Standard screen header with back button and optional right component.

```tsx
import { ScreenHeader } from '@/components/common';

<ScreenHeader
  title="Settings"
  showBackButton
  rightComponent={<Icon name="more" />}
/>
```

**Props:**
- `title: string` - Header title
- `showBackButton?: boolean` - Show back button (default: true)
- `onBackPress?: () => void` - Custom back handler
- `rightComponent?: React.ReactNode` - Right side component
- `backgroundColor?: string` - Background color
- `centerTitle?: boolean` - Center title (default: true)

---

### 9. SearchBar
Search input with clear button.

```tsx
import { SearchBar } from '@/components/common';

<SearchBar
  value={searchQuery}
  onChangeText={setSearchQuery}
  placeholder="Search conversations..."
  autoFocus
/>
```

**Props:**
- `value: string` - Search value
- `onChangeText: (text: string) => void` - Change handler
- `placeholder?: string` - Placeholder text
- `autoFocus?: boolean` - Auto focus
- `onClear?: () => void` - Clear handler
- `showSearchIcon?: boolean` - Show search icon (default: true)

---

### 10. SettingsRow
Settings menu item with icon, title, description, and chevron.

```tsx
import { SettingsRow } from '@/components/common';

<SettingsRow
  icon="person-outline"
  title="Edit Profile"
  description="Update your profile information"
  onPress={() => {}}
/>
```

**Props:**
- `icon?: string` - Icon name
- `iconColor?: string` - Icon color
- `title: string` - Row title
- `description?: string` - Row description
- `showArrow?: boolean` - Show chevron (default: true)
- `rightComponent?: React.ReactNode` - Custom right component
- `onPress?: () => void` - Press handler
- `disabled?: boolean` - Disabled state

---

### 11. SettingsToggleRow
Settings row with toggle switch.

```tsx
import { SettingsToggleRow } from '@/components/common';

<SettingsToggleRow
  icon="moon-outline"
  title="Dark Mode"
  description="Enable dark theme"
  value={isDark}
  onToggle={toggleTheme}
/>
```

**Props:**
- `icon?: string` - Icon name
- `iconColor?: string` - Icon color
- `title: string` - Row title
- `description?: string` - Row description
- `value: boolean` - Toggle value
- `onToggle: (value: boolean) => void` - Toggle handler
- `disabled?: boolean` - Disabled state

---

## Custom Hooks

### useFadeSlideAnimation
Animated fade and slide effect for screen transitions.

```tsx
import { useFadeSlideAnimation } from '@/hooks';

const { fadeAnim, slideAnim } = useFadeSlideAnimation({
  duration: 700,
  tension: 35,
  friction: 7
});

<Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
  {/* Content */}
</Animated.View>
```

---

### useSearchFilter
Filter data based on search query.

```tsx
import { useSearchFilter } from '@/hooks';

const { searchQuery, setSearchQuery, filteredData } = useSearchFilter({
  data: users,
  searchKeys: ['name', 'email']
});
```

---

### useDebounce
Debounce a value to avoid excessive updates.

```tsx
import { useDebounce } from '@/hooks';

const debouncedSearch = useDebounce(searchQuery, 500);
```

---

## Utility Functions

### Formatters
```tsx
import {
  formatChatTimestamp,
  formatRelativeTime,
  formatPhoneNumber,
  formatFileSize
} from '@/utils';

formatChatTimestamp(new Date()); // "2m ago"
formatRelativeTime(new Date()); // "2 minutes ago"
formatPhoneNumber("1234567890"); // "(123) 456-7890"
formatFileSize(1024000); // "1 MB"
```

### Validators
```tsx
import {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  getPasswordStrength
} from '@/utils';

validateEmail("user@example.com"); // true
validatePhoneNumber("1234567890"); // true
const { isValid, errors } = validatePassword("Pass123!");
const strength = getPasswordStrength("Pass123!"); // "medium"
```

---

## Usage Tips

1. **Import from index**: Import all components from the common index file:
   ```tsx
   import { Avatar, Badge, SearchBar } from '@/components/common';
   ```

2. **Theme Integration**: All components automatically use the theme from `ThemeContext`

3. **TypeScript Support**: All components have full TypeScript type definitions

4. **Customization**: Use style props to customize appearance while maintaining consistency

5. **Accessibility**: Components include proper accessibility props where applicable

---

## Migration Guide

To replace existing code with reusable components:

### Before:
```tsx
<View style={[styles.searchBox, { backgroundColor: theme.surfaceElevated }]}>
  <Icon name="search" size={20} color={theme.textSecondary} />
  <TextInput
    value={search}
    onChangeText={setSearch}
    placeholder="Search..."
  />
  {search && <TouchableOpacity onPress={() => setSearch('')}>...</TouchableOpacity>}
</View>
```

### After:
```tsx
<SearchBar value={search} onChangeText={setSearch} placeholder="Search..." />
```

---

## Component Checklist

✅ Avatar
✅ Badge
✅ Button (Already exists)
✅ ChatListItem
✅ CustomModal (Already exists)
✅ EmptyState
✅ FloatingActionButton
✅ GradientScreenContainer
✅ Input (Already exists)
✅ LoadingSpinner
✅ ScreenHeader
✅ SearchBar
✅ SettingsRow
✅ SettingsToggleRow

---

## Contributing

When adding new components:
1. Follow the existing TypeScript patterns
2. Support theming via ThemeContext
3. Include comprehensive prop types
4. Add to the index.ts export
5. Document in this README
