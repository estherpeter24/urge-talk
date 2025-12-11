import { apiClient } from './client';
import { User } from '../../types';

export interface BlockedUser {
  id: string;
  display_name: string;
  phone_number?: string;
  avatar_url?: string;
}

export interface BlockCheckResponse {
  i_blocked_them: boolean;
  they_blocked_me: boolean;
  is_blocked: boolean;
}

export interface PrivacySettingsResponse {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showProfilePhoto: boolean;
  showReadReceipts: boolean;
}

class SettingsService {
  // Get list of blocked users with details
  async getBlockedUsers(): Promise<{ success: boolean; data?: { blocked_users: BlockedUser[] }; message?: string }> {
    const response = await apiClient.get<{ blocked_users: BlockedUser[] }>('/settings/privacy/blocked');
    return response;
  }

  // Check if a user is blocked (bidirectional)
  async checkIfBlocked(userId: string): Promise<{ success: boolean; data?: BlockCheckResponse; message?: string }> {
    const response = await apiClient.get<BlockCheckResponse>(`/settings/privacy/blocked/check/${userId}`);
    return response;
  }

  // Block a user
  async blockUser(userId: string): Promise<{ success: boolean; message?: string; data?: any }> {
    const response = await apiClient.post(`/settings/privacy/block/${userId}`);
    return response;
  }

  // Unblock a user
  async unblockUser(userId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/settings/privacy/unblock/${userId}`);
    return response;
  }

  // Get notification settings
  async getNotificationSettings(): Promise<{ success: boolean; data?: any; message?: string }> {
    const response = await apiClient.get('/settings/notifications');
    return response;
  }

  // Update notification settings
  async updateNotificationSettings(settings: any): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.put('/settings/notifications', settings);
    return response;
  }

  // Register device token for push notifications
  async registerDeviceToken(token: string, platform: 'ios' | 'android'): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post('/settings/notifications/register', { token, platform });
    return response;
  }

  // Unregister device token
  async unregisterDeviceToken(token: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/settings/notifications/unregister?token=${encodeURIComponent(token)}`);
    return response;
  }

  // ============= Two-Factor Authentication =============

  // Get 2FA status
  async get2FAStatus(): Promise<{ success: boolean; data?: { enabled: boolean; has_backup_codes: boolean }; message?: string }> {
    const response = await apiClient.get<{ enabled: boolean; has_backup_codes: boolean }>('/settings/security/2fa/status');
    return response;
  }

  // Setup 2FA - get secret and QR code URI
  async setup2FA(): Promise<{ success: boolean; data?: { secret: string; provisioning_uri: string }; message?: string }> {
    const response = await apiClient.post<{ success: boolean; secret: string; provisioning_uri: string }>('/settings/security/2fa/setup');
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          secret: response.data.secret,
          provisioning_uri: response.data.provisioning_uri,
        }
      };
    }
    return response;
  }

  // Verify and enable 2FA
  async verify2FA(code: string): Promise<{ success: boolean; data?: { backup_codes: string[] }; message?: string }> {
    const response = await apiClient.post<{ success: boolean; backup_codes: string[]; message: string }>('/settings/security/2fa/verify', { code });
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          backup_codes: response.data.backup_codes,
        },
        message: response.data.message,
      };
    }
    return response;
  }

  // Disable 2FA
  async disable2FA(code: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post('/settings/security/2fa/disable', { code });
    return response;
  }

  // Regenerate backup codes
  async regenerateBackupCodes(code: string): Promise<{ success: boolean; data?: { backup_codes: string[] }; message?: string }> {
    const response = await apiClient.post<{ success: boolean; backup_codes: string[]; message: string }>('/settings/security/2fa/regenerate-backup-codes', { code });
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          backup_codes: response.data.backup_codes,
        },
        message: response.data.message,
      };
    }
    return response;
  }

  // Get privacy settings
  async getPrivacySettings(): Promise<{ success: boolean; data?: PrivacySettingsResponse; message?: string }> {
    const response = await apiClient.get<any>('/settings/privacy');
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          showOnlineStatus: response.data.show_online_status,
          showLastSeen: response.data.show_last_seen,
          showProfilePhoto: response.data.show_profile_photo,
          showReadReceipts: response.data.show_read_receipts,
        }
      };
    }
    return response;
  }

  // Update privacy settings
  async updatePrivacySettings(settings: Partial<PrivacySettingsResponse>): Promise<{ success: boolean; message?: string }> {
    const params = new URLSearchParams();
    if (settings.showOnlineStatus !== undefined) {
      params.append('show_online_status', String(settings.showOnlineStatus));
    }
    if (settings.showLastSeen !== undefined) {
      params.append('show_last_seen', String(settings.showLastSeen));
    }
    if (settings.showProfilePhoto !== undefined) {
      params.append('show_profile_photo', String(settings.showProfilePhoto));
    }
    if (settings.showReadReceipts !== undefined) {
      params.append('show_read_receipts', String(settings.showReadReceipts));
    }
    const response = await apiClient.put(`/settings/privacy?${params.toString()}`);
    return response;
  }
}

export const settingsService = new SettingsService();
