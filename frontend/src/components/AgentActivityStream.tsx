import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, AlertCircle, Info, Loader2,
  Eye, Shield, Calculator, FileText, DollarSign, Search
} from 'lucide-react';
import type { WebSocketMessage } from '../hooks/useWebSocket';

interface AgentActivityStreamProps {
  messages: WebSocketMessage[];
}

/**
 * Agent Activity Stream Component
 * Displays real-time updates from AI agents processing invoices
 */
export const AgentActivityStream: React.FC<AgentActivityStreamProps> = ({ messages }) => {
  const getAgentIcon = (agentName: string) => {
    const name = agentName?.toLowerCase() || '';

    if (name.includes('ocr')) return <Eye className="w-5 h-5" />;
    if (name.includes('validation')) return <CheckCircle className="w-5 h-5" />;
    if (name.includes('tax')) return <Calculator className="w-5 h-5" />;
    if (name.includes('fraud')) return <Shield className="w-5 h-5" />;
    if (name.includes('gl') || name.includes('coding')) return <DollarSign className="w-5 h-5" />;

    return <FileText className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-green-400 bg-green-600/20 border-green-600/30';
      case 'running':
      case 'processing':
        return 'text-blue-400 bg-blue-600/20 border-blue-600/30';
      case 'failed':
      case 'error':
        return 'text-[#F76B5E] bg-[#F97272]/20 border-[#F97272]/30';
      default:
        return 'text-gray-400 bg-gray-600/20 border-gray-600/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'running':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index === messages.length - 1 ? 0.1 : 0 }}
            className="p-4 bg-black border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
          >
            {/* Agent Activity Message */}
            {msg.type === 'agent_activity' && (
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg border ${getStatusColor(msg.data.status)}`}>
                  {getAgentIcon(msg.data.agentName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{msg.data.agentName}</span>
                    <span className={`text-xs px-2 py-1 rounded border flex items-center gap-1 ${getStatusColor(msg.data.status)}`}>
                      {getStatusIcon(msg.data.status)}
                      {msg.data.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{msg.data.message}</p>
                  {msg.data.timestamp && (
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(msg.data.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Field Extracted Message */}
            {msg.type === 'field_extracted' && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-600/20 text-green-400 border border-green-600/30">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Field Extracted
                  </div>
                  <div className="text-sm text-gray-400">
                    <span className="text-white font-semibold">{msg.data.fieldName}:</span> {msg.data.value}
                  </div>
                  {msg.data.confidence !== undefined && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full transition-all duration-500"
                          style={{ width: `${msg.data.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-green-400 font-semibold">
                        {msg.data.confidence.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Processing Started Message */}
            {msg.type === 'processing_started' && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/30">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Processing Started</div>
                  <p className="text-sm text-gray-400">{msg.data.message}</p>
                  {msg.data.invoiceId && (
                    <p className="text-xs text-gray-600 mt-1 font-mono">
                      Invoice: {msg.data.invoiceId}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Processing Complete Message */}
            {msg.type === 'processing_complete' && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-600/20 text-green-400 border border-green-600/30">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Processing Complete</div>
                  <p className="text-sm text-gray-400 mb-3">{msg.data.message}</p>

                  {/* Final Decision */}
                  {msg.data.decision && (
                    <div className={`px-4 py-3 rounded-lg font-bold text-center text-lg border-2 ${
                      msg.data.decision === 'APPROVED'
                        ? 'bg-green-600/20 text-green-400 border-green-600'
                        : 'bg-[#F97272]/20 text-[#F76B5E] border-[#F97272]'
                    }`}>
                      {msg.data.decision}
                    </div>
                  )}

                  {/* Summary Statistics */}
                  {msg.data.summary && (
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      {msg.data.summary.fieldsExtracted && (
                        <div className="p-2 bg-gray-900 rounded">
                          <div className="text-gray-500">Fields Extracted</div>
                          <div className="font-bold text-lg">{msg.data.summary.fieldsExtracted}</div>
                        </div>
                      )}
                      {msg.data.summary.validationPassed !== undefined && (
                        <div className="p-2 bg-gray-900 rounded">
                          <div className="text-gray-500">Validation</div>
                          <div className={`font-bold text-lg ${msg.data.summary.validationPassed ? 'text-green-400' : 'text-[#F76B5E]'}`}>
                            {msg.data.summary.validationPassed ? 'PASSED' : 'FAILED'}
                          </div>
                        </div>
                      )}
                      {msg.data.summary.taxCompliant !== undefined && (
                        <div className="p-2 bg-gray-900 rounded">
                          <div className="text-gray-500">Tax Compliant</div>
                          <div className={`font-bold text-lg ${msg.data.summary.taxCompliant ? 'text-green-400' : 'text-[#F76B5E]'}`}>
                            {msg.data.summary.taxCompliant ? 'YES' : 'NO'}
                          </div>
                        </div>
                      )}
                      {msg.data.summary.fraudRisk !== undefined && (
                        <div className="p-2 bg-gray-900 rounded">
                          <div className="text-gray-500">Fraud Risk</div>
                          <div className={`font-bold text-lg ${
                            msg.data.summary.fraudRisk > 50 ? 'text-[#F76B5E]' : 'text-green-400'
                          }`}>
                            {msg.data.summary.fraudRisk}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {msg.type === 'error' && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#F97272]/20 text-[#F76B5E] border border-[#F97272]/30">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1 text-[#F76B5E]">Error</div>
                  <p className="text-sm text-gray-400">{msg.data.message}</p>
                  {msg.data.error && (
                    <p className="text-xs text-[#EFA498] mt-1 font-mono">{msg.data.error}</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Loader2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">Waiting for processing to start...</p>
          <p className="text-xs mt-2">Upload an invoice and click "Start Processing"</p>
        </div>
      )}
    </div>
  );
};
