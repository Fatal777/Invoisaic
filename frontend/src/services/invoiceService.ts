import { apiClient } from './api';
import { Invoice, InvoiceFormData, APIResponse, PaginatedResponse } from '../types';

export const invoiceService = {
  async getInvoices(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    customerId?: string;
  }): Promise<PaginatedResponse<Invoice>> {
    return apiClient.get<PaginatedResponse<Invoice>>('/invoices', params);
  },

  async getInvoice(id: string): Promise<APIResponse<Invoice>> {
    return apiClient.get<APIResponse<Invoice>>(`/invoices/${id}`);
  },

  async createInvoice(data: InvoiceFormData): Promise<APIResponse<Invoice>> {
    return apiClient.post<APIResponse<Invoice>>('/invoices', data);
  },

  async updateInvoice(id: string, data: Partial<InvoiceFormData>): Promise<APIResponse<Invoice>> {
    return apiClient.put<APIResponse<Invoice>>(`/invoices/${id}`, data);
  },

  async deleteInvoice(id: string): Promise<APIResponse<void>> {
    return apiClient.delete<APIResponse<void>>(`/invoices/${id}`);
  },

  async sendInvoice(id: string): Promise<APIResponse<Invoice>> {
    return apiClient.post<APIResponse<Invoice>>(`/invoices/${id}/send`);
  },

  async markAsPaid(id: string): Promise<APIResponse<Invoice>> {
    return apiClient.post<APIResponse<Invoice>>(`/invoices/${id}/mark-paid`);
  },

  async getAIRecommendations(id: string): Promise<APIResponse<any>> {
    return apiClient.get<APIResponse<any>>(`/invoices/${id}/ai-recommendations`);
  },
};
