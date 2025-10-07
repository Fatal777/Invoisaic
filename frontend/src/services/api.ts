import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<T>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }
}

export const apiClient = new APIClient();

// Invoice API
export const invoiceApi = {
  getInvoice: (id: string) => apiClient.get(`/invoices/${id}`),
  listInvoices: (params?: any) => apiClient.get('/invoices', params),
  createInvoice: (data: any) => apiClient.post('/invoices', data),
  updateInvoice: (id: string, data: any) => apiClient.put(`/invoices/${id}`, data),
  deleteInvoice: (id: string) => apiClient.delete(`/invoices/${id}`),
};

// Customer API
export const customerApi = {
  getCustomer: (id: string) => apiClient.get(`/customers/${id}`),
  listCustomers: (params?: any) => apiClient.get('/customers', params),
  createCustomer: (data: any) => apiClient.post('/customers', data),
  updateCustomer: (id: string, data: any) => apiClient.put(`/customers/${id}`, data),
  deleteCustomer: (id: string) => apiClient.delete(`/customers/${id}`),
};

// Agent API
export const agentApi = {
  getAgentStatus: () => apiClient.get('/agents/status'),
  getAgentInsights: (invoiceId: string) => apiClient.get(`/agents/insights/${invoiceId}`),
};

// Features API
export const featuresApi = {
  // Bulk Invoice Generation
  bulkGenerate: (orders: any[]) => apiClient.post('/features/bulk-generate', { orders }),
  
  // Invoice Validation
  validateInvoice: (invoice: any) => apiClient.post('/features/validate', { invoice }),
  
  // Product Categorization
  categorizeProduct: (productName: string, productDescription: string) => 
    apiClient.post('/features/categorize-product', { productName, productDescription }),
  
  // OCR Invoice Extraction
  ocrInvoice: (imageBase64: string, documentType: string) => 
    apiClient.post('/features/ocr-invoice', { imageBase64, documentType }),
  
  // Smart Reconciliation
  reconcileInvoices: (invoices: any[], payments: any[]) => 
    apiClient.post('/features/reconcile', { invoices, payments }),
};

// Demo API
export const demoApi = {
  generateInvoice: (data: any) => apiClient.post('/demo', data),
};
