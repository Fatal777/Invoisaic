import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export interface TaxBreakdown {
  subtotal: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  cess?: number;
  total: number;
  currency: string;
  isCompliant: boolean;
  violations: string[];
  taxRate?: number; // Expected tax rate (e.g., 18 for 18%)
}

interface TaxBreakdownPanelProps {
  taxData: TaxBreakdown | null;
  isVisible: boolean;
}

/**
 * Tax Breakdown Panel Component
 * Displays CGST/SGST/IGST breakdown with compliance status
 */
export const TaxBreakdownPanel: React.FC<TaxBreakdownPanelProps> = ({
  taxData,
  isVisible
}) => {
  if (!isVisible || !taxData) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: taxData.currency || 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalTax = (taxData.cgst || 0) + (taxData.sgst || 0) + (taxData.igst || 0) + (taxData.cess || 0);

  const taxItems = [
    { label: 'Subtotal (Before Tax)', amount: taxData.subtotal, isBold: false },
    ...(taxData.cgst ? [{ label: 'CGST', amount: taxData.cgst, isBold: false }] : []),
    ...(taxData.sgst ? [{ label: 'SGST', amount: taxData.sgst, isBold: false }] : []),
    ...(taxData.igst ? [{ label: 'IGST', amount: taxData.igst, isBold: false }] : []),
    ...(taxData.cess ? [{ label: 'Cess', amount: taxData.cess, isBold: false }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-gray-950 border border-gray-800 rounded-xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Tax Breakdown</h3>
            <p className="text-xs text-gray-500">GST Compliance Analysis</p>
          </div>
        </div>

        {/* Compliance Badge */}
        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
          taxData.isCompliant
            ? 'bg-green-600/20 border border-green-600/50'
            : 'bg-[#F97272]/20 border border-[#F97272]/50'
        }`}>
          {taxData.isCompliant ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 text-[#F76B5E]" />
          )}
          <span className={`text-xs font-bold ${
            taxData.isCompliant ? 'text-green-400' : 'text-[#F76B5E]'
          }`}>
            {taxData.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
          </span>
        </div>
      </div>

      {/* Tax Items */}
      <div className="space-y-3 mb-4">
        {taxItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
          >
            <span className={`text-sm ${item.isBold ? 'font-bold text-white' : 'text-gray-400'}`}>
              {item.label}
            </span>
            <span className={`text-sm ${item.isBold ? 'font-bold text-white' : 'text-gray-300'}`}>
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}

        {/* Total Tax */}
        <div className="flex items-center justify-between py-3 border-t-2 border-gray-700">
          <span className="text-sm font-semibold text-gray-300">Total Tax</span>
          <span className="text-sm font-semibold text-blue-400">
            {formatCurrency(totalTax)}
          </span>
        </div>

        {/* Grand Total */}
        <div className="flex items-center justify-between py-3 bg-gray-900 rounded-lg px-4 border-2 border-[#F97272]/30">
          <span className="text-base font-bold text-white">Grand Total</span>
          <span className="text-base font-bold text-[#F76B5E]">
            {formatCurrency(taxData.total)}
          </span>
        </div>
      </div>

      {/* Tax Rate Info */}
      {taxData.taxRate && (
        <div className="flex items-start gap-2 p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg mb-4">
          <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-300">
            <span className="font-semibold">Expected Tax Rate:</span> {taxData.taxRate}%
            {taxData.cgst && taxData.sgst && (
              <span className="text-gray-400"> (CGST: {taxData.taxRate / 2}% + SGST: {taxData.taxRate / 2}%)</span>
            )}
          </div>
        </div>
      )}

      {/* Violations */}
      {taxData.violations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#F76B5E] text-sm font-semibold mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Compliance Violations</span>
          </div>
          {taxData.violations.map((violation, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-[#F97272]/10 border border-[#F97272]/30 rounded-lg"
            >
              <div className="w-1.5 h-1.5 bg-[#EFA498] rounded-full mt-1.5 flex-shrink-0" />
              <p className="text-xs text-[#F99086] leading-relaxed">{violation}</p>
            </div>
          ))}
        </div>
      )}

      {/* Success Message */}
      {taxData.isCompliant && (
        <div className="flex items-start gap-2 p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-300 leading-relaxed">
            All tax calculations are correct and comply with GST regulations.
          </p>
        </div>
      )}
    </motion.div>
  );
};
