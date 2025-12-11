import { apiClient } from './client';
import { ApiResponse } from '../../types';

// Types for account service
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  period: string;
  features: string[];
  is_active: boolean;
}

export interface SubscriptionResponse {
  current_plan: string;
  expires_at: string | null;
  plans: SubscriptionPlan[];
}

export interface VerificationStatusResponse {
  is_verified: boolean;
  verification_status: string;
  requested_at: string | null;
}

export interface VerificationRequest {
  full_name: string;
  reason: string;
  social_proof?: string;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  facebook?: string;
}

class AccountService {
  // ============= Subscription Methods =============

  async getSubscriptions(): Promise<ApiResponse<SubscriptionResponse>> {
    return apiClient.get<SubscriptionResponse>('/account/subscriptions');
  }

  async subscribeToPlan(planId: string, paymentMethod?: string): Promise<ApiResponse<any>> {
    return apiClient.post('/account/subscriptions/subscribe', {
      plan_id: planId,
      payment_method: paymentMethod,
    });
  }

  async cancelSubscription(): Promise<ApiResponse<any>> {
    return apiClient.post('/account/subscriptions/cancel');
  }

  async verifyPayment(reference: string): Promise<ApiResponse<any>> {
    return apiClient.post(`/account/subscriptions/verify-payment?reference=${reference}`);
  }

  // ============= Verification Methods =============

  async getVerificationStatus(): Promise<ApiResponse<VerificationStatusResponse>> {
    return apiClient.get<VerificationStatusResponse>('/account/verification/status');
  }

  async requestVerification(request: VerificationRequest): Promise<ApiResponse<any>> {
    return apiClient.post('/account/verification/request', request);
  }

  // ============= Social Media Methods =============

  async getSocialLinks(): Promise<ApiResponse<{ social_links: SocialLinks }>> {
    return apiClient.get<{ social_links: SocialLinks }>('/account/social-links');
  }

  async updateSocialLinks(links: SocialLinks): Promise<ApiResponse<any>> {
    return apiClient.put('/account/social-links', links);
  }

  async disconnectSocialAccount(platform: string): Promise<ApiResponse<any>> {
    return apiClient.delete(`/account/social-links/${platform}`);
  }

  // ============= Profile Methods =============

  async getAccountProfile(): Promise<ApiResponse<any>> {
    return apiClient.get('/account/profile');
  }

  async updateAccountProfile(data: {
    display_name?: string;
    email?: string;
    bio?: string;
  }): Promise<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (data.display_name) params.append('display_name', data.display_name);
    if (data.email) params.append('email', data.email);
    if (data.bio) params.append('bio', data.bio);

    return apiClient.put(`/account/profile?${params.toString()}`);
  }
}

export const accountService = new AccountService();
