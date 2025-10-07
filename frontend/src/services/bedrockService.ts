/**
 * Bedrock Agent Service
 * Handles all Bedrock-related API calls
 */

import { apiClient } from './api';

export interface AgentRequest {
  action: string;
  data: any;
}

export interface AgentResponse {
  success: boolean;
  logs?: string[];
  phases?: any[];
  invoice?: any;
  marketAnalysis?: any;
  fraudAnalysis?: any;
  error?: string;
}

export interface SearchRequest {
  query: string;
  type?: 'all' | 'invoices' | 'customers' | 'knowledge';
  filters?: any;
}

export interface SearchResponse {
  query: string;
  results: {
    invoices?: { items: any[]; total: number };
    customers?: { items: any[]; total: number };
    knowledge?: { items: any[]; total: number };
  };
  timestamp: string;
}

export interface DocumentUploadRequest {
  fileKey: string;
  fileType: string;
  action?: 'extract-invoice' | 'extract-receipt' | 'extract-general';
}

export interface DocumentProcessResponse {
  success: boolean;
  extractedData?: any;
  confidence?: number;
  processingTime?: number;
  rawData?: any;
}

export const bedrockService = {
  /**
   * Invoke Bedrock Agent for agentic workflows
   */
  async invokeAgent(request: AgentRequest): Promise<AgentResponse> {
    const response = await apiClient.post<AgentResponse>('/agentic-demo', request);
    return response;
  },

  /**
   * Semantic search using Titan Embeddings
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await apiClient.post<SearchResponse>('/search', request);
    return response;
  },

  /**
   * Process document with Textract
   */
  async processDocument(request: DocumentUploadRequest): Promise<DocumentProcessResponse> {
    const response = await apiClient.post<DocumentProcessResponse>('/document-process', request);
    return response;
  },

  /**
   * Query Knowledge Base
   */
  async queryKnowledgeBase(query: string): Promise<any> {
    const response = await this.search({
      query,
      type: 'knowledge',
    });
    return response.results.knowledge;
  },

  /**
   * Get AI insights for dashboard
   */
  async getAIInsights(): Promise<any[]> {
    // This would call a dedicated insights endpoint
    // For now, returning mock structure
    return [
      {
        type: 'prediction',
        title: 'Revenue Forecast',
        message: 'Expected revenue increase of 12% next month',
        confidence: 94,
      },
      {
        type: 'fraud',
        title: 'Fraud Alert',
        message: '2 suspicious transactions detected',
        confidence: 87,
      },
    ];
  },

  /**
   * Analyze invoice for compliance
   */
  async analyzeCompliance(invoiceData: any): Promise<any> {
    const response = await apiClient.post('/features/validate', {
      invoice: invoiceData,
    });
    return response;
  },

  /**
   * Categorize product using AI
   */
  async categorizeProduct(productName: string, description: string): Promise<any> {
    const response = await apiClient.post('/features/categorize-product', {
      productName,
      description,
    });
    return response;
  },

  /**
   * Reconcile payment with AI
   */
  async reconcilePayment(invoice: any, payment: any): Promise<any> {
    const response = await apiClient.post('/features/reconcile', {
      invoice,
      payment,
    });
    return response;
  },

  /**
   * Bulk generate invoices
   */
  async bulkGenerate(invoices: any[]): Promise<any> {
    const response = await apiClient.post('/features/bulk-generate', {
      invoices,
    });
    return response;
  },
};

export default bedrockService;
