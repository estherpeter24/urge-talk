import { apiClient } from './client';

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
  is_public?: boolean;
  allow_member_invites?: boolean;
  require_admin_approval?: boolean;
}

export interface GroupMember {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  role: 'ADMIN' | 'MEMBER';
  permissions?: any;
  joined_at: string;
}

export interface Group {
  id: string;
  conversation_id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  is_public: boolean;
  allow_member_invites: boolean;
  require_admin_approval: boolean;
  members: GroupMember[];
  created_at: string;
  updated_at: string;
}

class GroupService {
  async createGroup(data: GroupCreateRequest) {
    const response = await apiClient.post<Group>('/groups', data);
    return response;
  }

  async getGroup(groupId: string) {
    const response = await apiClient.get<Group>(`/groups/${groupId}`);
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

  async updateMemberRole(groupId: string, userId: string, role: 'ADMIN' | 'MEMBER') {
    const response = await apiClient.put(`/groups/${groupId}/members/${userId}/role`, {
      role,
    });
    return response;
  }

  async leaveGroup(groupId: string) {
    const response = await apiClient.post(`/groups/${groupId}/leave`, {});
    return response;
  }

  async getMembers(groupId: string) {
    const response = await apiClient.get<GroupMember[]>(`/groups/${groupId}/members`);
    return response;
  }
}

export const groupService = new GroupService();
