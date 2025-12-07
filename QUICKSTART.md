# URGE - Quick Start Guide

## Getting the App Running (5 Minutes)

### Step 1: Install Dependencies (2 minutes)

```bash
cd URGE
npm install
```

For iOS (Mac only):
```bash
cd ios
pod install
cd ..
```

### Step 2: Start Metro Bundler (1 minute)

```bash
npm start
```

Leave this running in one terminal.

### Step 3: Run the App (2 minutes)

Open a new terminal and run:

**For Android:**
```bash
npm run android
```

**For iOS (Mac only):**
```bash
npm run ios
```

## First Time Setup

### Environment Configuration

Create a `.env` file in the root directory:

```env
API_BASE_URL=http://localhost:8080/api
SOCKET_URL=ws://localhost:8080
```

Or update `src/constants/config.ts` directly:

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://your-backend-url:8080/api',
  SOCKET_URL: 'ws://your-backend-url:8080',
};
```

## Testing the App

### Without Backend

The app will run and you can:
- ✅ Navigate through all screens
- ✅ See UI components
- ✅ Test dark mode
- ✅ Check navigation flows
- ❌ Cannot login (needs backend)
- ❌ Cannot send messages (needs backend)

### With Backend

Once backend is running:
1. Update API URLs
2. Restart Metro
3. Full functionality available

## Common Issues & Fixes

### Metro Bundler Issues

```bash
# Clear cache and restart
npm start -- --reset-cache
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Issues

```bash
cd ios
rm -rf Pods
pod install
cd ..
npm run ios
```

### Dependency Issues

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## Project Structure at a Glance

```
src/
├── screens/          # All app screens
│   ├── auth/        # Login, Register, Verification
│   ├── chat/        # Chat List, Chat Room, New Chat
│   ├── groups/      # Group screens
│   ├── profile/     # Profile screen
│   └── settings/    # Settings screen
│
├── components/      # Reusable UI components
│   └── common/      # Button, Input, etc.
│
├── navigation/      # Navigation configuration
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── MainNavigator.tsx
│   └── ChatNavigator.tsx
│
├── services/        # Business logic
│   ├── api/        # API calls
│   ├── socket/     # WebSocket
│   └── encryption/ # Message encryption
│
├── context/        # State management
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
│
└── constants/      # App configuration
    ├── colors.ts
    ├── theme.ts
    └── config.ts
```

## Testing Features

### 1. Navigation
- Open app → See splash screen
- Should show Login screen
- Tap "Sign Up" → See Register screen
- Test back navigation

### 2. Dark Mode
- Open app
- Navigate to Settings tab
- Tap "Dark Mode" toggle
- Theme should change immediately

### 3. UI Components
All screens demonstrate:
- Custom Button component
- Custom Input component
- Theme-aware colors
- Responsive layouts

## Development Workflow

### Making Changes

1. **Edit a file** in `src/`
2. **Save** - Metro will auto-reload
3. **Check device** - See changes immediately

### Adding a Screen

1. Create screen in `src/screens/category/`
2. Add route to navigator
3. Import and test

### Modifying Theme

Edit `src/constants/colors.ts`:
```typescript
export const Colors = {
  light: {
    primary: '#YOUR_COLOR',
    // ...
  }
};
```

## Backend Integration Checklist

When backend is ready:

- [ ] Update `API_BASE_URL` in config
- [ ] Update `SOCKET_URL` in config
- [ ] Test `/api/auth/login` endpoint
- [ ] Test `/api/auth/register` endpoint
- [ ] Test Socket.IO connection
- [ ] Verify message sending
- [ ] Test real-time features

## Debugging

### Enable Debug Mode

**Chrome DevTools:**
1. Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
2. Select "Debug"
3. Open Chrome DevTools

**Console Logs:**
```typescript
console.log('Debug info:', data);
```

### Check Network Requests

**Flipper** (Recommended):
1. Install Flipper desktop app
2. Open Flipper
3. App will auto-connect
4. See all network requests

## Performance Tips

### For Development
- Use debug builds
- Enable Fast Refresh
- Use Chrome DevTools

### For Testing
- Use release builds
- Disable debug mode
- Test on real devices

## Next Steps

1. ✅ Get app running
2. ✅ Explore all screens
3. ✅ Test dark mode
4. ⏳ Connect backend
5. ⏳ Test authentication
6. ⏳ Test messaging

## Support

### Documentation
- `README.md` - Project overview
- `DEVELOPMENT.md` - Development guide
- `PROJECT_SUMMARY.md` - What's complete

### Getting Help
1. Check documentation
2. Search existing issues
3. Ask in team chat
4. Create detailed issue

## Useful Commands

```bash
# Start Metro
npm start

# Run Android
npm run android

# Run iOS
npm run ios

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint code
npm run lint

# Clear cache
npm start -- --reset-cache

# Clean build
cd android && ./gradlew clean && cd ..
cd ios && rm -rf Pods && pod install && cd ..
```

## Ready to Code?

The foundation is complete and ready for you to build upon. Happy coding! 🚀

---

**Questions?** Check `DEVELOPMENT.md` for detailed guides.
**Issues?** See "Common Issues & Fixes" above.
**Contributing?** Follow patterns in existing code.
