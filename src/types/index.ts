// User Role Types (App-wide)
export enum UserRole {
  FOUNDER = 'FOUNDER',
  CO_FOUNDER = 'CO_FOUNDER',
  VERIFIED = 'VERIFIED',
  REGULAR = 'REGULAR',
}

// Group Member Role Types
export enum GroupMemberRole {
  FOUNDER = 'FOUNDER',           // Original creator, has all permissions
  ACCOUNTANT = 'ACCOUNTANT',     // Co-founder: manages finances
  MODERATOR = 'MODERATOR',       // Co-founder: upholds ethics/moderation
  RECRUITER = 'RECRUITER',       // Co-founder: vets who gets into community
  SUPPORT = 'SUPPORT',           // Co-founder: helps members with challenges
  CHEERLEADER = 'CHEERLEADER',   // Co-founder: keeps community active
  MEMBER = 'MEMBER',             // Regular member
}

// Role display names
export const GROUP_ROLE_DISPLAY: Record<GroupMemberRole, string> = {
  [GroupMemberRole.FOUNDER]: 'Founder',
  [GroupMemberRole.ACCOUNTANT]: 'Accountant (Co-founder)',
  [GroupMemberRole.MODERATOR]: 'Moderator (Co-founder)',
  [GroupMemberRole.RECRUITER]: 'Recruiter (Co-founder)',
  [GroupMemberRole.SUPPORT]: 'Support (Co-founder)',
  [GroupMemberRole.CHEERLEADER]: 'Cheer Leader (Co-founder)',
  [GroupMemberRole.MEMBER]: 'Member',
};

// Helper to check if role is co-founder
export const isCofounderRole = (role: GroupMemberRole | string): boolean => {
  const cofounderRoles = [
    GroupMemberRole.ACCOUNTANT,
    GroupMemberRole.MODERATOR,
    GroupMemberRole.RECRUITER,
    GroupMemberRole.SUPPORT,
    GroupMemberRole.CHEERLEADER,
  ];
  return cofounderRoles.includes(role as GroupMemberRole);
};

// Helper to check if role has admin privileges
export const isAdminRole = (role: GroupMemberRole | string): boolean => {
  return role === GroupMemberRole.FOUNDER || isCofounderRole(role);
};

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
  CONTACT = 'CONTACT',
  VOICE = 'VOICE',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

// Reply To Interface for message replies
export interface ReplyTo {
  id: string;
  senderName: string;
  content: string;
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
  replyTo?: ReplyTo;
  isEncrypted: boolean;
  isForwarded?: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  // For optimistic media uploads (WhatsApp-style loading)
  localUri?: string;
  isUploading?: boolean;
  uploadProgress?: number;
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
  phone_number?: string;
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
  displayName?: string;
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
  JoinGroup: { inviteCode: string };
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
  ChatRoom: { conversationId: string; recipientName: string; recipientPhone?: string };
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
  Subscriptions: undefined;
  Verification: undefined;
  SocialMedia: undefined;
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
  GROUP_DELETED = 'group:deleted',
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
