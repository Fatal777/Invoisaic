import { apiClient } from './api';
import { DashboardMetrics, RevenueData, PaymentTrend, APIResponse } from '../types';

export const analyticsService = {
  async getDashboardMetrics(): Promise<APIResponse<DashboardMetrics>> {
    return apiClient.get<APIResponse<DashboardMetrics>>('/analytics/dashboard');
  },

  async getRevenueData(period: 'week' | 'month' | 'year'): Promise<APIResponse<RevenueData[]>> {
    return apiClient.get<APIResponse<RevenueData[]>>('/analytics/revenue', { period });
  },

  async getPaymentTrends(period: 'week' | 'month' | 'year'): Promise<APIResponse<PaymentTrend[]>> {
    return apiClient.get<APIResponse<PaymentTrend[]>>('/analytics/payment-trends', { period });
  },

  async getAIInsights(): Promise<APIResponse<any>> {
    return apiClient.get<APIResponse<any>>('/analytics/ai-insights');
  },
};
