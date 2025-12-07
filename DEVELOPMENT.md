# URGE Development Guide

## Getting Started

### Quick Start Commands

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint code
npm run lint
```

## Development Workflow

### 1. Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Production hotfixes

### 2. Commit Convention
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## Code Structure Guidelines

### Component Structure
```typescript
// ComponentName.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ComponentNameProps {
  // Props definition
}

const ComponentName: React.FC<ComponentNameProps> = ({ }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles
  },
});

export default ComponentName;
```

### Screen Structure
```typescript
// ScreenName.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';

const ScreenName = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  // State and effects

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Screen content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenName;
```

### Service Structure
```typescript
// serviceName.ts
import { apiClient } from './client';

class ServiceName {
  async methodName(params: Type): Promise<ReturnType> {
    const response = await apiClient.get('/endpoint');
    if (!response.success || !response.data) {
      throw new Error(response.message);
    }
    return response.data;
  }
}

export const serviceName = new ServiceName();
```

## Implementing New Features

### 1. Create Feature Branch
```bash
git checkout develop
git pull
git checkout -b feature/feature-name
```

### 2. Implement Feature
- Create necessary files in appropriate directories
- Follow existing patterns
- Add TypeScript types
- Implement UI components
- Connect to services
- Add error handling

### 3. Test Feature
- Manual testing on both platforms
- Add unit tests
- Add integration tests if needed

### 4. Create Pull Request
- Push branch to remote
- Create PR to `develop`
- Request code review
- Address feedback

## Testing Guidelines

### Unit Tests
```typescript
// ComponentName.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ComponentName />);
    expect(getByText('Expected Text')).toBeTruthy();
  });
});
```

### Integration Tests
```typescript
// feature.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '@/context/AuthContext';

describe('Authentication Flow', () => {
  it('logs in successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({
        phoneNumber: '+1234567890',
        password: 'password',
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

## Common Tasks

### Adding a New Screen
1. Create screen file in `src/screens/category/`
2. Add route to appropriate navigator
3. Update TypeScript types in `src/types/`
4. Implement screen logic and UI
5. Connect to services if needed

### Adding a New API Endpoint
1. Add endpoint to service in `src/services/api/`
2. Update TypeScript types
3. Add error handling
4. Update API documentation

### Adding a New Component
1. Create component in `src/components/common/` or category
2. Define props interface
3. Implement component logic
4. Add styles
5. Export from index if needed

### Updating Theme
1. Update colors in `src/constants/colors.ts`
2. Update theme values in `src/constants/theme.ts`
3. Test in both light and dark modes

## Debugging

### React Native Debugger
```bash
# Open debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Console Logs
```typescript
// Development only
if (__DEV__) {
  console.log('Debug info:', data);
}
```

### Network Inspection
```typescript
// Enable network inspect in API client
axios.interceptors.request.use(request => {
  if (__DEV__) {
    console.log('Request:', request);
  }
  return request;
});
```

## Performance Optimization

### React.memo for Components
```typescript
import React, { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Component logic
});
```

### useMemo for Expensive Calculations
```typescript
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);
```

### useCallback for Functions
```typescript
const handlePress = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### FlatList Optimization
```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={10}
/>
```

## Common Issues & Solutions

### Metro Bundler Issues
```bash
# Clear cache
npm start -- --reset-cache

# Clean build
cd android && ./gradlew clean && cd ..
cd ios && rm -rf Pods && pod install && cd ..
```

### Dependency Issues
```bash
# Remove and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### Native Module Issues
```bash
# iOS
cd ios && pod install && cd ..

# Android - Clean and rebuild
cd android && ./gradlew clean && cd ..
```

## Code Quality

### ESLint
```bash
npm run lint
npm run lint:fix
```

### Prettier
```bash
npm run format
```

### TypeScript
```bash
npx tsc --noEmit
```

## Documentation

### Inline Documentation
```typescript
/**
 * Sends a message to a conversation
 * @param conversationId - The ID of the conversation
 * @param message - The message content
 * @returns Promise with the sent message
 * @throws Error if message fails to send
 */
async function sendMessage(
  conversationId: string,
  message: string
): Promise<Message> {
  // Implementation
}
```

### Component Documentation
```typescript
/**
 * Button Component
 *
 * A reusable button component with multiple variants and sizes
 *
 * @example
 * <Button
 *   title="Click Me"
 *   onPress={handlePress}
 *   variant="primary"
 *   size="large"
 * />
 */
```

## Resources

- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)

## Getting Help

1. Check existing documentation
2. Search closed issues
3. Ask in team chat
4. Create detailed issue with:
   - Description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Environment details

---

Happy Coding! 🚀
