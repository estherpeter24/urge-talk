export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:8080/api' : 'https://api.urge.app',
  SOCKET_URL: __DEV__ ? 'http://localhost:8080' : 'https://api.urge.app',
  TIMEOUT: 30000,
  MAX_RETRIES: 3,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@urge_auth_token',
  REFRESH_TOKEN: '@urge_refresh_token',
  USER_DATA: '@urge_user_data',
  SETTINGS: '@urge_settings',
  MESSAGES_CACHE: '@urge_messages_cache',
  THEME: '@urge_theme',
  LANGUAGE: '@urge_language',
  NOTIFICATION_SETTINGS: '@urge_notification_settings',
  PRIVACY_SETTINGS: '@urge_privacy_settings',
};

export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-256-GCM',
  KEY_SIZE: 256,
  ITERATIONS: 10000,
};

export const MEDIA_CONFIG = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_DOCUMENT_SIZE: 20 * 1024 * 1024, // 20MB
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov', 'avi'],
  SUPPORTED_DOCUMENT_FORMATS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
};

export const S3_CONFIG = {
  // S3 bucket configuration - URLs are fetched via presigned URLs from backend
  BUCKET_NAME: 'mycoursemateresourcenew',
  REGION: 'eu-north-1',
  // CDN URL for serving media (direct S3 URL if no CloudFront)
  CDN_URL: 'https://mycoursemateresourcenew.s3.eu-north-1.amazonaws.com',
  // Folder prefixes for organizing uploads
  FOLDERS: {
    AVATARS: 'avatars',
    MEDIA: 'media',
    DOCUMENTS: 'documents',
    VOICE: 'voice',
  },
};

export const APP_CONFIG = {
  APP_NAME: 'URGE',
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
  SUPPORT_EMAIL: 'support@urge.app',
  PRIVACY_POLICY_URL: 'https://urge.app/privacy',
  TERMS_URL: 'https://urge.app/terms',
};

// Paystack configuration (test mode)
export const PAYSTACK_PUBLIC_KEY = 'pk_test_b50eb13e278f7d780809ee5bceae2f2440994d6c';
