/**
 * Onboarding Demo Components
 * Reusable UI components for company onboarding and invoice generation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Check, Plus, Minus, Trash2, Edit2, Save, X,
  Package, ShoppingCart, FileText, Download, Eye, Copy,
  CheckCircle, AlertCircle, Info, Loader2, DollarSign
} from 'lucide-react';
import { Product, InvoiceItem, Company, Customer, Invoice, LogEntry } from './types';

// Company Card Component
interface CompanyCardProps {
  company: Company;
  onEdit?: () => void;
  verified?: boolean;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({ company, onEdit, verified = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gray-950 border border-gray-800 rounded-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#F97272] rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{company.name}</h3>
            <p className="text-sm text-gray-500">GSTIN: {company.tax.gstin}</p>
          </div>
        </div>
        {verified && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs font-semibold border border-green-600/30">
            <CheckCircle className="w-3 h-3" />
            Verified
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-gray-500 w-20">Address:</span>
          <span className="flex-1">{company.address.street}, {company.address.city}, {company.address.state} - {company.address.zipCode}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-500 w-20">Email:</span>
          <span className="flex-1">{company.contact.email}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-gray-500 w-20">Phone:</span>
          <span className="flex-1">{company.contact.phone}</span>
        </div>
        {company.tax.pan && (
          <div className="flex items-start gap-2">
            <span className="text-gray-500 w-20">PAN:</span>
            <span className="flex-1">{company.tax.pan}</span>
          </div>
        )}
      </div>

      {onEdit && (
        <button
          onClick={onEdit}
          className="mt-4 w-full px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit Details
        </button>
      )}
    </motion.div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
  onAddToInvoice?: (product: Product) => void;
  inInvoice?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete, 
  onAddToInvoice,
  inInvoice = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gray-950 border border-gray-800 rounded-xl hover:border-gray-700 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{product.name}</h4>
          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
          )}
        </div>
        {product.isService && (
          <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded border border-blue-600/30">
            Service
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div>
          <span className="text-gray-500 text-xs">HSN/SAC:</span>
          <div className="font-semibold">{product.hsn}</div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">GST Rate:</span>
          <div className="font-semibold">{product.gst}%</div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Price:</span>
          <div className="font-semibold">₹{product.price.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-gray-500 text-xs">Unit:</span>
          <div className="font-semibold uppercase">{product.unit}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onAddToInvoice && (
          <button
            onClick={() => onAddToInvoice(product)}
            disabled={inInvoice}
            className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
              inInvoice
                ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-not-allowed'
                : 'bg-[#F97272] hover:bg-[#f85c5c] text-white'
            }`}
          >
            {inInvoice ? (
              <>
                <Check className="w-4 h-4" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add
              </>
            )}
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(product)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(product.id)}
            className="p-2 hover:bg-[#F97272] rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Invoice Item Component
interface InvoiceItemCardProps {
  item: InvoiceItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  showTaxBreakdown?: boolean;
}

export const InvoiceItemCard: React.FC<InvoiceItemCardProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove,
  showTaxBreakdown = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 bg-black border border-gray-800 rounded-lg"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold">{item.product.name}</h4>
              <p className="text-xs text-gray-500">HSN: {item.product.hsn} • GST: {item.gstRate}%</p>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="p-1 hover:bg-[#F97272] rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 bg-gray-900 hover:bg-gray-800 rounded flex items-center justify-center transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-12 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 bg-gray-900 hover:bg-gray-800 rounded flex items-center justify-center transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <div className="text-sm text-gray-500">
              @ ₹{item.rate.toLocaleString()} / {item.product.unit}
            </div>
          </div>

          {showTaxBreakdown && (
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2">
              <div>Taxable: ₹{item.taxableAmount.toFixed(2)}</div>
              <div>CGST: ₹{item.cgst.toFixed(2)}</div>
              <div>SGST: ₹{item.sgst.toFixed(2)}</div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <span className="text-sm text-gray-500">Item Total:</span>
            <span className="font-bold text-lg">₹{item.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Invoice Preview Component
interface InvoicePreviewProps {
  invoice: Invoice;
  onDownload?: () => void;
  formatting?: {
    template: 'modern' | 'classic' | 'minimal';
    accentColor: string;
    showLogo: boolean;
    showBankDetails: boolean;
    showTerms: boolean;
    showNotes: boolean;
    currency: string;
    language: string;
    dateFormat: string;
    notes: string;
    terms: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onDownload, formatting }) => {
  const accentColor = formatting?.accentColor || '#dc2626';
  const currencySymbol = formatting?.currency === 'USD' ? '$' : formatting?.currency === 'EUR' ? '€' : formatting?.currency === 'GBP' ? '£' : '₹';

  const templateStyles = {
    modern: 'rounded-xl',
    classic: 'rounded-none border-2',
    minimal: 'rounded-sm border'
  };

  return (
    <motion.div
      data-invoice-preview
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white text-black p-8 ${templateStyles[formatting?.template || 'modern']}`}
    >
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2" style={{ borderColor: accentColor }}>
        <h1 className="text-4xl font-bold mb-2" style={{ color: accentColor }}>TAX INVOICE</h1>
        <div className="text-gray-600">GST Invoice</div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-xs text-gray-600 mb-2">INVOICE TO:</div>
          <div className="font-bold text-lg mb-1">{invoice.customer.name}</div>
          {invoice.customer.gstin && (
            <div className="text-sm text-gray-600">GSTIN: {invoice.customer.gstin}</div>
          )}
          <div className="text-sm text-gray-600 mt-2">
            {invoice.customer.address.street}<br />
            {invoice.customer.address.city}, {invoice.customer.address.state}<br />
            {invoice.customer.address.zipCode}
          </div>
        </div>

        <div className="text-right">
          <div className="mb-4">
            <div className="text-xs text-gray-600 mb-1">INVOICE NUMBER</div>
            <div className="font-bold text-xl">{invoice.invoiceNumber}</div>
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-600 mb-1">INVOICE DATE</div>
            <div className="font-semibold">{invoice.invoiceDate}</div>
          </div>
          {invoice.dueDate && (
            <div>
              <div className="text-xs text-gray-600 mb-1">DUE DATE</div>
              <div className="font-semibold">{invoice.dueDate}</div>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-3 text-sm">DESCRIPTION</th>
            <th className="text-center py-3 text-sm">HSN</th>
            <th className="text-center py-3 text-sm">QTY</th>
            <th className="text-right py-3 text-sm">RATE</th>
            <th className="text-right py-3 text-sm">GST</th>
            <th className="text-right py-3 text-sm">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-3">{item.product.name}</td>
              <td className="text-center py-3 text-sm">{item.product.hsn}</td>
              <td className="text-center py-3">{item.quantity}</td>
              <td className="text-right py-3">{currencySymbol}{item.rate.toLocaleString()}</td>
              <td className="text-right py-3 text-sm">{item.gstRate}%</td>
              <td className="text-right py-3 font-semibold">{currencySymbol}{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-semibold">-{currencySymbol}{invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">CGST:</span>
              <span className="font-semibold">{currencySymbol}{invoice.cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SGST:</span>
              <span className="font-semibold">{currencySymbol}{invoice.sgst.toFixed(2)}</span>
            </div>
            {invoice.roundOff !== 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Round Off:</span>
                <span className="font-semibold">{currencySymbol}{invoice.roundOff.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t-2 text-xl font-bold" style={{ borderColor: accentColor }}>
              <span>TOTAL:</span>
              <span style={{ color: accentColor }}>{currencySymbol}{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <div className="text-xs text-gray-600 mb-1">AMOUNT IN WORDS</div>
        <div className="font-semibold">{invoice.amountInWords}</div>
      </div>

      {/* Company Details */}
      <div className="border-t-2 pt-6" style={{ borderColor: accentColor }}>
        <div className="text-xs text-gray-600 mb-2">FROM:</div>
        <div className="font-bold text-lg mb-1">{invoice.company.name}</div>
        <div className="text-sm text-gray-600">GSTIN: {invoice.company.tax.gstin}</div>
        {invoice.company.tax.pan && (
          <div className="text-sm text-gray-600">PAN: {invoice.company.tax.pan}</div>
        )}
      </div>

      {/* Bank Details (Conditional) */}
      {formatting?.showBankDetails && formatting?.bankName && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <div className="text-xs text-gray-600 mb-2">BANK DETAILS</div>
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">Bank Name:</span> {formatting.bankName}</div>
            {formatting.accountNumber && (
              <div><span className="font-semibold">Account Number:</span> {formatting.accountNumber}</div>
            )}
            {formatting.ifscCode && (
              <div><span className="font-semibold">IFSC Code:</span> {formatting.ifscCode}</div>
            )}
          </div>
        </div>
      )}

      {/* Terms & Conditions (Conditional) */}
      {formatting?.showTerms && formatting?.terms && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <div className="text-xs text-gray-600 mb-2">TERMS & CONDITIONS</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{formatting.terms}</div>
        </div>
      )}

      {/* Notes (Conditional) */}
      {formatting?.showNotes && formatting?.notes && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <div className="text-xs text-gray-600 mb-2">NOTES</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{formatting.notes}</div>
        </div>
      )}

      {/* Download Button */}
      {onDownload && (
        <div className="mt-8 pt-6 border-t border-gray-300">
          <button
            onClick={onDownload}
            className="w-full px-6 py-4 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      )}
    </motion.div>
  );
};

// Progress Steps Component
interface ProgressStepsProps {
  steps: Array<{ id: string; title: string; status: 'pending' | 'current' | 'completed' }>;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ steps }) => {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold transition-all ${
              step.status === 'completed' 
                ? 'bg-green-600 border-green-600 text-white' 
                : step.status === 'current'
                  ? 'bg-[#F97272] border-[#F97272] text-white'
                  : 'border-gray-700 text-gray-600'
            }`}>
              {step.status === 'completed' ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <div>
              <div className={`text-sm font-semibold ${
                step.status === 'current' ? 'text-white' : 'text-gray-500'
              }`}>
                {step.title}
              </div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${
              step.status === 'completed' ? 'bg-green-600' : 'bg-gray-800'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Log Entry Component
interface LogEntryCardProps {
  log: LogEntry;
}

export const LogEntryCard: React.FC<LogEntryCardProps> = ({ log }) => {
  const getIcon = () => {
    switch (log.level) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-[#EFA498]" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTextColor = () => {
    switch (log.level) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-[#F76B5E]';
      case 'warning': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-2 hover:bg-gray-900/50 rounded transition-colors"
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-600">
            [{log.timestamp.toLocaleTimeString()}]
          </span>
          <span className="text-xs text-gray-700 uppercase">
            {log.category}
          </span>
        </div>
        <div className={`text-sm ${getTextColor()}`}>
          {log.message}
        </div>
        {log.details && (
          <div className="text-xs text-gray-600 mt-1">
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

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
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
