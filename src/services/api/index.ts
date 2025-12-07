// Export all API services
export { authService } from './authService';
export { conversationService } from './conversationService';
export { messageService } from './messageService';
export { groupService } from './groupService';
export { mediaService } from './mediaService';
export { userService } from './userService';
export { apiClient } from './client';

// Export types
export type { ConversationListResponse, ConversationCreateRequest } from './conversationService';
export type {
  MessageCreateRequest,
  MessageUpdateRequest,
  MessageForwardRequest,
  MessageListResponse,
  MessageSearchResponse,
} from './messageService';
export type {
  GroupCreateRequest,
  GroupUpdateRequest,
  GroupMember,
  Group,
} from './groupService';
export type { MediaUploadResponse } from './mediaService';
export type { UserSearchResponse, UserStatusResponse } from './userService';
