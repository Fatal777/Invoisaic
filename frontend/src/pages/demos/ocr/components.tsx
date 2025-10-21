/**
 * OCR Demo Components
 * Reusable UI components for the OCR demo
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, X, Check, AlertCircle, Info, Loader2, 
  Download, Eye, Copy, CheckCircle, XCircle, AlertTriangle,
  File, Image, FileType, Trash2, RefreshCw, Settings, Zap
} from 'lucide-react';
import { 
  DocumentFile, 
  ExtractedField, 
  ExtractionResult, 
  LogEntry, 
  ProcessingStep,
  ValidationResult 
} from './types';

// File Upload Zone Component
interface FileUploadZoneProps {
  onFilesSelected: (files: FileList) => void;
  isUploading: boolean;
  maxFiles?: number;
  currentFileCount?: number;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({ 
  onFilesSelected, 
  isUploading,
  maxFiles = 10,
  currentFileCount = 0
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelected(e.target.files);
    }
  };

  const canUploadMore = currentFileCount < maxFiles;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={canUploadMore ? handleClick : undefined}
      className={`relative border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
        isDragging 
          ? 'border-[#F97272] bg-[#F97272]/10' 
          : canUploadMore
            ? 'border-gray-700 hover:border-[#F97272] hover:bg-gray-900/50'
            : 'border-gray-800 bg-gray-900/30 cursor-not-allowed opacity-50'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={!canUploadMore}
      />

      <div className="text-center">
        <motion.div
          animate={{ y: isDragging ? -10 : 0 }}
          className="w-20 h-20 mx-auto mb-6 bg-gray-900 rounded-full flex items-center justify-center"
        >
          {isUploading ? (
            <Loader2 className="w-10 h-10 text-[#F97272] animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-gray-600" />
          )}
        </motion.div>

        <h3 className="text-xl font-bold mb-2">
          {isUploading ? 'Uploading...' : 'Upload Documents'}
        </h3>
        
        <p className="text-gray-400 mb-4">
          {canUploadMore 
            ? 'Drag and drop files here, or click to browse'
            : `Maximum ${maxFiles} files reached`
          }
        </p>

        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FileType className="w-4 h-4" />
            <span>PDF, PNG, JPG</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>Max 10MB</span>
          </div>
        </div>

        {currentFileCount > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            {currentFileCount} / {maxFiles} files uploaded
          </div>
        )}
      </div>
    </div>
  );
};

// Document File Card Component
interface DocumentFileCardProps {
  file: DocumentFile;
  onRemove: (id: string) => void;
  onProcess?: (id: string) => void;
  result?: ExtractionResult;
}

export const DocumentFileCard: React.FC<DocumentFileCardProps> = ({ 
  file, 
  onRemove, 
  onProcess,
  result 
}) => {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[#EFA498]" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'completed':
        return 'border-green-600 bg-green-600/10';
      case 'error':
        return 'border-[#F97272] bg-[#F97272]/10';
      case 'processing':
        return 'border-blue-600 bg-blue-600/10';
      default:
        return 'border-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-4 border rounded-xl transition-all ${getStatusColor()}`}
    >
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {file.preview ? (
            <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <FileText className="w-8 h-8 text-gray-600" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{file.name}</h4>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}
              </p>
            </div>
            {getStatusIcon()}
          </div>

          {/* Progress Bar */}
          {file.status === 'processing' && (
            <div className="mb-2">
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${file.progress}%` }}
                  className="bg-blue-600 h-1.5 rounded-full"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{file.progress}% complete</div>
            </div>
          )}

          {/* Result Summary */}
          {result && file.status === 'completed' && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
              <span>{result.extractedFields.length} fields</span>
              <span>{result.confidence.toFixed(1)}% confidence</span>
              <span>{result.processingTime.toFixed(1)}s</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {file.status === 'pending' && onProcess && (
              <button
                onClick={() => onProcess(file.id)}
                className="px-3 py-1.5 bg-[#F97272] hover:bg-[#f85c5c] rounded-lg text-xs font-semibold transition-colors"
              >
                Process
              </button>
            )}
            
            {file.status === 'completed' && (
              <button className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                <Eye className="w-3 h-3" />
                View
              </button>
            )}

            <button
              onClick={() => onRemove(file.id)}
              className="ml-auto p-1.5 hover:bg-[#F97272] rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Extracted Field Component
interface ExtractedFieldCardProps {
  field: ExtractedField;
  validation?: ValidationResult;
  onEdit?: (key: string, value: string) => void;
  onCopy?: (value: string) => void;
}

export const ExtractedFieldCard: React.FC<ExtractedFieldCardProps> = ({ 
  field, 
  validation,
  onEdit,
  onCopy 
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(String(field.value));

  const handleSave = () => {
    if (onEdit) {
      onEdit(field.key, editValue);
    }
    setIsEditing(false);
  };

  const getConfidenceColor = () => {
    if (field.confidence >= 95) return 'text-green-500';
    if (field.confidence >= 80) return 'text-yellow-500';
    return 'text-[#EFA498]';
  };

  const getTypeIcon = () => {
    switch (field.type) {
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'date': return '📅';
      case 'currency': return '💰';
      case 'address': return '📍';
      case 'number': return '#️⃣';
      default: return '📝';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border transition-all ${
        validation && !validation.isValid 
          ? 'border-[#F97272] bg-[#F97272]/5' 
          : 'border-gray-800 bg-gray-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{getTypeIcon()}</span>
          <div className="flex-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {field.key.replace(/_/g, ' ')}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                className="w-full px-2 py-1 bg-black border border-gray-700 rounded text-sm"
                autoFocus
              />
            ) : (
              <div className="font-semibold text-white break-words">
                {field.value}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${getConfidenceColor()}`}>
            {field.confidence.toFixed(1)}%
          </span>
          {onCopy && (
            <button
              onClick={() => onCopy(String(field.value))}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {validation && (
        <div className="space-y-1 mt-2">
          {validation.errors.map((error, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[#F76B5E]">
              <XCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          ))}
          {validation.warnings.map((warning, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-yellow-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Processing Step Component
interface ProcessingStepCardProps {
  step: ProcessingStep;
}

export const ProcessingStepCard: React.FC<ProcessingStepCardProps> = ({ step }) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[#EFA498]" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-700" />;
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case 'completed': return 'border-green-600 bg-green-600/10';
      case 'running': return 'border-blue-600 bg-blue-600/10';
      case 'error': return 'border-[#F97272] bg-[#F97272]/10';
      default: return 'border-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 border rounded-lg transition-all ${getStatusColor()}`}
    >
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="font-semibold text-sm">{step.name}</div>
          <div className="text-xs text-gray-500">{step.description}</div>
          {step.duration && (
            <div className="text-xs text-gray-600 mt-1">{step.duration.toFixed(2)}s</div>
          )}
        </div>
        {step.status === 'running' && (
          <div className="text-xs text-blue-400 font-semibold">
            {step.progress}%
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Log Entry Component
interface LogEntryCardProps {
  log: LogEntry;
}

export const LogEntryCard: React.FC<LogEntryCardProps> = ({ log }) => {
  const getIcon = () => {
    switch (log.level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-[#EFA498]" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTextColor = () => {
    switch (log.level) {
      case 'error': return 'text-[#F76B5E]';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-2 hover:bg-gray-900/50 rounded transition-colors font-mono text-xs"
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gray-600">
            [{log.timestamp.toLocaleTimeString()}]
          </span>
          <span className="text-gray-700 uppercase text-[10px]">
            {log.category}
          </span>
        </div>
        <div className={`${getTextColor()}`}>
          {log.message}
        </div>
        {log.details && (
          <div className="text-gray-600 mt-1">
            {log.details}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action 
}) => {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 text-gray-700 opacity-50">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

// Stats Card Component
interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  icon, 
  trend, 
  trendValue 
}) => {
  return (
    <div className="p-6 bg-gray-950 border border-gray-800 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-500">{icon}</div>
        {trend && trendValue && (
          <div className={`text-xs font-semibold ${
            trend === 'up' ? 'text-green-500' : 
            trend === 'down' ? 'text-[#EFA498]' : 
            'text-gray-500'
          }`}>
            {trendValue}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label, 
  showPercentage = true 
}) => {
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm text-gray-400">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-semibold text-white">{progress}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-[#F97272] h-2 rounded-full"
        />
      </div>
    </div>
  );
};

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-gray-800 text-gray-300',
    success: 'bg-green-600/20 text-green-400 border border-green-600/30',
    error: 'bg-[#F97272]/20 text-[#F76B5E] border border-[#F97272]/30',
    warning: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
    info: 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};
