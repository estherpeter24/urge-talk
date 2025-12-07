import { apiClient } from './client';
import { AuthResponse, AuthCredentials, User } from '../../types';

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

// MOCK MODE - Set to true to use dummy credentials
const MOCK_MODE = false;

// Dummy user data
const MOCK_USER: User = {
  id: '1',
  phoneNumber: '+1234567890',
  displayName: 'Test User',
  profilePicture: undefined,
  bio: 'This is a test account',
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastSeen: new Date().toISOString(),
  publicKey: 'mock-public-key',
};

const MOCK_AUTH_RESPONSE: AuthResponse = {
  user: MOCK_USER,
  token: 'mock-jwt-token-12345',
  refreshToken: 'mock-refresh-token-67890',
};

// Dummy credentials: +1234567890 / password123
const MOCK_CREDENTIALS = {
  phoneNumber: '+1234567890',
  password: 'password123',
};

class AuthService {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    // Mock mode for testing
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      if (credentials.phoneNumber === MOCK_CREDENTIALS.phoneNumber &&
          credentials.password === MOCK_CREDENTIALS.password) {
        return MOCK_AUTH_RESPONSE;
      }

      throw new Error('Invalid phone number or password. Use: +1234567890 / password123');
    }

    // Convert camelCase to snake_case for backend
    const payload = {
      phone_number: credentials.phoneNumber,
      password: credentials.password,
    };

    const response = await apiClient.post<any>('/auth/login', payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }

    // Convert snake_case response to camelCase
    return {
      user: transformUser(response.data.user),
      token: response.data.token,
      refreshToken: response.data.refresh_token,
    };
  }

  async register(credentials: AuthCredentials): Promise<AuthResponse> {
    // Convert camelCase to snake_case for backend
    const payload = {
      phone_number: credentials.phoneNumber,
      password: credentials.password,
      display_name: credentials.displayName,
    };

    const response = await apiClient.post<any>('/auth/register', payload);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }

    // Convert snake_case response to camelCase
    return {
      user: transformUser(response.data.user),
      token: response.data.token,
      refreshToken: response.data.refresh_token,
    };
  }

  async verifyPhone(phoneNumber: string, code: string): Promise<AuthResponse> {
    const response = await apiClient.post<any>('/auth/verify-phone', {
      phone_number: phoneNumber,
      code,
    });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Verification failed');
    }

    // Convert snake_case response to camelCase
    return {
      user: transformUser(response.data.user),
      token: response.data.token,
      refreshToken: response.data.refresh_token,
    };
  }

  async sendVerificationCode(phoneNumber: string): Promise<void> {
    const response = await apiClient.post('/auth/send-code', {
      phone_number: phoneNumber,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to send verification code');
    }
  }

  async forgotPassword(phoneNumber: string): Promise<void> {
    const response = await apiClient.post('/auth/forgot-password', {
      phone_number: phoneNumber,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to send reset code');
    }
  }

  async resetPassword(phoneNumber: string, code: string, newPassword: string): Promise<void> {
    const response = await apiClient.post('/auth/reset-password', {
      phone_number: phoneNumber,
      code,
      new_password: newPassword,
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to reset password');
    }
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/auth/profile', userData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update profile');
    }
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }
}

export const authService = new AuthService();
