# Backend Integration Guide

## ✅ What's Been Done

The React Native frontend has been configured to connect to your Python FastAPI backend:

### 1. Configuration Updated

**File**: `src/constants/config.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: 'http://172.20.10.3:8080/api',
  SOCKET_URL: 'http://172.20.10.3:8080',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
};
```

✅ Points to your local backend server
✅ Both REST API and WebSocket configured

### 2. Mock Mode Disabled

**File**: `src/services/api/authService.ts`

```typescript
const MOCK_MODE = false;  // Changed from true to false
```

✅ Now uses real backend authentication
✅ No more dummy credentials

### 3. API Client Updated

**File**: `src/services/api/client.ts`

✅ Properly handles FastAPI response format
✅ JWT token management configured
✅ Auto-refresh token on 401 errors
✅ Error handling for FastAPI's `detail` field

---

## 🚀 How to Test the Integration

### Step 1: Ensure Backend is Running

The backend server should already be running at `http://172.20.10.3:8080`

Check if it's running:
```bash
curl http://172.20.10.3:8080/health
```

You should see:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Step 2: Start the React Native App

```bash
cd /Users/mac/Downloads/urge-talk-master

# For iOS
npm run ios

# For Android
npm run android

# Or just start Metro
npm start
```

### Step 3: Test Registration Flow

1. **Open the app** on your device/emulator
2. **Click "Create Account"**
3. **Fill in the form:**
   - Phone Number: Any valid format (e.g., `+1234567890`)
   - Password: At least 8 characters
   - Display Name: Your name
   - Email: Optional

4. **Click Register**

The app will now:
- Send registration request to backend
- Backend creates user in database
- Backend returns JWT tokens
- App stores tokens and logs you in

### Step 4: Test Login

1. **Go to Login screen**
2. **Enter credentials** you just registered
3. **Click Login**

The app will:
- Send login request to backend
- Backend validates credentials
- Backend returns JWT tokens
- App navigates to home screen

---

## 📱 Current Integration Status

| Feature | Status | Notes |
|---------|--------|-------|
| ✅ API Configuration | Complete | Points to backend |
| ✅ Authentication | Complete | Register, Login, JWT |
| ✅ API Client | Complete | Axios with interceptors |
| ✅ Socket.IO Config | Complete | Ready for real-time |
| ⚠️ Conversations | Needs Implementation | Backend ready |
| ⚠️ Messages | Needs Implementation | Backend ready |
| ⚠️ Groups | Needs Implementation | Backend ready |
| ⚠️ Media Upload | Needs Implementation | Backend ready |

---

## 🔧 Next Steps (Optional Enhancements)

### 1. Create Additional API Services

Currently only `authService` is connected. You may want to create:

**ConversationService** (`src/services/api/conversationService.ts`):
```typescript
import { apiClient } from './client';

class ConversationService {
  async getConversations(limit = 50, offset = 0) {
    return apiClient.get(`/conversations?limit=${limit}&offset=${offset}`);
  }

  async getConversation(id: string) {
    return apiClient.get(`/conversations/${id}`);
  }

  async createConversation(participantIds: string[]) {
    return apiClient.post('/conversations', {
      type: 'DIRECT',
      participant_ids: participantIds,
    });
  }

  async getMessages(conversationId: string, limit = 50) {
    return apiClient.get(`/conversations/${conversationId}/messages?limit=${limit}`);
  }

  async markAsRead(conversationId: string) {
    return apiClient.put(`/conversations/${conversationId}/read`);
  }
}

export const conversationService = new ConversationService();
```

**MessageService** (`src/services/api/messageService.ts`):
```typescript
import { apiClient } from './client';

class MessageService {
  async sendMessage(conversationId: string, content: string, messageType = 'TEXT') {
    return apiClient.post('/messages', {
      conversation_id: conversationId,
      content,
      message_type: messageType,
      is_encrypted: false,
    });
  }

  async editMessage(messageId: string, content: string) {
    return apiClient.put(`/messages/${messageId}`, { content });
  }

  async deleteMessage(messageId: string) {
    return apiClient.delete(`/messages/${messageId}`);
  }

  async forwardMessages(messageIds: string[], conversationId: string) {
    return apiClient.post('/messages/forward', {
      message_ids: messageIds,
      conversation_id: conversationId,
    });
  }

  async starMessage(messageId: string) {
    return apiClient.post(`/messages/${messageId}/star`);
  }

  async unstarMessage(messageId: string) {
    return apiClient.delete(`/messages/${messageId}/star`);
  }

  async getStarredMessages() {
    return apiClient.get('/messages/starred');
  }

  async searchMessages(query: string, conversationId?: string) {
    let url = `/messages/search?q=${encodeURIComponent(query)}`;
    if (conversationId) {
      url += `&conversationId=${conversationId}`;
    }
    return apiClient.get(url);
  }
}

export const messageService = new MessageService();
```

**GroupService** (`src/services/api/groupService.ts`):
```typescript
import { apiClient } from './client';

class GroupService {
  async createGroup(name: string, memberIds: string[], description?: string) {
    return apiClient.post('/groups', {
      name,
      description,
      member_ids: memberIds,
      is_public: false,
    });
  }

  async getGroup(groupId: string) {
    return apiClient.get(`/groups/${groupId}`);
  }

  async updateGroup(groupId: string, data: any) {
    return apiClient.put(`/groups/${groupId}`, data);
  }

  async deleteGroup(groupId: string) {
    return apiClient.delete(`/groups/${groupId}`);
  }

  async addMembers(groupId: string, userIds: string[]) {
    return apiClient.post(`/groups/${groupId}/members`, { user_ids: userIds });
  }

  async removeMember(groupId: string, userId: string) {
    return apiClient.delete(`/groups/${groupId}/members/${userId}`);
  }

  async updateMemberRole(groupId: string, userId: string, role: string) {
    return apiClient.put(`/groups/${groupId}/members/${userId}/role`, { role });
  }

  async leaveGroup(groupId: string) {
    return apiClient.post(`/groups/${groupId}/leave`);
  }

  async getMembers(groupId: string) {
    return apiClient.get(`/groups/${groupId}/members`);
  }
}

export const groupService = new GroupService();
```

**MediaService** (`src/services/api/mediaService.ts`):
```typescript
import { apiClient } from './client';

class MediaService {
  async uploadMedia(file: any, onProgress?: (progress: number) => void) {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.upload('/media/upload', formData, onProgress);
  }

  async deleteMedia(mediaId: string) {
    return apiClient.delete(`/media/${mediaId}`);
  }

  getMediaUrl(filename: string) {
    return `${API_CONFIG.BASE_URL.replace('/api', '')}/api/media/${filename}`;
  }

  getThumbnailUrl(mediaId: string) {
    return `${API_CONFIG.BASE_URL.replace('/api', '')}/api/media/${mediaId}/thumbnail`;
  }
}

export const mediaService = new MediaService();
```

### 2. Update Screens to Use Real Data

The screens are currently using dummy data from `src/data/`. You'll need to update them to use the API services.

Example for **ChatListScreen**:

```typescript
// Before (with dummy data)
import { conversations } from '../data/conversations';

// After (with real API)
import { useEffect, useState } from 'react';
import { conversationService } from '../services/api/conversationService';

function ChatListScreen() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await conversationService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### 3. Remove Dummy Data Files

Once you've integrated real APIs, you can remove:

```bash
rm -rf src/data/
```

This includes:
- `src/data/conversations.ts`
- `src/data/messages.ts`
- `src/data/users.ts`

---

## 🐛 Troubleshooting

### "Network Error" when testing

**Problem**: App can't connect to backend

**Solutions**:
1. **Check backend is running:**
   ```bash
   curl http://172.20.10.3:8080/health
   ```

2. **On Android Emulator**, use `10.0.2.2` instead of `172.20.10.3`:
   ```typescript
   BASE_URL: Platform.OS === 'android'
     ? 'http://10.0.2.2:8080/api'
     : 'http://172.20.10.3:8080/api'
   ```

3. **On Physical Device**, make sure:
   - Phone and computer are on same WiFi network
   - Firewall allows port 8080
   - Use your computer's actual IP address

### "401 Unauthorized" errors

**Problem**: Token authentication failing

**Solutions**:
1. Clear app storage and re-login
2. Check token is being sent in headers
3. Verify backend SECRET_KEY matches

### WebSocket not connecting

**Problem**: Socket.IO connection fails

**Solutions**:
1. Check SOCKET_URL in config
2. Ensure backend Socket.IO server is running
3. Check network allows WebSocket connections

---

## 📊 Data Flow

### Registration Flow

```
App → POST /api/auth/register
    ↓
Backend validates & creates user
    ↓
Backend returns: { user, token, refresh_token }
    ↓
App stores tokens in AsyncStorage
    ↓
App navigates to Home
```

### Login Flow

```
App → POST /api/auth/login
    ↓
Backend validates credentials
    ↓
Backend returns: { user, token, refresh_token }
    ↓
App stores tokens in AsyncStorage
    ↓
App sets user.is_online = true
    ↓
App navigates to Home
```

### Sending Message Flow

```
App creates message
    ↓
App → POST /api/messages
    ↓
Backend saves to database
    ↓
Backend emits Socket.IO event
    ↓
Other users receive real-time update
```

---

## 🔐 Security Notes

1. **Tokens are stored** in AsyncStorage (encrypted on device)
2. **Auto-refresh** handles token expiration
3. **HTTPS** should be used in production
4. **Passwords** are bcrypt hashed on backend
5. **No sensitive data** in frontend code

---

## ✅ Testing Checklist

- [ ] Backend server running on `http://172.20.10.3:8080`
- [ ] Frontend config points to correct backend URL
- [ ] Can register new user successfully
- [ ] Can login with registered credentials
- [ ] JWT tokens stored in AsyncStorage
- [ ] API calls include Authorization header
- [ ] Token auto-refresh works on 401 errors
- [ ] Socket.IO connects successfully
- [ ] Can send/receive messages (when implemented)
- [ ] Error messages display correctly

---

## 📚 Resources

- **Backend API Docs**: http://172.20.10.3:8080/docs
- **Backend Health**: http://172.20.10.3:8080/health
- **Backend README**: `/Users/mac/Downloads/urge-backend/README.md`
- **API Testing Guide**: `/Users/mac/Downloads/urge-backend/API_TESTING.md`

---

## 🎯 Quick Start

1. **Backend is already running** ✅
2. **Frontend is configured** ✅
3. **Start the app:**
   ```bash
   cd /Users/mac/Downloads/urge-talk-master
   npm start
   ```
4. **Test registration** - Create a new account
5. **Test login** - Login with your account
6. **You're connected!** 🎉

---

**Last Updated**: Auto-configured on backend integration
