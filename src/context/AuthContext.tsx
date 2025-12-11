import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { User, AuthResponse, AuthCredentials } from '../types';
import { authService } from '../services/api/authService';
import { STORAGE_KEYS } from '../constants/config';
import { AUTH_LOGOUT_EVENT } from '../services/api/client';
import { pushNotificationService } from '../services/pushNotification';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
  verifyPhone: (phoneNumber: string, code: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();

    // Listen for forced logout events from API client (e.g., when token refresh fails)
    const subscription = DeviceEventEmitter.addListener(AUTH_LOGOUT_EVENT, () => {
      console.log('Received AUTH_LOGOUT_EVENT - clearing auth state');
      setToken(null);
      setUser(null);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (storedToken && storedUser) {
        // Verify the token is still valid by making a quick API call
        try {
          const response = await fetch(`${require('../constants/config').API_CONFIG.BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            // Token is valid
            setToken(storedToken);
            setUser(JSON.parse(storedUser));

            // Initialize push notifications for returning user
            pushNotificationService.initialize().catch((error) => {
              console.error('Failed to initialize push notifications:', error);
            });
          } else {
            // Token is invalid - clear stored auth
            console.log('Stored token is invalid, clearing auth');
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.AUTH_TOKEN,
              STORAGE_KEYS.REFRESH_TOKEN,
              STORAGE_KEYS.USER_DATA,
            ]);
          }
        } catch (fetchError) {
          // Network error - use stored data optimistically
          console.log('Could not verify token, using stored auth:', fetchError);
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Initialize push notifications for returning user
          pushNotificationService.initialize().catch((error) => {
            console.error('Failed to initialize push notifications:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (authData: AuthResponse) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authData.token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user));

      setToken(authData.token);
      setUser(authData.user);

      // Initialize push notifications after successful authentication
      pushNotificationService.initialize().catch((error) => {
        console.error('Failed to initialize push notifications:', error);
      });
    } catch (error) {
      console.error('Error saving auth:', error);
      throw error;
    }
  };

  const login = async (credentials: AuthCredentials) => {
    try {
      const response = await authService.login(credentials);
      await saveAuth(response);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (credentials: AuthCredentials) => {
    try {
      const response = await authService.register(credentials);
      await saveAuth(response);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const verifyPhone = async (phoneNumber: string, code: string) => {
    console.log('[AuthContext] verifyPhone called with phoneNumber:', phoneNumber, 'code length:', code?.length);
    try {
      // Use login with verification code for existing users
      const response = await authService.login({ phoneNumber, verificationCode: code });
      await saveAuth(response);
    } catch (error) {
      console.error('Verification error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Unregister push notification token before logout
      await pushNotificationService.unregisterToken();

      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) return;

      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        verifyPhone,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
