/**
 * OCR Demo - Main Component
 * Production-ready OCR demo with modular architecture
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Upload, FileText, Download, Eye, Settings, 
  BarChart3, CheckCircle, Loader2, RefreshCw, Trash2
} from 'lucide-react';

// Import modular components
import { OCRStep, DocumentFile, ExtractionResult, ExportOptions } from './ocr/types';
import { DOCUMENT_TYPES, EXPORT_FORMATS, QUALITY_SETTINGS, LANGUAGES } from './ocr/data';
import { 
  useFileUpload, 
  useOCRProcessing, 
  useValidation, 
  useExport, 
  useOCRLogger,
  useOCRAnalytics 
} from './ocr/hooks';
import { 
  FileUploadZone, 
  DocumentFileCard, 
  ExtractedFieldCard, 
  ProcessingStepCard,
  LogEntryCard,
  EmptyState,
  StatsCard,
  ProgressBar,
  Badge
} from './ocr/components';

export default function OCRDemo() {
  const navigate = useNavigate();
  
  // State management
  const [currentStep, setCurrentStep] = useState<OCRStep>('upload');
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeConfidence: true,
    includeBoundingBoxes: false,
    includeRawText: false,
    fieldsToInclude: [],
    sortOrder: 'asc'
  });

  // Custom hooks
  const { 
    files, 
    isUploading, 
    addFiles, 
    removeFile, 
    clearFiles, 
    updateFileStatus,
    fileCount 
  } = useFileUpload();

  const { 
    isProcessing, 
    currentStep: processingStep, 
    results, 
    settings, 
    processingProgress,
    processDocument, 
    updateSettings, 
    clearResults,
    getResult 
  } = useOCRProcessing();

  const { 
    validationResults, 
    validateAllFields 
  } = useValidation();

  const { 
    isExporting, 
    exportData 
  } = useExport();

  const { 
    logs, 
    addLog, 
    clearLogs 
  } = useOCRLogger();

  const { 
    metrics, 
    updateMetrics 
  } = useOCRAnalytics();

  // Steps configuration
  const steps: { key: OCRStep; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
    { key: 'preview', label: 'Preview', icon: <Eye className="w-4 h-4" /> },
    { key: 'processing', label: 'Processing', icon: <Loader2 className="w-4 h-4" /> },
    { key: 'extraction', label: 'Extraction', icon: <FileText className="w-4 h-4" /> },
    { key: 'validation', label: 'Validation', icon: <CheckCircle className="w-4 h-4" /> },
    { key: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  // Event handlers
  const handleFilesSelected = async (fileList: FileList) => {
    addLog('info', 'upload', `Uploading ${fileList.length} file(s)`);
    const result = await addFiles(fileList);
    
    if (result.success) {
      addLog('info', 'upload', `Successfully uploaded ${fileList.length} file(s)`, SUCCESS_MESSAGES.UPLOAD_SUCCESS);
      if (fileCount === 0 && fileList.length > 0) {
        setCurrentStep('preview');
      }
    } else {
      result.errors.forEach(error => {
        addLog('error', 'upload', 'Upload failed', error);
      });
    }
  };

  const handleProcessFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setSelectedFile(file);
    setCurrentStep('processing');
    updateFileStatus(fileId, 'processing', 0);
    
    addLog('info', 'processing', `Starting OCR for ${file.name}`);

    const result = await processDocument(file);

    if (result.success && result.data) {
      updateFileStatus(fileId, 'completed', 100);
      addLog('info', 'extraction', `Extracted ${result.data.extractedFields.length} fields`, 
        `Confidence: ${result.data.confidence.toFixed(1)}%`);
      
      // Validate extracted fields
      validateAllFields(result.data.extractedFields);
      
      setCurrentStep('extraction');
      updateMetrics(results);
    } else {
      updateFileStatus(fileId, 'error', 0);
      addLog('error', 'processing', 'Processing failed', result.error);
    }
  };

  const handleExport = async () => {
    if (results.length === 0) {
      addLog('error', 'export', 'No data to export');
      return;
    }

    addLog('info', 'export', `Exporting ${results.length} document(s) as ${exportOptions.format.toUpperCase()}`);
    
    const result = await exportData(results, exportOptions);
    
    if (result.success) {
      addLog('info', 'export', 'Export successful', SUCCESS_MESSAGES.EXPORT_SUCCESS);
    } else {
      addLog('error', 'export', 'Export failed', result.error);
    }
  };

  const handleReset = () => {
    clearFiles();
    clearResults();
    clearLogs();
    setCurrentStep('upload');
    setSelectedFile(null);
  };

  const selectedResult = selectedFile ? getResult(selectedFile.id) : null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur-xl"
      >
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/demo')}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F97272] rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">OCR Demo</h1>
                  <p className="text-xs text-gray-500">Document Text Extraction</p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentStep === step.key 
                      ? 'bg-[#F97272] text-white' 
                      : index < currentStepIndex 
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-900 text-gray-500'
                  }`}>
                    {step.icon}
                    <span className="hidden lg:block">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-800" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <Badge variant="error">LIVE DEMO</Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Upload Step */}
          {currentStep === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <FileUploadZone
                onFilesSelected={handleFilesSelected}
                isUploading={isUploading}
                currentFileCount={fileCount}
              />

              {files.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Uploaded Files ({files.length})</h3>
                    <button
                      onClick={clearFiles}
                      className="text-sm text-gray-500 hover:text-[#EFA498] transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-4">
                    {files.map(file => (
                      <DocumentFileCard
                        key={file.id}
                        file={file}
                        onRemove={removeFile}
                        onProcess={handleProcessFile}
                        result={getResult(file.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Files Ready for Processing</h2>
                  <div className="space-y-4">
                    {files.map(file => (
                      <DocumentFileCard
                        key={file.id}
                        file={file}
                        onRemove={removeFile}
                        onProcess={handleProcessFile}
                        result={getResult(file.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                  <h3 className="text-xl font-bold mb-6">Processing Settings</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold mb-3">Document Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {DOCUMENT_TYPES.slice(0, 6).map(type => (
                          <button
                            key={type.value}
                            onClick={() => updateSettings({ documentType: type.value })}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              settings.documentType === type.value
                                ? 'border-[#F97272] bg-[#F97272]/10'
                                : 'border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="text-2xl mb-1">{type.icon}</div>
                            <div className="text-sm font-semibold">{type.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-3">Quality</label>
                      <div className="space-y-2">
                        {QUALITY_SETTINGS.map(quality => (
                          <button
                            key={quality.value}
                            onClick={() => updateSettings({ quality: quality.value })}
                            className={`w-full p-4 rounded-lg border text-left transition-all ${
                              settings.quality === quality.value
                                ? 'border-[#F97272] bg-[#F97272]/10'
                                : 'border-gray-800 hover:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{quality.icon}</span>
                                <span className="font-semibold">{quality.label}</span>
                              </div>
                              <Badge variant="info">{quality.cost}</Badge>
                            </div>
                            <div className="text-xs text-gray-500">{quality.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                <div className="flex items-center justify-center mb-8">
                  <Loader2 className="w-16 h-16 text-[#F97272] animate-spin" />
                </div>
                
                <h2 className="text-2xl font-bold text-center mb-8">
                  Processing Document
                </h2>

                <ProgressBar 
                  progress={processingProgress} 
                  label="Overall Progress"
                  showPercentage 
                />

                {processingStep && (
                  <div className="mt-8">
                    <ProcessingStepCard step={processingStep} />
                  </div>
                )}

                <div className="mt-8 bg-black border border-gray-800 rounded-lg p-6 h-64 overflow-y-auto">
                  {logs.map(log => (
                    <LogEntryCard key={log.id} log={log} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Extraction Step */}
          {currentStep === 'extraction' && selectedResult && (
            <motion.div
              key="extraction"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid lg:grid-cols-3 gap-8 mb-8">
                <StatsCard
                  label="Fields Extracted"
                  value={selectedResult.extractedFields.length}
                  icon={<FileText className="w-5 h-5" />}
                />
                <StatsCard
                  label="Confidence"
                  value={`${selectedResult.confidence.toFixed(1)}%`}
                  icon={<CheckCircle className="w-5 h-5" />}
                />
                <StatsCard
                  label="Processing Time"
                  value={`${selectedResult.processingTime.toFixed(1)}s`}
                  icon={<BarChart3 className="w-5 h-5" />}
                />
              </div>

              <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Extracted Data</h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="px-6 py-3 bg-[#F97272] hover:bg-[#f85c5c] disabled:bg-gray-800 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Export
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      New Document
                    </button>
                  </div>
                </div>

                {selectedResult.extractedFields.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="w-16 h-16" />}
                    title="No data extracted"
                    description="The document may be empty or unreadable"
                  />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedResult.extractedFields.map(field => (
                      <ExtractedFieldCard
                        key={field.key}
                        field={field}
                        validation={validationResults[field.key]}
                        onCopy={(value) => {
                          navigator.clipboard.writeText(value);
                          addLog('info', 'system', 'Copied to clipboard', value);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'Document uploaded successfully',
  EXPORT_SUCCESS: 'Data exported successfully'
};
