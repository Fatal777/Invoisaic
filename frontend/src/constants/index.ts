/**
 * Application-wide constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// AWS Configuration
export const AWS_CONFIG = {
  REGION: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  COGNITO_CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
};

// Currency Configuration
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1.0 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095 },
] as const;

// Country Configuration
export const COUNTRIES = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    taxName: 'GST',
    taxRate: 0.18,
    taxIdFormat: 'GSTIN',
    taxIdExample: '29ABCDE1234F1Z5',
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    taxName: 'Sales Tax',
    taxRate: 0.07,
    taxIdFormat: 'EIN',
    taxIdExample: '12-3456789',
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    taxName: 'VAT',
    taxRate: 0.19,
    taxIdFormat: 'USt-IdNr',
    taxIdExample: 'DE123456789',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    taxName: 'VAT',
    taxRate: 0.20,
    taxIdFormat: 'VAT Number',
    taxIdExample: 'GB123456789',
  },
] as const;

// Invoice Status
export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'viewed', label: 'Viewed', color: 'purple' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
] as const;

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'debit_card', label: 'Debit Card', icon: '💳' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'paypal', label: 'PayPal', icon: '🌐' },
  { value: 'stripe', label: 'Stripe', icon: '⚡' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'check', label: 'Check', icon: '📝' },
] as const;

// HSN/SAC Codes (India)
export const HSN_CODES = [
  { code: '8471', description: 'Computers and Data Processing Equipment' },
  { code: '8517', description: 'Telephone Sets and Telecommunications' },
  { code: '9983', description: 'Information Technology Services' },
  { code: '998314', description: 'IT Software Services' },
  { code: '9992', description: 'Management Consulting Services' },
  { code: '8544', description: 'Insulated Wire, Cable and Conductors' },
  { code: '9973', description: 'Support Services' },
  { code: '9996', description: 'Other Professional Services' },
] as const;

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD MMM YYYY',
  INPUT: 'YYYY-MM-DD',
  DISPLAY_WITH_TIME: 'DD MMM YYYY HH:mm',
  API: 'YYYY-MM-DD',
};

// Risk Score Thresholds
export const RISK_THRESHOLDS = {
  LOW: 20,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 90,
};

// AI Confidence Thresholds
export const CONFIDENCE_THRESHOLDS = {
  EXCELLENT: 95,
  GOOD: 85,
  FAIR: 70,
  POOR: 50,
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'invoisaic_auth_token',
  USER: 'invoisaic_user',
  THEME: 'invoisaic_theme',
  LANGUAGE: 'invoisaic_language',
  SETTINGS: 'invoisaic_settings',
} as const;

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Toast Configuration
export const TOAST_CONFIG = {
  DURATION: 5000,
  POSITION: 'top-right' as const,
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#EF4444',
  SECONDARY: '#F59E0B',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#3B82F6',
  GRAY: '#6B7280',
};

// Status Colors
export const STATUS_COLORS = {
  draft: '#6B7280',
  sent: '#3B82F6',
  viewed: '#8B5CF6',
  paid: '#10B981',
  overdue: '#EF4444',
  cancelled: '#6B7280',
  verified: '#10B981',
  pending: '#F59E0B',
  flagged: '#EF4444',
};

// Feature Flags
export const FEATURES = {
  AI_INSIGHTS: true,
  FRAUD_DETECTION: true,
  PREDICTIVE_ANALYTICS: true,
  MULTI_CURRENCY: true,
  BATCH_PROCESSING: true,
  REAL_TIME_COLLABORATION: false, // Coming soon
  MOBILE_APP: false, // Coming soon
  WHITE_LABEL: false, // Enterprise only
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  
  // Invoices
  INVOICES: '/invoices',
  INVOICE_DETAIL: (id: string) => `/invoices/${id}`,
  INVOICE_SEND: (id: string) => `/invoices/${id}/send`,
  INVOICE_PAID: (id: string) => `/invoices/${id}/mark-paid`,
  
  // Customers
  CUSTOMERS: '/customers',
  CUSTOMER_DETAIL: (id: string) => `/customers/${id}`,
  
  // Documents
  DOCUMENT_UPLOAD: '/document-upload',
  DOCUMENT_PROCESS: '/document-process',
  
  // Search
  SEARCH: '/search',
  
  // Bedrock Agent
  AGENTIC_DEMO: '/agentic-demo',
  
  // Features
  BULK_GENERATE: '/features/bulk-generate',
  VALIDATE: '/features/validate',
  CATEGORIZE: '/features/categorize-product',
  OCR: '/features/ocr-invoice',
  RECONCILE: '/features/reconcile',
  
  // Analytics
  DASHBOARD: '/analytics/dashboard',
  
  // Agents
  AGENTS: '/agents',
  AGENT_DETAIL: (id: string) => `/agents/${id}`,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'Access forbidden.',
  NOT_FOUND: 'Resource not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: `File size exceeds ${FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB limit.`,
  INVALID_FILE_TYPE: `Only ${FILE_UPLOAD.ALLOWED_TYPES.join(', ')} files are allowed.`,
};

// Success Messages
export const SUCCESS_MESSAGES = {
  INVOICE_CREATED: 'Invoice created successfully!',
  INVOICE_UPDATED: 'Invoice updated successfully!',
  INVOICE_DELETED: 'Invoice deleted successfully!',
  INVOICE_SENT: 'Invoice sent successfully!',
  CUSTOMER_CREATED: 'Customer created successfully!',
  CUSTOMER_UPDATED: 'Customer updated successfully!',
  DOCUMENT_UPLOADED: 'Document uploaded successfully!',
  DOCUMENT_PROCESSED: 'Document processed successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
};

// External Links
export const EXTERNAL_LINKS = {
  DOCUMENTATION: 'https://docs.invoisaic.com',
  API_DOCS: 'https://api.invoisaic.com/docs',
  STATUS: 'https://status.invoisaic.com',
  SUPPORT: 'mailto:support@invoisaic.com',
  TWITTER: 'https://twitter.com/invoisaic',
  GITHUB: 'https://github.com/invoisaic',
};

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  VAT_DE: /^DE[0-9]{9}$/,
  VAT_GB: /^GB([0-9]{9}|[0-9]{12})$/,
  EIN: /^[0-9]{2}-?[0-9]{7}$/,
};

export default {
  API_CONFIG,
  AWS_CONFIG,
  CURRENCIES,
  COUNTRIES,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
  HSN_CODES,
  FILE_UPLOAD,
  PAGINATION,
  DATE_FORMATS,
  RISK_THRESHOLDS,
  CONFIDENCE_THRESHOLDS,
  NOTIFICATION_TYPES,
  STORAGE_KEYS,
  ANIMATION_DURATION,
  TOAST_CONFIG,
  CHART_COLORS,
  STATUS_COLORS,
  FEATURES,
  ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  EXTERNAL_LINKS,
  PATTERNS,
};
