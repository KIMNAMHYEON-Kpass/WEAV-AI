/**
 * Billing API 서비스 (PortOne 일회 결제)
 */

import { apiClient } from './apiClient';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

export interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: string;
  features: string[];
}

export interface PrepareResponse {
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: string;
  payMethod: string;
}

export interface CompleteResponse {
  ok: boolean;
  message: string;
  already_completed?: boolean;
}

/**
 * 가격 플랜 조회 (30일권)
 */
export const getPlans = async (): Promise<Plan[]> => {
  if (FEATURE_FLAGS.hideBillingUI) {
    return [];
  }
  const response = await apiClient.get<{ plans: Plan[] }>('/api/v1/billing/plans/');
  return response.plans;
};

/**
 * 결제 준비 (PortOne SDK 파라미터 반환)
 */
export const preparePayment = async (plan: 'standard' | 'premium'): Promise<PrepareResponse> => {
  if (FEATURE_FLAGS.hideBillingUI) {
    throw new Error('결제 기능이 비활성화되어 있습니다.');
  }
  const response = await apiClient.post<PrepareResponse>('/api/v1/billing/payment/prepare/', {
    plan,
  });
  return response;
};

/**
 * 결제 완료 검증 (서버에서 PortOne 조회 후 멤버십 반영)
 */
export const completePayment = async (paymentId: string): Promise<CompleteResponse> => {
  if (FEATURE_FLAGS.hideBillingUI) {
    return { ok: false, message: '결제 기능이 비활성화되어 있습니다.' };
  }
  const response = await apiClient.post<CompleteResponse>('/api/v1/billing/payment/complete/', {
    paymentId,
  });
  return response;
};
