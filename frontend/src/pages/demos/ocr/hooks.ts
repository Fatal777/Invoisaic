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

  const processDocument = useCallback(async (
    file: DocumentFile,
    customSettings?: Partial<OCRSettings>
  ): Promise<APIResponse<ExtractionResult>> => {
    setIsProcessing(true);
    setProcessingProgress(0);

    const finalSettings = { ...settings, ...customSettings };
    const startTime = Date.now();

    try {
      // Simulate processing steps
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        const step = PROCESSING_STEPS[i];
        setCurrentStep({
          id: step.id,
          name: step.name,
          description: step.description,
          status: 'running',
          startTime: new Date(),
          progress: 0
        });

        const stepProgress = ((i + 1) / PROCESSING_STEPS.length) * 100;
        setProcessingProgress(stepProgress);

        await new Promise(resolve => setTimeout(resolve, step.estimatedTime * 1000));

        setCurrentStep(prev => prev ? { ...prev, status: 'completed', endTime: new Date() } : null);
      }

      // Call real Textract API
      const apiUrl = import.meta.env.VITE_API_URL;
      const formData = new FormData();
      formData.append('file', file.file);

      const response = await fetch(`${apiUrl}/textract/process`, {
        method: 'POST',
        body: formData
      });

      const data: TextractResponse = await response.json();

      if (data.success) {
        const processingTime = (Date.now() - startTime) / 1000;

        const extractedFields: ExtractedField[] = Object.entries(data.extractedData).map(([key, value]) => ({
          key,
          value: String(value),
          confidence: data.confidence,
          type: inferFieldType(key, value),
          validated: true
        }));

        const result: ExtractionResult = {
          documentId: file.id,
          extractedFields,
          rawText: data.rawText || '',
          confidence: data.confidence,
          processingTime,
          timestamp: new Date(),
          metadata: {
            textractJobId: data.jobId,
            pages: data.pages || 1,
            language: data.metadata?.language || 'en',
            orientation: data.metadata?.orientation || 0,
            documentType: data.metadata?.documentType || 'other',
            quality: (data.metadata?.quality as 'low' | 'medium' | 'high') || 'medium'
          }
        };

        setResults(prev => [...prev, result]);
        setIsProcessing(false);
        setProcessingProgress(100);

        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
          processingTime
        };
      } else {
        throw new Error('Textract processing failed');
      }
    } catch (error) {
      setIsProcessing(false);
      setProcessingProgress(0);

      return {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }, [settings]);

  const inferFieldType = (key: string, value: any): ExtractedField['type'] => {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('email')) return 'email';
    if (keyLower.includes('phone') || keyLower.includes('mobile')) return 'phone';
    if (keyLower.includes('date')) return 'date';
    if (keyLower.includes('amount') || keyLower.includes('total') || keyLower.includes('price')) return 'currency';
    if (keyLower.includes('address')) return 'address';
    if (typeof value === 'number' || !isNaN(Number(value))) return 'number';
    
    return 'text';
  };

  const updateSettings = useCallback((newSettings: Partial<OCRSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  const getResult = useCallback((documentId: string) => {
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
