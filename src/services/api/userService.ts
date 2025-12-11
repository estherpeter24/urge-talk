import { apiClient } from './client';
import { User } from '../../types';

// Transform backend user response (snake_case) to frontend User type (camelCase)
function transformUser(backendUser: any): User {
  return {
    id: backendUser.id,
    phoneNumber: backendUser.phone_number,
    email: backendUser.email,
    displayName: backendUser.display_name,
    avatar: backendUser.avatar_url,
    role: backendUser.role,
    bio: backendUser.bio,
    socialLinks: backendUser.social_links,
    isVerified: backendUser.is_verified,
    isOnline: backendUser.is_online,
    lastSeen: backendUser.last_seen,
    createdAt: backendUser.created_at,
    updatedAt: backendUser.updated_at,
  };
}

export interface UserSearchResponse {
  users: User[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserStatusResponse {
  user_id: string;
  is_online: boolean;
  last_seen?: string;
}

class UserService {
  async getAllUsers(limit = 50, offset = 0) {
    const response = await apiClient.get<any>(
      `/users?limit=${limit}&offset=${offset}`
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: {
          users: response.data.users.map(transformUser),
          total: response.data.total,
          limit: response.data.limit,
          offset: response.data.offset,
        }
      };
    }
    return response;
  }

  async searchUsers(query: string, limit = 20, offset = 0) {
    const response = await apiClient.get<any>(
      `/users/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`
    );

    if (response.success && response.data) {
      return {
        ...response,
        data: {
          users: response.data.users.map(transformUser),
          total: response.data.total,
          limit: response.data.limit,
          offset: response.data.offset,
        }
      };
    }
    return response;
  }

  async getUserProfile(userId: string) {
    const response = await apiClient.get<any>(`/users/${userId}`);

    if (response.success && response.data) {
      return {
        ...response,
        data: transformUser(response.data)
      };
    }
    return response;
  }

  async getUsersByIds(userIds: string[]) {
    if (userIds.length === 0) {
      return { success: true, data: { users: [] } };
    }
    // Use POST to send array of IDs in body (more reliable for large lists)
    const response = await apiClient.post<any>('/users/batch', { user_ids: userIds });

    if (response.success && response.data) {
      return {
        ...response,
        data: {
          users: (response.data.users || []).map(transformUser),
        }
      };
    }
    return response;
  }

  async getUserStatus(userId: string) {
    const response = await apiClient.get<UserStatusResponse>(`/users/${userId}/status`);
    return response;
  }

  async getCurrentUser() {
    const response = await apiClient.get<any>('/users/me');

    if (response.success && response.data) {
      return {
        ...response,
        data: transformUser(response.data)
      };
    }
    return response;
  }

  async updateProfile(userData: Partial<User>) {
    const response = await apiClient.put('/auth/profile', userData);
    return response;
  }

  // Device token registration (kept here as it's user-specific)
  async registerDeviceToken(deviceToken: string, platform: 'IOS' | 'ANDROID') {
    const response = await apiClient.post('/notifications/register', {
      device_token: deviceToken,
      platform,
    });
    return response;
  }
}

export const userService = new UserService();
