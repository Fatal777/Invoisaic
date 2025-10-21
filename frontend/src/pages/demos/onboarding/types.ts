/**
 * Onboarding Demo Types
 * All TypeScript interfaces for company onboarding and invoice generation
 */

export interface Company {
  id?: string;
  name: string;
  gstin: string;
  pan?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    mobile?: string;
    website?: string;
  };
  banking?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
  };
  tax: {
    gstin: string;
    pan: string;
    taxType: 'regular' | 'composition' | 'exempted';
    registrationDate?: string;
  };
  business: {
    type: 'proprietorship' | 'partnership' | 'private_limited' | 'public_limited' | 'llp';
    industry: string;
    yearEstablished?: number;
    employeeCount?: number;
  };
  logo?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  hsn: string;
  sac?: string;
  category: string;
  unit: 'pcs' | 'kg' | 'ltr' | 'mtr' | 'box' | 'set' | 'hrs' | 'days';
  price: number;
  mrp?: number;
  cost?: number;
  gst: number;
  cess?: number;
  stock?: number;
  minStock?: number;
  barcode?: string;
  sku: string;
  isService: boolean;
  isActive: boolean;
  images?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id?: string;
  name: string;
  gstin?: string;
  pan?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    email: string;
    phone: string;
    mobile?: string;
  };
  type: 'b2b' | 'b2c' | 'export' | 'sez';
  creditLimit?: number;
  creditDays?: number;
  verified: boolean;
}

export interface InvoiceItem {
  id: string;
  product: Product;
  quantity: number;
  rate: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  company: Company;
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  roundOff: number;
  total: number;
  amountInWords: string;
  notes?: string;
  terms?: string[];
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  pdfUrl?: string;
  eInvoiceIRN?: string;
  eWayBillNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GSTINValidation {
  gstin: string;
  isValid: boolean;
  businessName?: string;
  tradeName?: string;
  address?: string;
  state?: string;
  status?: 'active' | 'cancelled' | 'suspended';
  registrationDate?: string;
  taxpayerType?: string;
  errors?: string[];
}

export interface HSNCode {
  code: string;
  description: string;
  gstRate: number;
  category: string;
  subCategory?: string;
  isService: boolean;
}

export interface TaxCalculation {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  roundOff: number;
  total: number;
  taxBreakdown: Array<{
    rate: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
  }>;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  layout: 'standard' | 'modern' | 'classic' | 'minimal';
  colorScheme: string;
  includeCompanyLogo: boolean;
  includeTerms: boolean;
  includeNotes: boolean;
  includeQRCode: boolean;
  includeSignature: boolean;
  customFields?: string[];
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  required: boolean;
  order: number;
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  category: 'company' | 'product' | 'invoice' | 'tax' | 'validation' | 'system';
  message: string;
  details?: string;
  metadata?: Record<string, any>;
}

export interface BulkInvoiceJob {
  id: string;
  name: string;
  company: Company;
  customers: Customer[];
  template: InvoiceTemplate;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  totalInvoices: number;
  generatedInvoices: number;
  errors: string[];
  startTime?: Date;
  endTime?: Date;
}

export interface InvoiceSettings {
  prefix: string;
  startingNumber: number;
  numberFormat: 'sequential' | 'yearly' | 'monthly';
  defaultDueDays: number;
  defaultTerms: string[];
  defaultNotes: string;
  autoRoundOff: boolean;
  includeHSN: boolean;
  includeGSTIN: boolean;
  includePAN: boolean;
  reverseCharge: boolean;
  placeOfSupply: string;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMode: 'cash' | 'cheque' | 'upi' | 'neft' | 'card' | 'other';
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
}

export interface InvoiceAnalytics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  averageInvoiceValue: number;
  topCustomers: Array<{ name: string; amount: number; count: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  taxSummary: {
    totalTax: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
  };
  monthlyRevenue: Array<{ month: string; revenue: number; invoices: number }>;
}

export type OnboardingStepType = 'company' | 'products' | 'customers' | 'invoice' | 'settings' | 'complete';

export type InvoiceType = 'tax_invoice' | 'bill_of_supply' | 'export_invoice' | 'credit_note' | 'debit_note';

export type StateCode = {
  code: string;
  name: string;
  tin: string;
};

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeDetails: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: {
    status?: Invoice['status'][];
    customers?: string[];
    minAmount?: number;
    maxAmount?: number;
  };
}
