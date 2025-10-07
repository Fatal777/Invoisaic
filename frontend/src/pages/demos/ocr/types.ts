/**
 * OCR Demo Types
 * All TypeScript interfaces and types for the OCR demo
 */

export interface DocumentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  preview?: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  metadata?: {
    width?: number;
    height?: number;
    pages?: number;
    language?: string;
    quality?: 'low' | 'medium' | 'high';
  };
}

export interface ExtractedField {
  key: string;
  value: string | number;
  confidence: number;
  boundingBox?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  type: 'text' | 'number' | 'date' | 'currency' | 'email' | 'phone' | 'address';
  validated: boolean;
  suggestions?: string[];
}

export interface ExtractionResult {
  documentId: string;
  extractedFields: ExtractedField[];
  rawText: string;
  confidence: number;
  processingTime: number;
  timestamp: Date;
  metadata: {
    textractJobId?: string;
    pages: number;
    language: string;
    orientation: number;
    documentType: DocumentType;
    quality: 'low' | 'medium' | 'high';
  };
  errors?: string[];
  warnings?: string[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  pattern?: RegExp;
  min?: number;
  max?: number;
  customValidator?: (value: any) => boolean;
  errorMessage: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: DocumentCategory;
  fields: TemplateField[];
  validationRules: ValidationRule[];
  sampleImage?: string;
  confidence: number;
  usage: number;
  tags: string[];
}

export interface TemplateField {
  key: string;
  label: string;
  type: ExtractedField['type'];
  required: boolean;
  defaultValue?: string;
  description?: string;
  examples?: string[];
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type DocumentType = 
  | 'invoice'
  | 'receipt' 
  | 'business_card'
  | 'id_card'
  | 'passport'
  | 'driver_license'
  | 'bank_statement'
  | 'tax_document'
  | 'contract'
  | 'form'
  | 'certificate'
  | 'other';

export type DocumentCategory = 
  | 'financial'
  | 'identity'
  | 'legal'
  | 'business'
  | 'personal'
  | 'government'
  | 'medical'
  | 'education';

export interface ProcessingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  progress: number;
  details?: string;
  error?: string;
}

export interface OCRSession {
  id: string;
  documents: DocumentFile[];
  results: ExtractionResult[];
  startTime: Date;
  endTime?: Date;
  totalProcessingTime: number;
  totalCost: number;
  status: 'active' | 'completed' | 'error';
  settings: OCRSettings;
  analytics: SessionAnalytics;
}

export interface OCRSettings {
  language: string[];
  documentType: DocumentType | 'auto';
  quality: 'speed' | 'balanced' | 'accuracy';
  enableValidation: boolean;
  enableSuggestions: boolean;
  outputFormat: 'json' | 'csv' | 'xml' | 'pdf';
  includeConfidence: boolean;
  includeBoundingBoxes: boolean;
  autoCorrect: boolean;
  customFields?: string[];
}

export interface SessionAnalytics {
  documentsProcessed: number;
  fieldsExtracted: number;
  averageConfidence: number;
  averageProcessingTime: number;
  errorRate: number;
  mostCommonFields: string[];
  documentTypeDistribution: Record<DocumentType, number>;
  qualityDistribution: Record<string, number>;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'xml';
  includeMetadata: boolean;
  includeConfidence: boolean;
  includeBoundingBoxes: boolean;
  includeRawText: boolean;
  fieldsToInclude: string[];
  groupBy?: 'document' | 'field' | 'type';
  sortBy?: 'confidence' | 'timestamp' | 'field' | 'value';
  sortOrder: 'asc' | 'desc';
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'upload' | 'processing' | 'extraction' | 'validation' | 'export' | 'system';
  message: string;
  details?: string;
  documentId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
  processingTime?: number;
  cost?: number;
}

export interface TextractResponse {
  success: boolean;
  confidence: number;
  extractedData: Record<string, any>;
  rawText: string;
  processingTime: number;
  jobId?: string;
  pages: number;
  metadata: {
    documentType: DocumentType;
    language: string;
    orientation: number;
    quality: string;
  };
}

export interface ValidationResult {
  field: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  confidence: number;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: 'uppercase' | 'lowercase' | 'trim' | 'format_date' | 'format_currency' | 'custom';
  customTransform?: (value: any) => any;
  required: boolean;
  defaultValue?: any;
}

export interface BatchProcessingJob {
  id: string;
  name: string;
  documents: DocumentFile[];
  settings: OCRSettings;
  status: 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  results: ExtractionResult[];
  errors: string[];
  totalCost: number;
  estimatedTime?: number;
}

export interface ComparisonResult {
  documentA: string;
  documentB: string;
  similarities: number;
  differences: FieldComparison[];
  confidence: number;
  timestamp: Date;
}

export interface FieldComparison {
  field: string;
  valueA: any;
  valueB: any;
  match: boolean;
  similarity: number;
  type: 'exact' | 'partial' | 'different' | 'missing';
}

export interface OCRMetrics {
  totalDocuments: number;
  totalFields: number;
  averageConfidence: number;
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
  costPerDocument: number;
  throughput: number; // documents per hour
  accuracy: number;
  topDocumentTypes: Array<{ type: DocumentType; count: number }>;
  topFields: Array<{ field: string; count: number; avgConfidence: number }>;
  qualityMetrics: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface UserPreferences {
  defaultLanguage: string[];
  defaultDocumentType: DocumentType;
  defaultQuality: OCRSettings['quality'];
  autoSave: boolean;
  showConfidence: boolean;
  showBoundingBoxes: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  exportFormat: ExportOptions['format'];
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
}

export interface NotificationSettings {
  processingComplete: boolean;
  errorOccurred: boolean;
  lowConfidence: boolean;
  batchComplete: boolean;
  systemUpdates: boolean;
  email: boolean;
  browser: boolean;
  sound: boolean;
}

export type OCRStep = 
  | 'upload'
  | 'preview'
  | 'processing'
  | 'extraction'
  | 'validation'
  | 'export'
  | 'complete';

export type FileUploadStatus = 
  | 'idle'
  | 'selecting'
  | 'uploading'
  | 'uploaded'
  | 'error';

export type ProcessingStatus = 
  | 'idle'
  | 'initializing'
  | 'uploading'
  | 'analyzing'
  | 'extracting'
  | 'validating'
  | 'completing'
  | 'complete'
  | 'error';

export interface ProgressInfo {
  step: OCRStep;
  progress: number;
  message: string;
  details?: string;
  estimatedTimeRemaining?: number;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
  suggestions?: string[];
}

export interface SuccessInfo {
  message: string;
  details?: string;
  timestamp: Date;
  data?: any;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
