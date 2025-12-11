/**
 * Push Notification Service
 *
 * Handles Firebase Cloud Messaging (FCM) for push notifications.
 * - Requests permissions
 * - Gets FCM token
 * - Registers token with backend
 * - Handles foreground/background notifications
 */

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import { settingsService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = '@fcm_token';

export interface NotificationData {
  type: 'new_message' | 'incoming_call' | 'group_invite' | string;
  conversation_id?: string;
  message_id?: string;
  sender_name?: string;
  is_group?: string;
  caller_id?: string;
  call_type?: string;
  group_id?: string;
  group_name?: string;
}

class PushNotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private onNotificationCallback: ((data: NotificationData) => void) | null = null;

  /**
   * Initialize push notifications
   * Call this on app start after user is authenticated
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Request permission (iOS)
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Push notification permission denied');
        return false;
      }

      // Get FCM token
      const token = await this.getFCMToken();
      if (!token) {
        console.log('Failed to get FCM token');
        return false;
      }

      // Register token with backend
      await this.registerTokenWithBackend(token);

      // Set up message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permission (required for iOS)
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted:', authStatus);
      }

      return enabled;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFCMToken(): Promise<string | null> {
    try {
      // Check if we have a cached token
      const cachedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

      // On iOS, must register for remote messages before getting token
      if (Platform.OS === 'ios') {
        // Check if device is registered for remote messages
        const isRegistered = messaging().isDeviceRegisteredForRemoteMessages;
        if (!isRegistered) {
          try {
            await messaging().registerDeviceForRemoteMessages();
          } catch (registerError: any) {
            // This will fail on iOS Simulator - that's expected
            if (registerError?.message?.includes('unregistered') ||
                registerError?.code === 'messaging/unregistered') {
              console.log('Push notifications not available (likely running on simulator)');
              return null;
            }
            throw registerError;
          }
        }
      }

      // Get current token from Firebase
      const token = await messaging().getToken();

      if (token) {
        this.fcmToken = token;

        // If token changed, save it
        if (token !== cachedToken) {
          await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
          console.log('New FCM token obtained');
        }

        return token;
      }

      return null;
    } catch (error: any) {
      // Handle simulator/emulator case gracefully
      if (error?.message?.includes('unregistered') ||
          error?.message?.includes('registerDeviceForRemoteMessages') ||
          error?.code === 'messaging/unregistered') {
        console.log('Push notifications not available on this device (simulator/emulator)');
        return null;
      }
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      const response = await settingsService.registerDeviceToken(token, platform);

      if (response.success) {
        console.log('FCM token registered with backend');
      } else {
        console.error('Failed to register token:', response.message);
      }
    } catch (error) {
      console.error('Error registering token with backend:', error);
    }
  }

  /**
   * Unregister device token (call on logout)
   */
  async unregisterToken(): Promise<void> {
    try {
      const token = this.fcmToken || await AsyncStorage.getItem(FCM_TOKEN_KEY);

      if (token) {
        await settingsService.unregisterDeviceToken(token);
        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
        this.fcmToken = null;
        console.log('FCM token unregistered');
      }
    } catch (error) {
      console.error('Error unregistering token:', error);
    }
  }

  /**
   * Set up message handlers for foreground and background
   */
  private setupMessageHandlers(): void {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      this.handleNotification(remoteMessage, 'foreground');
    });

    // Handle token refresh
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM token refreshed');
      this.fcmToken = newToken;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
      await this.registerTokenWithBackend(newToken);
    });

    // Handle notification opened from background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check if app was opened from a notification (killed state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification (killed state):', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage,
    state: 'foreground' | 'background'
  ): void {
    const data = remoteMessage.data as NotificationData | undefined;
    const notification = remoteMessage.notification;

    // For foreground notifications, show an alert or custom UI
    if (state === 'foreground' && notification) {
      // You can use a custom toast/banner here instead of Alert
      Alert.alert(
        notification.title || 'New Notification',
        notification.body || '',
        [
          { text: 'Dismiss', style: 'cancel' },
          {
            text: 'View',
            onPress: () => {
              if (data) {
                this.onNotificationCallback?.(data);
              }
            },
          },
        ]
      );
    }
  }

  /**
   * Handle notification tap (app opened from notification)
   */
  private handleNotificationOpen(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): void {
    const data = remoteMessage.data as NotificationData | undefined;

    if (data && this.onNotificationCallback) {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        this.onNotificationCallback?.(data);
      }, 500);
    }
  }

  /**
   * Set callback for when notification is tapped
   */
  setOnNotificationCallback(callback: (data: NotificationData) => void): void {
    this.onNotificationCallback = callback;
  }

  /**
   * Check if notifications are enabled
   */
  async checkPermissionStatus(): Promise<boolean> {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export background message handler (must be called at top level in index.js)
export const setupBackgroundHandler = (): void => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    // Background messages are handled by the system notification tray
    // No need to show custom notification here
  });
};
