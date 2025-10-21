import { apiClient } from './api';
import { Customer, CustomerFormData, APIResponse, PaginatedResponse } from '../types';

export const customerService = {
  async getCustomers(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<Customer>> {
    return apiClient.get<PaginatedResponse<Customer>>('/customers', params);
  },

  async getCustomer(id: string): Promise<APIResponse<Customer>> {
    return apiClient.get<APIResponse<Customer>>(`/customers/${id}`);
  },

  async createCustomer(data: CustomerFormData): Promise<APIResponse<Customer>> {
    return apiClient.post<APIResponse<Customer>>('/customers', data);
  },

  async updateCustomer(id: string, data: Partial<CustomerFormData>): Promise<APIResponse<Customer>> {
    return apiClient.put<APIResponse<Customer>>(`/customers/${id}`, data);
  },

  async deleteCustomer(id: string): Promise<APIResponse<void>> {
    return apiClient.delete<APIResponse<void>>(`/customers/${id}`);
  },

  async getCustomerInsights(id: string): Promise<APIResponse<any>> {
    return apiClient.get<APIResponse<any>>(`/customers/${id}/insights`);
  },
};
