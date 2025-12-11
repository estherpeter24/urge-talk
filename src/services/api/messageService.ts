import { apiClient } from './client';
import { Message, MessageType, MessageStatus } from '../../types';

export interface MessageCreateRequest {
  conversation_id: string;
  content: string;
  message_type?: MessageType;
  media_url?: string;
  thumbnail_url?: string;
  audio_duration?: number;
  reply_to_id?: string;
  is_encrypted?: boolean;
}

export interface MessageUpdateRequest {
  content: string;
}

export interface MessageForwardRequest {
  message_ids: string[];
  conversation_id: string;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  limit: number;
  has_more: boolean;
}

export interface MessageSearchResponse {
  messages: Message[];
  total: number;
}

class MessageService {
  async sendMessage(data: MessageCreateRequest) {
    const payload = {
      conversation_id: data.conversation_id,
      content: data.content,
      message_type: data.message_type || 'TEXT',
      media_url: data.media_url,
      thumbnail_url: data.thumbnail_url,
      audio_duration: data.audio_duration,
      reply_to_id: data.reply_to_id,
      is_encrypted: data.is_encrypted || false,
    };

    const response = await apiClient.post<Message>('/messages', payload);
    return response;
  }

  async editMessage(messageId: string, content: string) {
    const response = await apiClient.put<Message>(
      `/messages/${messageId}`,
      { content }
    );
    return response;
  }

  async deleteMessage(messageId: string) {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response;
  }

  async forwardMessages(data: MessageForwardRequest) {
    const response = await apiClient.post('/messages/forward', data);
    return response;
  }

  async starMessage(messageId: string) {
    const response = await apiClient.post(`/messages/${messageId}/star`, {});
    return response;
  }

  async unstarMessage(messageId: string) {
    const response = await apiClient.delete(`/messages/${messageId}/star`);
    return response;
  }

  async getStarredMessages() {
    const response = await apiClient.get<MessageSearchResponse>('/messages/starred');
    return response;
  }

  async searchMessages(query: string, conversationId?: string) {
    let url = `/messages/search?q=${encodeURIComponent(query)}`;
    if (conversationId) {
      url += `&conversationId=${conversationId}`;
    }
    const response = await apiClient.get<MessageSearchResponse>(url);
    return response;
  }

  async updateMessageStatus(messageId: string, status: MessageStatus) {
    // Primary: Try HTTP endpoint to update message status
    // Note: Real-time status updates (typing, online) are handled via Socket.IO
    try {
      const response = await apiClient.put(`/messages/${messageId}/status`, { status });
      return response;
    } catch (error) {
      // If endpoint doesn't exist (404), return success silently
      // Status will be handled by Socket.IO events or conversation.markAsRead
      console.warn('Message status update via API not available, using real-time updates');
      return { success: true };
    }
  }

  async markMessagesAsRead(messageIds: string[]) {
    // Batch update multiple messages as read
    if (messageIds.length === 0) {
      return { success: true };
    }
    try {
      const response = await apiClient.post('/messages/read', { message_ids: messageIds });
      return response;
    } catch (error) {
      console.warn('Batch message read via API not available');
      return { success: true };
    }
  }
}

export const messageService = new MessageService();
