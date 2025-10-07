/**
 * OCR Demo Data
 * Static data, templates, and configuration for the OCR demo
 */

import { DocumentTemplate, DocumentType, DocumentCategory, ValidationRule, OCRSettings, UserPreferences } from './types';

export const SUPPORTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp',
  'image/tiff',
  'application/pdf'
];

export const SUPPORTED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.bmp',
  '.webp',
  '.tiff',
  '.tif',
  '.pdf'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILES_PER_BATCH = 10;

export const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string; description: string; icon: string }> = [
  { value: 'invoice', label: 'Invoice', description: 'Business invoices and bills', icon: '📄' },
  { value: 'receipt', label: 'Receipt', description: 'Purchase receipts and vouchers', icon: '🧾' },
  { value: 'business_card', label: 'Business Card', description: 'Contact information cards', icon: '💼' },
  { value: 'id_card', label: 'ID Card', description: 'Identity cards and licenses', icon: '🆔' },
  { value: 'passport', label: 'Passport', description: 'Passport documents', icon: '📘' },
  { value: 'driver_license', label: 'Driver License', description: 'Driving licenses', icon: '🚗' },
  { value: 'bank_statement', label: 'Bank Statement', description: 'Financial statements', icon: '🏦' },
  { value: 'tax_document', label: 'Tax Document', description: 'Tax forms and returns', icon: '📊' },
  { value: 'contract', label: 'Contract', description: 'Legal contracts and agreements', icon: '📋' },
  { value: 'form', label: 'Form', description: 'Application and registration forms', icon: '📝' },
  { value: 'certificate', label: 'Certificate', description: 'Certificates and diplomas', icon: '🏆' },
  { value: 'other', label: 'Other', description: 'Other document types', icon: '📄' }
];

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' }
];

export const QUALITY_SETTINGS = [
  {
    value: 'speed' as const,
    label: 'Speed',
    description: 'Fast processing with good accuracy',
    icon: '⚡',
    processingTime: '2-5 seconds',
    accuracy: '85-90%',
    cost: 'Low'
  },
  {
    value: 'balanced' as const,
    label: 'Balanced',
    description: 'Optimal balance of speed and accuracy',
    icon: '⚖️',
    processingTime: '5-10 seconds',
    accuracy: '90-95%',
    cost: 'Medium'
  },
  {
    value: 'accuracy' as const,
    label: 'Accuracy',
    description: 'Maximum accuracy with slower processing',
    icon: '🎯',
    processingTime: '10-20 seconds',
    accuracy: '95-99%',
    cost: 'High'
  }
];

export const EXPORT_FORMATS = [
  {
    value: 'json' as const,
    label: 'JSON',
    description: 'JavaScript Object Notation',
    icon: '{ }',
    extension: '.json',
    mimeType: 'application/json'
  },
  {
    value: 'csv' as const,
    label: 'CSV',
    description: 'Comma Separated Values',
    icon: '📊',
    extension: '.csv',
    mimeType: 'text/csv'
  },
  {
    value: 'xlsx' as const,
    label: 'Excel',
    description: 'Microsoft Excel Spreadsheet',
    icon: '📈',
    extension: '.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  {
    value: 'pdf' as const,
    label: 'PDF',
    description: 'Portable Document Format',
    icon: '📄',
    extension: '.pdf',
    mimeType: 'application/pdf'
  },
  {
    value: 'xml' as const,
    label: 'XML',
    description: 'Extensible Markup Language',
    icon: '< >',
    extension: '.xml',
    mimeType: 'application/xml'
  }
];

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'invoice-standard',
    name: 'Standard Invoice',
    description: 'Common business invoice format',
    category: 'financial',
    confidence: 95,
    usage: 1247,
    tags: ['invoice', 'business', 'billing'],
    fields: [
      { key: 'invoice_number', label: 'Invoice Number', type: 'text', required: true, examples: ['INV-001', 'INV-2024-001'] },
      { key: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, examples: ['2024-01-15', '15/01/2024'] },
      { key: 'due_date', label: 'Due Date', type: 'date', required: false, examples: ['2024-02-15', '15/02/2024'] },
      { key: 'vendor_name', label: 'Vendor Name', type: 'text', required: true, examples: ['ABC Corp', 'Tech Solutions Ltd'] },
      { key: 'vendor_address', label: 'Vendor Address', type: 'address', required: false },
      { key: 'customer_name', label: 'Customer Name', type: 'text', required: true },
      { key: 'customer_address', label: 'Customer Address', type: 'address', required: false },
      { key: 'subtotal', label: 'Subtotal', type: 'currency', required: true, examples: ['$1,000.00', '₹75,000'] },
      { key: 'tax_amount', label: 'Tax Amount', type: 'currency', required: false, examples: ['$180.00', '₹13,500'] },
      { key: 'total_amount', label: 'Total Amount', type: 'currency', required: true, examples: ['$1,180.00', '₹88,500'] },
      { key: 'payment_terms', label: 'Payment Terms', type: 'text', required: false, examples: ['Net 30', 'Due on receipt'] }
    ],
    validationRules: [
      { field: 'invoice_number', type: 'required', errorMessage: 'Invoice number is required' },
      { field: 'total_amount', type: 'required', errorMessage: 'Total amount is required' },
      { field: 'invoice_date', type: 'format', pattern: /^\d{4}-\d{2}-\d{2}$/, errorMessage: 'Invalid date format' }
    ]
  },
  {
    id: 'receipt-retail',
    name: 'Retail Receipt',
    description: 'Store purchase receipts',
    category: 'financial',
    confidence: 92,
    usage: 856,
    tags: ['receipt', 'retail', 'purchase'],
    fields: [
      { key: 'store_name', label: 'Store Name', type: 'text', required: true },
      { key: 'store_address', label: 'Store Address', type: 'address', required: false },
      { key: 'receipt_number', label: 'Receipt Number', type: 'text', required: false },
      { key: 'transaction_date', label: 'Transaction Date', type: 'date', required: true },
      { key: 'transaction_time', label: 'Transaction Time', type: 'text', required: false },
      { key: 'cashier_id', label: 'Cashier ID', type: 'text', required: false },
      { key: 'items', label: 'Items', type: 'text', required: true },
      { key: 'subtotal', label: 'Subtotal', type: 'currency', required: true },
      { key: 'tax', label: 'Tax', type: 'currency', required: false },
      { key: 'total', label: 'Total', type: 'currency', required: true },
      { key: 'payment_method', label: 'Payment Method', type: 'text', required: false }
    ],
    validationRules: [
      { field: 'store_name', type: 'required', errorMessage: 'Store name is required' },
      { field: 'total', type: 'required', errorMessage: 'Total amount is required' }
    ]
  },
  {
    id: 'business-card',
    name: 'Business Card',
    description: 'Professional contact cards',
    category: 'business',
    confidence: 88,
    usage: 634,
    tags: ['contact', 'business', 'networking'],
    fields: [
      { key: 'full_name', label: 'Full Name', type: 'text', required: true },
      { key: 'job_title', label: 'Job Title', type: 'text', required: false },
      { key: 'company_name', label: 'Company Name', type: 'text', required: false },
      { key: 'email', label: 'Email', type: 'email', required: false },
      { key: 'phone', label: 'Phone', type: 'phone', required: false },
      { key: 'mobile', label: 'Mobile', type: 'phone', required: false },
      { key: 'website', label: 'Website', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
      { key: 'linkedin', label: 'LinkedIn', type: 'text', required: false }
    ],
    validationRules: [
      { field: 'full_name', type: 'required', errorMessage: 'Full name is required' },
      { field: 'email', type: 'format', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, errorMessage: 'Invalid email format' }
    ]
  },
  {
    id: 'id-card',
    name: 'ID Card',
    description: 'Government issued ID cards',
    category: 'identity',
    confidence: 94,
    usage: 423,
    tags: ['identity', 'government', 'verification'],
    fields: [
      { key: 'full_name', label: 'Full Name', type: 'text', required: true },
      { key: 'id_number', label: 'ID Number', type: 'text', required: true },
      { key: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
      { key: 'gender', label: 'Gender', type: 'text', required: false },
      { key: 'nationality', label: 'Nationality', type: 'text', required: false },
      { key: 'address', label: 'Address', type: 'address', required: false },
      { key: 'issue_date', label: 'Issue Date', type: 'date', required: false },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date', required: false },
      { key: 'issuing_authority', label: 'Issuing Authority', type: 'text', required: false }
    ],
    validationRules: [
      { field: 'full_name', type: 'required', errorMessage: 'Full name is required' },
      { field: 'id_number', type: 'required', errorMessage: 'ID number is required' }
    ]
  }
];

export const COMMON_FIELDS = [
  { key: 'date', label: 'Date', type: 'date' as const, icon: '📅' },
  { key: 'amount', label: 'Amount', type: 'currency' as const, icon: '💰' },
  { key: 'name', label: 'Name', type: 'text' as const, icon: '👤' },
  { key: 'email', label: 'Email', type: 'email' as const, icon: '📧' },
  { key: 'phone', label: 'Phone', type: 'phone' as const, icon: '📞' },
  { key: 'address', label: 'Address', type: 'address' as const, icon: '📍' },
  { key: 'number', label: 'Number', type: 'number' as const, icon: '#️⃣' },
  { key: 'description', label: 'Description', type: 'text' as const, icon: '📝' }
];

export const DEFAULT_OCR_SETTINGS: OCRSettings = {
  language: ['en'],
  documentType: 'auto',
  quality: 'balanced',
  enableValidation: true,
  enableSuggestions: true,
  outputFormat: 'json',
  includeConfidence: true,
  includeBoundingBoxes: false,
  autoCorrect: true
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultLanguage: ['en'],
  defaultDocumentType: 'invoice',
  defaultQuality: 'balanced',
  autoSave: true,
  showConfidence: true,
  showBoundingBoxes: false,
  enableNotifications: true,
  theme: 'dark',
  exportFormat: 'json',
  maxFileSize: 10,
  allowedFileTypes: SUPPORTED_FILE_TYPES
};

export const PROCESSING_STEPS = [
  {
    id: 'upload',
    name: 'Upload',
    description: 'Uploading document to secure cloud storage',
    estimatedTime: 2
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Analyzing document structure and content',
    estimatedTime: 3
  },
  {
    id: 'extract',
    name: 'Extract',
    description: 'Extracting text and data using Amazon Textract',
    estimatedTime: 8
  },
  {
    id: 'validate',
    name: 'Validate',
    description: 'Validating extracted data and checking accuracy',
    estimatedTime: 2
  },
  {
    id: 'complete',
    name: 'Complete',
    description: 'Processing complete, preparing results',
    estimatedTime: 1
  }
];

export const SAMPLE_DOCUMENTS = [
  {
    id: 'sample-invoice',
    name: 'Sample Invoice.pdf',
    type: 'invoice' as DocumentType,
    description: 'Professional services invoice',
    thumbnail: '📄',
    size: '245 KB',
    expectedFields: ['invoice_number', 'date', 'vendor_name', 'total_amount']
  },
  {
    id: 'sample-receipt',
    name: 'Store Receipt.jpg',
    type: 'receipt' as DocumentType,
    description: 'Retail purchase receipt',
    thumbnail: '🧾',
    size: '156 KB',
    expectedFields: ['store_name', 'date', 'items', 'total']
  },
  {
    id: 'sample-business-card',
    name: 'Business Card.png',
    type: 'business_card' as DocumentType,
    description: 'Executive business card',
    thumbnail: '💼',
    size: '89 KB',
    expectedFields: ['name', 'title', 'company', 'email', 'phone']
  }
];

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 10MB',
  INVALID_FILE_TYPE: 'File type not supported. Please upload an image or PDF file',
  UPLOAD_FAILED: 'Failed to upload file. Please try again',
  PROCESSING_FAILED: 'Failed to process document. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_DOCUMENT: 'Document appears to be invalid or corrupted',
  LOW_QUALITY: 'Document quality is too low for accurate extraction',
  NO_TEXT_FOUND: 'No text found in the document',
  EXTRACTION_TIMEOUT: 'Processing timeout. Please try again with a smaller file',
  QUOTA_EXCEEDED: 'Processing quota exceeded. Please try again later',
  VALIDATION_FAILED: 'Data validation failed. Please review the extracted fields'
};

export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'Document uploaded successfully',
  PROCESSING_COMPLETE: 'Document processed successfully',
  EXPORT_SUCCESS: 'Data exported successfully',
  VALIDATION_PASSED: 'All data validation checks passed',
  BATCH_COMPLETE: 'Batch processing completed successfully'
};

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 95,
  MEDIUM: 80,
  LOW: 60
};

export const COST_ESTIMATES = {
  PER_PAGE: 0.0015, // $0.0015 per page
  PER_DOCUMENT: 0.005, // $0.005 per document
  BATCH_DISCOUNT: 0.1 // 10% discount for batch processing
};

export const DEMO_EXTRACTED_DATA = {
  invoice: {
    invoice_number: 'INV-2024-001234',
    invoice_date: '2024-01-15',
    due_date: '2024-02-15',
    vendor_name: 'Tech Solutions LLC',
    vendor_address: '123 Business St, Tech City, TC 12345',
    customer_name: 'Demo Customer Corp',
    customer_address: '456 Client Ave, Customer City, CC 67890',
    subtotal: '5234.00',
    tax_amount: '942.12',
    total_amount: '6176.12',
    payment_terms: 'Net 30',
    items_count: '12',
    currency: 'USD'
  },
  receipt: {
    store_name: 'TechMart Electronics',
    store_address: '789 Retail Blvd, Shopping City, SC 11111',
    receipt_number: 'RCP-789456123',
    transaction_date: '2024-01-15',
    transaction_time: '14:32:15',
    cashier_id: 'CSH001',
    items: 'Laptop, Mouse, Keyboard',
    subtotal: '1299.99',
    tax: '104.00',
    total: '1403.99',
    payment_method: 'Credit Card'
  },
  business_card: {
    full_name: 'John Smith',
    job_title: 'Senior Software Engineer',
    company_name: 'Innovation Labs Inc',
    email: 'john.smith@innovationlabs.com',
    phone: '+1 (555) 123-4567',
    mobile: '+1 (555) 987-6543',
    website: 'www.innovationlabs.com',
    address: '100 Innovation Dr, Tech Valley, TV 22222',
    linkedin: 'linkedin.com/in/johnsmith'
  }
};
