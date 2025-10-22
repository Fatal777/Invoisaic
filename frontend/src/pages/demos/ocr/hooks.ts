/**
 * OCR Demo Hooks
 * Custom React hooks for file upload, OCR processing, and data management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DocumentFile,
  ExtractionResult,
  ExtractedField,
  LogEntry,
  OCRSettings,
  ProcessingStep,
  ValidationResult,
  ExportOptions,
  APIResponse,
  TextractResponse
} from './types';
import {
  DEFAULT_OCR_SETTINGS,
  MAX_FILE_SIZE,
  SUPPORTED_FILE_TYPES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PROCESSING_STEPS
} from './data';

// File Upload Hook
export const useFileUpload = () => {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileIdCounter = useRef(0);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
    }

    if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: ERROR_MESSAGES.INVALID_FILE_TYPE };
    }

    return { valid: true };
  }, []);

  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  const addFile = useCallback(async (file: File): Promise<{ success: boolean; error?: string; fileId?: string }> => {
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    setIsUploading(true);
    const fileId = `file-${++fileIdCounter.current}`;
    const preview = await createPreview(file);

    const documentFile: DocumentFile = {
      id: fileId,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      preview,
      status: 'pending',
      progress: 0,
      metadata: {
        quality: 'medium'
      }
    };

    setFiles(prev => [...prev, documentFile]);
    setIsUploading(false);

    return { success: true, fileId };
  }, [validateFile, createPreview]);

  const addFiles = useCallback(async (fileList: FileList | File[]): Promise<{ success: boolean; errors: string[] }> => {
    const errors: string[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      const result = await addFile(file);
      if (!result.success && result.error) {
        errors.push(`${file.name}: ${result.error}`);
      }
    }

    return { success: errors.length === 0, errors };
  }, [addFile]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadProgress({});
  }, []);

  const updateFileStatus = useCallback((fileId: string, status: DocumentFile['status'], progress?: number) => {
    setFiles(prev => prev.map(f =>
      f.id === fileId ? { ...f, status, progress: progress ?? f.progress } : f
    ));
  }, []);

  const getFile = useCallback((fileId: string) => {
    return files.find(f => f.id === fileId);
  }, [files]);

  return {
    files,
    isUploading,
    uploadProgress,
    addFile,
    addFiles,
    removeFile,
    clearFiles,
    updateFileStatus,
    getFile,
    fileCount: files.length
  };
};

// OCR Processing Hook
export const useOCRProcessing = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStep | null>(null);
  const [results, setResults] = useState<ExtractionResult[]>([]);
  const [settings, setSettings] = useState<OCRSettings>(DEFAULT_OCR_SETTINGS);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<OCRSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // Clear all results
  const clearResults = useCallback(() => {
    setResults([]);
    setProcessingProgress(0);
    setIsProcessing(false);
    setCurrentStep(null);
  }, []);

  // Process a single document
  const processDocument = useCallback(async (
    file: DocumentFile,
    customSettings?: Partial<OCRSettings>
  ): Promise<APIResponse<ExtractionResult>> => {
    setIsProcessing(true);
    setProcessingProgress(0);
    const startTime = Date.now();
    let responseData: any;

    try {
      // Update processing steps
      const step: ProcessingStep = {
        id: 'upload',
        name: 'Uploading Document',
        description: 'Sending document to the server for processing',
        status: 'running',
        progress: 0,
        startTime: new Date()
      };
      setCurrentStep(step);
      setProcessingProgress(20);

      // Call Textract Lambda Function URL (bypasses API Gateway 10MB limit)
      const textractUrl = import.meta.env.VITE_TEXTRACT_URL || 'https://sh455p57bhgpj5j6ng3r5bgc4i0qfdkk.lambda-url.ap-south-1.on.aws/';
      const formData = new FormData();
      formData.append('file', file.file, file.name);
      formData.append('filename', file.name);

      const response = await fetch(textractUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        let errorMessage = 'Failed to process document';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      responseData = await response.json();
      const processingTime = (Date.now() - startTime) / 1000;

      // Create base metadata object with correct DocumentType
      const metadata = {
        textractJobId: responseData.jobId || '',
        pages: responseData.pages || 1,
        language: 'en',
        orientation: 0,
        documentType: 'other' as const,
        quality: 'medium' as const
      };

      // Handle response based on whether it's a direct text response or a job ID for async processing
      if (responseData.text) {
        // For direct text responses (images)
        const extractedFields: ExtractedField[] = [{
          key: 'extracted_text',
          value: responseData.text,
          confidence: responseData.confidence || 95,
          type: 'text',
          validated: true
        }];

        const result: ExtractionResult = {
          documentId: file.id,
          extractedFields,
          rawText: responseData.text,
          confidence: responseData.confidence || 95,
          processingTime,
          timestamp: new Date(),
          metadata
        };

        setResults(prev => [...prev, result]);
        setProcessingProgress(100);
        setIsProcessing(false);

        return {
          success: true,
          data: result,
          message: 'Document processed successfully',
          timestamp: new Date().toISOString()
        };
      } else if (responseData.jobId) {
        // For async PDF processing
        const pdfResult: ExtractionResult = {
          documentId: file.id,
          extractedFields: [],
          rawText: 'PDF processing started. This may take a moment...',
          confidence: 0,
          processingTime,
          timestamp: new Date(),
          metadata: {
            ...metadata,
            textractJobId: responseData.jobId,
            pages: responseData.pages || 1
          }
        };

        setResults(prev => [...prev, pdfResult]);
        setProcessingProgress(100);
        setIsProcessing(false);

        return {
          success: true,
          data: pdfResult,
          message: 'PDF processing started. Please check back later for results.',
          timestamp: new Date().toISOString()
        };
      }

      // If we get here, the response format is not recognized
      throw new Error('Unsupported response format from the server');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error processing document:', errorMessage);

      setProcessingProgress(0);
      setIsProcessing(false);

      const errorStep: ProcessingStep = {
        id: 'error',
        name: 'Error',
        description: errorMessage,
        status: 'error',
        progress: 0,
        startTime: new Date(),
        error: errorMessage
      };
      setCurrentStep(errorStep);

      return {
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        error: errorMessage
      };
    }
  }, []);

  // Get a result by document ID
  const getResult = useCallback((documentId: string): ExtractionResult | undefined => {
    return results.find(r => r.documentId === documentId);
  }, [results]);

  return {
    isProcessing,
    currentStep,
    results,
    settings,
    processingProgress,
    processDocument,
    updateSettings,
    clearResults,
    getResult,
    resultCount: results.length
  };
};

// Validation Hook
export const useValidation = () => {
  const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

  const validateField = useCallback((field: ExtractedField): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Type-specific validation
    switch (field.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(field.value))) {
          errors.push('Invalid email format');
        }
        break;
      case 'phone':
        if (!/^\+?[\d\s\-()]+$/.test(String(field.value))) {
          errors.push('Invalid phone number format');
        }
        break;
      case 'date':
        if (isNaN(Date.parse(String(field.value)))) {
          errors.push('Invalid date format');
        }
        break;
      case 'currency':
        if (isNaN(Number(String(field.value).replace(/[^0-9.-]/g, '')))) {
          errors.push('Invalid currency value');
        }
        break;
    }

    // Confidence warnings
    if (field.confidence < 60) {
      warnings.push('Low confidence - please verify');
    } else if (field.confidence < 80) {
      warnings.push('Medium confidence - review recommended');
    }

    const result: ValidationResult = {
      field: field.key,
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      confidence: field.confidence
    };

    setValidationResults(prev => ({ ...prev, [field.key]: result }));
    return result;
  }, []);

  const validateAllFields = useCallback((fields: ExtractedField[]): Record<string, ValidationResult> => {
    const results: Record<string, ValidationResult> = {};
    fields.forEach(field => {
      results[field.key] = validateField(field);
    });
    return results;
  }, [validateField]);

  const clearValidation = useCallback(() => {
    setValidationResults({});
  }, []);

  return {
    validationResults,
    validateField,
    validateAllFields,
    clearValidation
  };
};

// Export Hook
export const useExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async (
    data: ExtractionResult[],
    options: ExportOptions
  ): Promise<{ success: boolean; error?: string }> => {
    setIsExporting(true);

    try {
      let content: string;
      let mimeType: string;
      let filename: string;

      switch (options.format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          filename = `ocr-export-${Date.now()}.json`;
          break;

        case 'csv':
          content = convertToCSV(data, options);
          mimeType = 'text/csv';
          filename = `ocr-export-${Date.now()}.csv`;
          break;

        case 'xml':
          content = convertToXML(data, options);
          mimeType = 'application/xml';
          filename = `ocr-export-${Date.now()}.xml`;
          break;

        default:
          throw new Error('Unsupported export format');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      return { success: true };
    } catch (error) {
      setIsExporting(false);
      return { success: false, error: (error as Error).message };
    }
  }, []);

  const convertToCSV = (data: ExtractionResult[], options: ExportOptions): string => {
    const rows: string[] = [];
    const headers = ['Document ID', 'Field', 'Value'];

    if (options.includeConfidence) headers.push('Confidence');
    if (options.includeMetadata) headers.push('Type', 'Validated');

    rows.push(headers.join(','));

    data.forEach(result => {
      result.extractedFields.forEach(field => {
        const row = [
          result.documentId,
          field.key,
          `"${field.value}"`
        ];

        if (options.includeConfidence) row.push(field.confidence.toString());
        if (options.includeMetadata) row.push(field.type, field.validated.toString());

        rows.push(row.join(','));
      });
    });

    return rows.join('\n');
  };

  const convertToXML = (data: ExtractionResult[], options: ExportOptions): string => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<documents>\n';

    data.forEach(result => {
      xml += '  <document>\n';
      xml += `    <id>${result.documentId}</id>\n`;
      xml += `    <confidence>${result.confidence}</confidence>\n`;
      xml += '    <fields>\n';

      result.extractedFields.forEach(field => {
        xml += '      <field>\n';
        xml += `        <key>${field.key}</key>\n`;
        xml += `        <value>${field.value}</value>\n`;
        if (options.includeConfidence) {
          xml += `        <confidence>${field.confidence}</confidence>\n`;
        }
        xml += '      </field>\n';
      });

      xml += '    </fields>\n';
      xml += '  </document>\n';
    });

    xml += '</documents>';
    return xml;
  };

  return {
    isExporting,
    exportData
  };
};

// Logging Hook
export const useOCRLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);

  const addLog = useCallback((
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    details?: string,
    documentId?: string,
    metadata?: Record<string, any>
  ) => {
    const newLog: LogEntry = {
      id: `log-${++logIdCounter.current}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      documentId,
      sessionId: 'ocr-session',
      metadata
    };

    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getLogsByCategory = useCallback((category: LogEntry['category']) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  const getLogsByLevel = useCallback((level: LogEntry['level']) => {
    return logs.filter(log => log.level === level);
  }, [logs]);

  const getLogsByDocument = useCallback((documentId: string) => {
    return logs.filter(log => log.documentId === documentId);
  }, [logs]);

  return {
    logs,
    addLog,
    clearLogs,
    getLogsByCategory,
    getLogsByLevel,
    getLogsByDocument
  };
};

// Analytics Hook
export const useOCRAnalytics = () => {
  const [metrics, setMetrics] = useState({
    totalDocuments: 0,
    totalFields: 0,
    averageConfidence: 0,
    averageProcessingTime: 0,
    successRate: 100,
    totalCost: 0
  });

  const updateMetrics = useCallback((results: ExtractionResult[]) => {
    if (results.length === 0) return;

    const totalFields = results.reduce((sum, r) => sum + r.extractedFields.length, 0);
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const totalTime = results.reduce((sum, r) => sum + r.processingTime, 0);
    const totalCost = results.length * 0.005; // $0.005 per document

    setMetrics({
      totalDocuments: results.length,
      totalFields,
      averageConfidence: totalConfidence / results.length,
      averageProcessingTime: totalTime / results.length,
      successRate: 100,
      totalCost
    });
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      totalDocuments: 0,
      totalFields: 0,
      averageConfidence: 0,
      averageProcessingTime: 0,
      successRate: 100,
      totalCost: 0
    });
  }, []);

  return {
    metrics,
    updateMetrics,
    resetMetrics
  };
};

// Local Storage Hook
export const useOCRStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
};
