// User Role Types
export enum UserRole {
  FOUNDER = 'FOUNDER',
  CO_FOUNDER = 'CO_FOUNDER',
  VERIFIED = 'VERIFIED',
  REGULAR = 'REGULAR',
}

// User Interface
export interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  bio?: string;
  socialLinks?: SocialLinks;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Social Links
export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

// Message Types
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION',
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

// Message Interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  mediaUrl?: string;
  thumbnailUrl?: string;
  audioPath?: string;
  audioDuration?: number;
  replyTo?: string;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Conversation Types
export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export interface ParticipantInfo {
  id: string;
  display_name: string;
  avatar_url?: string;
  is_online: boolean;
}

export interface Conversation {
  id: string;
  type?: ConversationType;
  name?: string;
  avatar?: string;
  participants?: ParticipantInfo[];
  lastMessage?: Message;
  unreadCount: number;
  isTyping?: boolean;
  typingUsers?: string[];
  isFavourite?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Group Interface
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  admins: string[];
  members: GroupMember[];
  settings: GroupSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  userId: string;
  role: UserRole;
  joinedAt: Date;
  permissions: GroupPermissions;
}

export interface GroupPermissions {
  canSendMessages: boolean;
  canSendMedia: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canEditGroupInfo: boolean;
}

export interface GroupSettings {
  isPublic: boolean;
  allowMemberInvites: boolean;
  requireAdminApproval: boolean;
  muteNotifications: boolean;
}

// Authentication Types
export interface AuthCredentials {
  phoneNumber: string;
  verificationCode?: string;
  password?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Notification Types
export interface NotificationData {
  id: string;
  type: 'MESSAGE' | 'MENTION' | 'GROUP_INVITE' | 'SYSTEM';
  title: string;
  body: string;
  data?: any;
  createdAt: Date;
}

// Settings Types
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  language: string;
}

export interface NotificationSettings {
  enabled: boolean;
  showPreview: boolean;
  sound: boolean;
  vibration: boolean;
  messageNotifications: boolean;
  groupNotifications: boolean;
}

export interface PrivacySettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showProfilePhoto: boolean;
  showReadReceipts: boolean;
  blockedUsers: string[];
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Verification: { phoneNumber: string; mode?: 'register' | 'login' };
  Welcome: { phoneNumber: string; verificationCode?: string };
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Groups: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { conversationId: string; recipientName: string };
  NewChat: undefined;
  GroupChat: { groupId: string };
  GroupInfo: { groupId: string };
  CreateGroup: undefined;
  ArchivedChats: undefined;
  UserProfile: { userId: string; userName: string; userPhone?: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Notifications: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  TermsPrivacy: undefined;
  Language: undefined;
};

// Socket Events
export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_READ = 'message:read',
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
}

// Media Upload Types
export interface MediaUploadOptions {
  uri: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  size?: number;
}

export interface MediaUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
