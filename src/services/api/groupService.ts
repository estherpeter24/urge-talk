import { apiClient } from './client';
import { GroupMemberRole } from '../../types';

// Group Role Types
export type GroupRole = 'FOUNDER' | 'ACCOUNTANT' | 'MODERATOR' | 'RECRUITER' | 'SUPPORT' | 'CHEERLEADER' | 'MEMBER';

export interface GroupCreateRequest {
  name: string;
  description?: string;
  avatar_url?: string;
  member_ids: string[];
  is_public?: boolean;
  allow_member_invites?: boolean;
  require_admin_approval?: boolean;
}

export interface GroupUpdateRequest {
  name?: string;
  description?: string;
  avatar_url?: string;
}

export interface GroupSettingsUpdateRequest {
  is_public?: boolean;
  allow_member_invites?: boolean;
  require_admin_approval?: boolean;
  only_admins_can_post?: boolean;
  only_admins_can_edit_info?: boolean;
  invite_link_enabled?: boolean;
  mute_notifications?: boolean;
  theme_color?: string;
}

export interface GroupMember {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  role: GroupRole;
  is_online?: boolean;
  joined_at: string;
}

export interface GroupSettings {
  id: string;
  conversation_id: string;
  is_public: boolean;
  allow_member_invites: boolean;
  require_admin_approval: boolean;
  only_admins_can_post: boolean;
  only_admins_can_edit_info: boolean;
  invite_link: string | null;
  invite_link_enabled: boolean;
  mute_notifications: boolean;
  theme_color: string | null;
}

export interface GroupEvent {
  id: string;
  conversation_id: string;
  created_by: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  is_online: boolean;
  meeting_link?: string;
  max_attendees?: number;
  attendees_count: number;
  created_at: string;
  updated_at: string;
}

export interface EventCreateRequest {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  is_online?: boolean;
  meeting_link?: string;
  max_attendees?: number;
}

export interface Group {
  id: string;
  conversation_id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  member_count: number;
  current_user_role: GroupRole;
  settings: GroupSettings;
  members: GroupMember[];
  created_at: string;
  updated_at: string;
}

// Helper functions for role checks
export const isCofounderRole = (role: GroupRole): boolean => {
  return ['ACCOUNTANT', 'MODERATOR', 'RECRUITER', 'SUPPORT', 'CHEERLEADER'].includes(role);
};

export const isAdminRole = (role: GroupRole): boolean => {
  return role === 'FOUNDER' || isCofounderRole(role);
};

export const getRoleDisplayName = (role: GroupRole): string => {
  const displayNames: Record<GroupRole, string> = {
    FOUNDER: 'Founder',
    ACCOUNTANT: 'Accountant (Co-founder)',
    MODERATOR: 'Moderator (Co-founder)',
    RECRUITER: 'Recruiter (Co-founder)',
    SUPPORT: 'Support (Co-founder)',
    CHEERLEADER: 'Cheer Leader (Co-founder)',
    MEMBER: 'Member',
  };
  return displayNames[role] || 'Member';
};

class GroupService {
  // Group CRUD
  async createGroup(data: GroupCreateRequest) {
    const response = await apiClient.post<Group>('/groups', data);
    return response;
  }

  async getGroup(groupId: string) {
    const response = await apiClient.get<Group>(`/groups/${groupId}`);
    return response;
  }

  async getGroupByConversation(conversationId: string) {
    const response = await apiClient.get<Group>(`/groups/conversation/${conversationId}`);
    return response;
  }

  async updateGroup(groupId: string, data: GroupUpdateRequest) {
    const response = await apiClient.put(`/groups/${groupId}`, data);
    return response;
  }

  async deleteGroup(groupId: string) {
    const response = await apiClient.delete(`/groups/${groupId}`);
    return response;
  }

  // Settings management (Founder only)
  async updateSettings(groupId: string, data: GroupSettingsUpdateRequest) {
    const response = await apiClient.put(`/groups/${groupId}/settings`, data);
    return response;
  }

  async regenerateInviteLink(groupId: string) {
    const response = await apiClient.post<{ invite_link: string }>(`/groups/${groupId}/regenerate-invite-link`, {});
    return response;
  }

  // Member management
  async getMembers(groupId: string) {
    const response = await apiClient.get<GroupMember[]>(`/groups/${groupId}/members`);
    return response;
  }

  async addMembers(groupId: string, userIds: string[]) {
    const response = await apiClient.post(`/groups/${groupId}/members`, {
      user_ids: userIds,
    });
    return response;
  }

  async removeMember(groupId: string, userId: string) {
    const response = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
    return response;
  }

  async updateMemberRole(groupId: string, userId: string, role: GroupRole) {
    const response = await apiClient.put(`/groups/${groupId}/members/${userId}/role`, {
      role,
    });
    return response;
  }

  async leaveGroup(groupId: string) {
    const response = await apiClient.post(`/groups/${groupId}/leave`, {});
    return response;
  }

  async transferOwnership(groupId: string, newFounderId: string) {
    const response = await apiClient.post(`/groups/${groupId}/transfer-ownership`, {
      new_founder_id: newFounderId,
    });
    return response;
  }

  // Events management
  async getEvents(groupId: string) {
    const response = await apiClient.get<GroupEvent[]>(`/groups/${groupId}/events`);
    return response;
  }

  async createEvent(groupId: string, data: EventCreateRequest) {
    const response = await apiClient.post<GroupEvent>(`/groups/${groupId}/events`, data);
    return response;
  }

  async deleteEvent(groupId: string, eventId: string) {
    const response = await apiClient.delete(`/groups/${groupId}/events/${eventId}`);
    return response;
  }

  async attendEvent(groupId: string, eventId: string, status: 'going' | 'maybe' | 'not_going') {
    const response = await apiClient.post(`/groups/${groupId}/events/${eventId}/attend`, {
      status,
    });
    return response;
  }

  // Invite link
  async getGroupByInvite(inviteCode: string) {
    const response = await apiClient.get<{ group: Group; is_member: boolean }>(`/groups/join/${inviteCode}`);
    return response;
  }

  async joinByInvite(inviteCode: string) {
    const response = await apiClient.post(`/groups/join/${inviteCode}`, {});
    return response;
  }
}

export const groupService = new GroupService();
