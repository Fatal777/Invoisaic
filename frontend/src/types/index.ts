// Core domain types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
  paymentTerms: string;
  notes?: string;
  aiRecommendations?: AIRecommendation[];
  agentProcessing?: AgentProcessingInfo;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 
  | 'draft' 
  | 'pending' 
  | 'sent' 
  | 'viewed' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: Address;
  taxId?: string;
  paymentTerms: string;
  currency: string;
  totalInvoices: number;
  totalRevenue: number;
  averagePaymentDays: number;
  riskScore: number;
  behaviorProfile?: CustomerBehaviorProfile;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CustomerBehaviorProfile {
  paymentReliability: number;
  averagePaymentDelay: number;
  preferredPaymentMethod: string;
  communicationPreference: string;
  seasonalPatterns: string[];
  lifetimeValue: number;
  churnRisk: number;
}

// AI Agent types
export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  currentTask?: string;
  tasksCompleted: number;
  averageProcessingTime: number;
  successRate: number;
  lastActive: string;
}

export type AgentType = 
  | 'supervisor' 
  | 'pricing' 
  | 'compliance' 
  | 'customer_intelligence';

export type AgentStatus = 
  | 'idle' 
  | 'processing' 
  | 'waiting' 
  | 'error';

export interface AgentProcessingInfo {
  supervisorDecision?: string;
  pricingAnalysis?: PricingAnalysis;
  complianceCheck?: ComplianceCheck;
  customerInsights?: CustomerInsights;
  processingTime: number;
  confidence: number;
}

export interface PricingAnalysis {
  recommendedPrice: number;
  volumeDiscount?: number;
  loyaltyAdjustment?: number;
  earlyPaymentDiscount?: number;
  competitiveAnalysis?: string;
  reasoning: string;
}

export interface ComplianceCheck {
  isCompliant: boolean;
  jurisdiction: string;
  taxCalculations: TaxCalculation[];
  regulatoryNotes: string[];
  warnings: string[];
  reasoning: string;
}

export interface TaxCalculation {
  taxType: string;
  rate: number;
  amount: number;
  jurisdiction: string;
}

export interface CustomerInsights {
  paymentProbability: number;
  optimalSendTime: string;
  recommendedTerms: string;
  riskAssessment: string;
  communicationStrategy: string;
  reasoning: string;
}

export interface AIRecommendation {
  type: 'pricing' | 'timing' | 'terms' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  agentSource: AgentType;
}

// Analytics types
export interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  outstandingAmount: number;
  outstandingChange: number;
  averagePaymentDays: number;
  paymentDaysChange: number;
  invoiceCount: number;
  invoiceCountChange: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  invoices: number;
}

export interface PaymentTrend {
  date: string;
  onTime: number;
  late: number;
  overdue: number;
}

export interface AgentPerformance {
  agentName: string;
  tasksCompleted: number;
  successRate: number;
  avgProcessingTime: number;
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form types
export interface InvoiceFormData {
  customerId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: InvoiceItem[];
  notes?: string;
  paymentTerms: string;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: Address;
  taxId?: string;
  paymentTerms: string;
  currency: string;
}
