import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { API_CONFIG, STORAGE_KEYS } from '../../constants/config';
import { ApiResponse } from '../../types';

// Event name for auth session expiry
export const AUTH_LOGOUT_EVENT = 'AUTH_LOGOUT_EVENT';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Don't try to refresh tokens for auth endpoints (login, register, etc.)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');

        // Handle 401 Unauthorized - refresh token (but not for auth endpoints)
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            // Only attempt refresh if we have a token
            if (!refreshToken) {
              return Promise.reject(error);
            }
            // Send as refresh_token (snake_case) to match backend expectation
            const response = await this.client.post('/auth/refresh', { refresh_token: refreshToken });

            const { access_token } = response.data;
            await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, access_token);

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout user
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.AUTH_TOKEN,
              STORAGE_KEYS.REFRESH_TOKEN,
              STORAGE_KEYS.USER_DATA,
            ]);
            // Emit event to notify AuthContext to clear state
            DeviceEventEmitter.emit(AUTH_LOGOUT_EVENT);
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return {
        success: true,
        data: response.data,
        message: 'Success',
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return {
        success: true,
        data: response.data,
        message: 'Success',
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return {
        success: true,
        data: response.data,
        message: 'Success',
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return {
        success: true,
        data: response.data,
        message: 'Success',
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return {
        success: true,
        data: response.data,
        message: 'Success',
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse<any> {
    if (error.response) {
      // Handle FastAPI validation errors (detail is an array of {type, loc, msg, input})
      let errorMessage = 'Server error occurred';
      const detail = error.response.data?.detail;

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // Extract msg from first validation error
        errorMessage = detail[0]?.msg || 'Validation error';
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message;
      }

      return {
        success: false,
        message: errorMessage,
        error: {
          code: error.response.status.toString(),
          message: errorMessage,
          details: error.response.data,
        },
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        error: {
          code: 'NETWORK_ERROR',
          message: 'No response from server',
        },
      };
    } else {
      return {
        success: false,
        message: error.message || 'An error occurred',
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message,
        },
      };
    }
  }
}

export const apiClient = new ApiClient();
