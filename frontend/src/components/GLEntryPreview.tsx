import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export interface GLEntry {
  account: string;
  accountCode: string;
  debit: number;
  credit: number;
  description: string;
}

interface GLEntryPreviewProps {
  entries: GLEntry[];
  isVisible: boolean;
  currency?: string;
}

/**
 * GL Entry Preview Component
 * Displays general ledger entries with balance verification
 */
export const GLEntryPreview: React.FC<GLEntryPreviewProps> = ({
  entries,
  isVisible,
  currency = 'INR'
}) => {
  if (!isVisible || entries.length === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow for floating point errors

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
          <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">General Ledger Entries</h3>
            <p className="text-xs text-gray-500">Accounting Journal Preview</p>
          </div>
        </div>

        {/* Balance Badge */}
        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${
          isBalanced
            ? 'bg-green-600/20 border border-green-600/50'
            : 'bg-[#F97272]/20 border border-[#F97272]/50'
        }`}>
          {isBalanced ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#F76B5E]" />
          )}
          <span className={`text-xs font-bold ${
            isBalanced ? 'text-green-400' : 'text-[#F76B5E]'
          }`}>
            {isBalanced ? 'BALANCED' : 'UNBALANCED'}
          </span>
        </div>
      </div>

      {/* GL Entries Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 pr-4">
                Account Code
              </th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 pr-4">
                Account Name
              </th>
              <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 pr-4">
                Description
              </th>
              <th className="text-right text-xs font-bold text-green-400 uppercase tracking-wider pb-3 pr-4">
                Debit
              </th>
              <th className="text-right text-xs font-bold text-[#F76B5E] uppercase tracking-wider pb-3">
                Credit
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors"
              >
                <td className="py-3 pr-4">
                  <span className="text-sm font-mono text-gray-300">{entry.accountCode}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-sm font-semibold text-white">{entry.account}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-xs text-gray-400">{entry.description}</span>
                </td>
                <td className="py-3 pr-4 text-right">
                  {entry.debit > 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-sm font-semibold text-green-400">
                        {formatCurrency(entry.debit)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">-</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  {entry.credit > 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      <TrendingDown className="w-3 h-3 text-[#F76B5E]" />
                      <span className="text-sm font-semibold text-[#F76B5E]">
                        {formatCurrency(entry.credit)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">-</span>
                  )}
                </td>
              </motion.tr>
            ))}

            {/* Totals Row */}
            <tr className="border-t-2 border-gray-700 bg-gray-900/50">
              <td colSpan={3} className="py-4 pr-4">
                <span className="text-sm font-bold text-white uppercase tracking-wide">Totals</span>
              </td>
              <td className="py-4 pr-4 text-right">
                <span className="text-base font-bold text-green-400">
                  {formatCurrency(totalDebits)}
                </span>
              </td>
              <td className="py-4 text-right">
                <span className="text-base font-bold text-[#F76B5E]">
                  {formatCurrency(totalCredits)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Balance Verification */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        {isBalanced ? (
          <div className="flex items-start gap-2 p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-300">
              <p className="font-semibold mb-1">Entries are balanced</p>
              <p className="text-green-400/80">
                Total Debits ({formatCurrency(totalDebits)}) = Total Credits ({formatCurrency(totalCredits)})
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-[#F97272]/10 border border-[#F97272]/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-[#F76B5E] mt-0.5 flex-shrink-0" />
            <div className="text-xs text-[#F99086]">
              <p className="font-semibold mb-1">Entries are not balanced</p>
              <p className="text-[#F76B5E]/80">
                Difference: {formatCurrency(Math.abs(totalDebits - totalCredits))}
                {totalDebits > totalCredits ? ' (Debits exceed Credits)' : ' (Credits exceed Debits)'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Entry Count */}
      <div className="mt-3 text-center">
        <span className="text-xs text-gray-500">
          {entries.length} journal {entries.length === 1 ? 'entry' : 'entries'} created
        </span>
      </div>
    </motion.div>
  );
};
