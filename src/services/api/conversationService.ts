import { apiClient } from './client';
import { Conversation } from '../../types';

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConversationCreateRequest {
  type: 'DIRECT' | 'GROUP';
  participant_ids: string[];
  name?: string;
  avatar_url?: string;
}

class ConversationService {
  async getConversations(limit = 50, offset = 0) {
    const response = await apiClient.get<ConversationListResponse>(
      `/conversations?limit=${limit}&offset=${offset}`
    );
    return response;
  }

  async getConversation(id: string) {
    const response = await apiClient.get<Conversation>(`/conversations/${id}`);
    return response;
  }

  async getArchivedConversations(limit = 50, offset = 0) {
    const response = await apiClient.get<ConversationListResponse>(
      `/conversations/archived?limit=${limit}&offset=${offset}`
    );
    return response;
  }

  async createConversation(data: ConversationCreateRequest) {
    const response = await apiClient.post<Conversation>('/conversations', data);
    return response;
  }

  async deleteConversation(id: string) {
    const response = await apiClient.delete(`/conversations/${id}`);
    return response;
  }

  async getMessages(conversationId: string, limit = 50, before?: string) {
    let url = `/conversations/${conversationId}/messages?limit=${limit}`;
    if (before) {
      url += `&before=${before}`;
    }
    const response = await apiClient.get(url);
    return response;
  }

  async markAsRead(conversationId: string) {
    const response = await apiClient.put(`/conversations/${conversationId}/read`, {});
    return response;
  }

  async archiveConversation(conversationId: string) {
    const response = await apiClient.put(`/conversations/${conversationId}/archive`, {});
    return response;
  }

  async unarchiveConversation(conversationId: string) {
    const response = await apiClient.put(`/conversations/${conversationId}/unarchive`, {});
    return response;
  }

  async muteConversation(conversationId: string) {
    const response = await apiClient.put(`/conversations/${conversationId}/mute`, {});
    return response;
  }

  async unmuteConversation(conversationId: string) {
    const response = await apiClient.put(`/conversations/${conversationId}/unmute`, {});
    return response;
  }

  async toggleFavorite(conversationId: string) {
    const response = await apiClient.put(`/conversations/${conversationId}/favorite`, {});
    return response;
  }

  async clearHistory(conversationId: string) {
    const response = await apiClient.delete(`/conversations/${conversationId}/clear`);
    return response;
  }
}

export const conversationService = new ConversationService();
