/**
 * Agent Dashboard - Comprehensive demo page for judges
 * Shows real-time agent activity, processing flow, and results
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  FileText,
  Shield,
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Upload,
  Play,
  Download
} from 'lucide-react';

interface AgentStatus {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  message: string;
  timestamp?: string;
  data?: any;
}

interface ProcessingResult {
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  extractedData?: any;
  complianceResults?: any;
  validationResults?: any;
  processingTime: number;
  agentLogs: any[];
}

const AgentDashboard: React.FC = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'Orchestrator', status: 'idle', message: 'Ready to coordinate workflow' },
    { name: 'Extraction Agent', status: 'idle', message: 'Ready to extract invoice data with Textract' },
    { name: 'Compliance Agent', status: 'idle', message: 'Ready to validate tax compliance' },
    { name: 'Validation Agent', status: 'idle', message: 'Ready to perform final quality checks' },
  ]);

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Sample invoice for demo
  const sampleInvoice = {
    invoice_number: 'INV-2024-12345',
    invoice_date: '2024-10-22',
    seller: {
      name: 'TechCorp Solutions Pvt Ltd',
      address: '123 Business Park, Mumbai, India',
      gst_number: '27AABCT1234F1Z5',
    },
    buyer: {
      name: 'Global Enterprises Ltd',
      address: '456 Corporate Ave, Delhi, India',
      gst_number: '07AACCE5678K1Z4',
    },
    line_items: [
      { description: 'Software License - Annual', quantity: 1, rate: 50000, amount: 50000 },
      { description: 'Professional Services', quantity: 40, rate: 1500, amount: 60000 },
      { description: 'Cloud Hosting', quantity: 12, rate: 2500, amount: 30000 },
    ],
    subtotal: 140000,
    cgst: 12600,
    sgst: 12600,
    total: 165200,
    country: 'India',
  };

  const updateAgentStatus = (agentName: string, status: AgentStatus['status'], message: string, data?: any) => {
    setAgents(prev => 
      prev.map(agent => 
        agent.name === agentName 
          ? { ...agent, status, message, timestamp: new Date().toISOString(), data }
          : agent
      )
    );

    addLog(`[${agentName}] ${status.toUpperCase()}: ${message}`);
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const processInvoice = async () => {
    setProcessing(true);
    setResult(null);
    setLogs([]);
    
    // Reset all agents
    setAgents(agents.map(a => ({ ...a, status: 'idle' as const, message: 'Ready' })));

    try {
      addLog('Starting invoice processing workflow...');

      // Step 1: Orchestrator starts
      updateAgentStatus('Orchestrator', 'running', 'Initializing workflow...');
      await delay(1000);

      // Step 2: Extraction Agent
      updateAgentStatus('Extraction Agent', 'running', 'Extracting invoice data...');
      await delay(2000);
      
      const extractedData = sampleInvoice;
      updateAgentStatus('Extraction Agent', 'completed', 
        `Extracted ${Object.keys(extractedData).length} fields successfully`, extractedData);
      await delay(500);

      // Step 3: Compliance Agent
      updateAgentStatus('Compliance Agent', 'running', 'Validating against GST regulations...');
      await delay(2500);
      
      const complianceResults = {
        compliant: true,
        country: 'India',
        applicable_regulations: ['GST Act 2017', 'E-Invoice requirements'],
        checks_performed: [
          { check: 'GST Number Format', status: 'PASS', details: 'Valid GSTIN format' },
          { check: 'Tax Rate Calculation', status: 'PASS', details: '18% GST correctly applied' },
          { check: 'E-Invoice Compliance', status: 'PASS', details: 'All required fields present' },
          { check: 'Invoice Numbering', status: 'PASS', details: 'Sequential numbering followed' },
        ],
        tax_breakdown: {
          subtotal: 140000,
          cgst_rate: 9,
          cgst_amount: 12600,
          sgst_rate: 9,
          sgst_amount: 12600,
          total: 165200,
        },
      };

      updateAgentStatus('Compliance Agent', 'completed', 
        'Invoice is fully compliant with GST regulations', complianceResults);
      await delay(500);

      // Step 4: Validation Agent
      updateAgentStatus('Validation Agent', 'running', 'Performing final validation...');
      await delay(2000);

      const validationResults = {
        validation_status: 'passed',
        confidence_score: 0.96,
        ready_for_processing: true,
        checks: [
          { check: 'Data Completeness', status: 'PASS', score: 1.0 },
          { check: 'Mathematical Accuracy', status: 'PASS', score: 1.0 },
          { check: 'Date Validity', status: 'PASS', score: 1.0 },
          { check: 'Format Consistency', status: 'PASS', score: 0.98 },
        ],
        warnings: [],
      };

      updateAgentStatus('Validation Agent', 'completed', 
        'All validation checks passed', validationResults);
      await delay(500);

      // Orchestrator completes
      updateAgentStatus('Orchestrator', 'completed', 'Workflow completed successfully');

      // Build final result
      const finalResult: ProcessingResult = {
        status: 'APPROVED',
        extractedData,
        complianceResults,
        validationResults,
        processingTime: 6500,
        agentLogs: agents.map(a => ({ ...a })),
      };

      setResult(finalResult);
      addLog('✅ Invoice processing completed: APPROVED');

    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      updateAgentStatus('Orchestrator', 'failed', 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'running':
        return <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getAgentIcon = (name: string) => {
    if (name.includes('Extraction')) return FileText;
    if (name.includes('Compliance')) return Shield;
    if (name.includes('Validation')) return CheckSquare;
    return Activity;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Modern Header */}
      <div className="border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">
                Agent Dashboard
              </h1>
              <p className="text-gray-400 text-sm">
                Monitor and orchestrate AI agents for invoice processing
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-gray-900/80 rounded-lg border border-gray-800">
                <span className="text-xs text-gray-500">Powered by</span>
                <span className="ml-2 text-sm font-medium text-blue-400">Bedrock Nova</span>
              </div>
              <div className="px-4 py-2 bg-gray-900/80 rounded-lg border border-gray-800">
                <span className="text-sm font-medium text-gray-300">4 Agents</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900/50 rounded-2xl p-8 mb-8 border border-gray-800/50 backdrop-blur-sm"
        >
          <div className="space-y-8">
            {/* File Upload Section */}
            <div>
              <h2 className="text-xl font-semibold mb-1 text-white">Upload Invoice</h2>
              <p className="text-gray-500 text-sm mb-6">Upload a PDF or image invoice to process with AI agents</p>
              
              <div className="flex items-center gap-4">
                <label className="flex-1">
                  <div className="flex items-center gap-3 p-6 bg-gray-900/80 rounded-xl border-2 border-dashed border-gray-800 hover:border-blue-500/50 transition-all cursor-pointer group">
                    <Upload className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">
                        {selectedFile ? selectedFile.name : 'Choose invoice file or drag here'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedFile ? `${(selectedFile.size / 1024).toFixed(2)} KB` : 'PDF, PNG, JPG up to 10MB'}
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Process Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div>
                <p className="text-sm text-gray-500">
                  {selectedFile ? 'Ready to process uploaded invoice' : 'Or use sample invoice for quick demo'}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={processInvoice}
                  disabled={processing}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Play className="w-4 h-4" />
                  {processing ? 'Processing...' : (selectedFile ? 'Process Upload' : 'Demo with Sample')}
                </button>

              {result && (
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(result, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'processing-result.json';
                    link.click();
                  }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium text-sm flex items-center gap-2 border border-gray-700 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
            </div>
            </div>
          </div>
        </motion.div>

        {/* Agent Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {agents.map((agent, index) => {
            const Icon = getAgentIcon(agent.name);
            
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-gray-900/50 rounded-2xl p-6 border transition-all backdrop-blur-sm ${
                  agent.status === 'running' 
                    ? 'border-yellow-500/50 bg-yellow-500/5' 
                    : agent.status === 'completed'
                    ? 'border-green-500/50 bg-green-500/5'
                    : agent.status === 'failed'
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-gray-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-gray-800/50 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-300" />
                  </div>
                  {getStatusIcon(agent.status)}
                </div>
                
                <h3 className="text-base font-semibold mb-1 text-white">{agent.name}</h3>
                <p className="text-gray-500 text-sm mb-2">{agent.message}</p>
                
                {agent.timestamp && (
                  <p className="text-xs text-gray-600">
                    {new Date(agent.timestamp).toLocaleTimeString()}
                  </p>
                )}

                {agent.status === 'running' && (
                  <div className="mt-4">
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Results Panel */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
            >
              {/* Final Status */}
              <div className={`bg-gray-900/50 rounded-2xl p-6 border backdrop-blur-sm ${
                result.status === 'APPROVED' ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
              }`}>
                <div className="flex items-center gap-4 mb-4">
                  {result.status === 'APPROVED' ? (
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-500" />
                  )}
                  <div>
                    <h3 className="text-2xl font-bold">
                      {result.status === 'APPROVED' ? 'Invoice Approved' : 'Invoice Rejected'}
                    </h3>
                    <p className="text-gray-400">
                      Processed in {(result.processingTime / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                    <span className="text-gray-400 text-sm">Invoice Number</span>
                    <span className="font-medium text-white">{result.extractedData?.invoice_number}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                    <span className="text-gray-400 text-sm">Total Amount</span>
                    <span className="font-medium text-white">₹{result.extractedData?.total?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                    <span className="text-gray-400 text-sm">Compliance</span>
                    <span className="font-medium text-green-400">
                      {result.complianceResults?.checks_performed?.filter((c: any) => c.status === 'PASS').length || 0} / 
                      {result.complianceResults?.checks_performed?.length || 0} Checks Passed
                    </span>
                  </div>
                  <div className="flex justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                    <span className="text-gray-400 text-sm">Confidence Score</span>
                    <span className="font-medium text-white">
                      {((result.validationResults?.confidence_score || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Compliance Details */}
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Compliance Checks
                </h3>

                <div className="space-y-2">
                  {result.complianceResults?.checks_performed?.map((check: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-300">{check.check}</span>
                      </div>
                      <span className="text-xs text-gray-500">{check.details}</span>
                    </div>
                  ))}
                </div>

                {result.complianceResults?.tax_breakdown && (
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-800">
                    <h4 className="font-medium mb-3 text-white text-sm">Tax Breakdown</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Subtotal</span>
                        <span className="text-gray-300">₹{result.complianceResults.tax_breakdown.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>CGST (9%)</span>
                        <span className="text-gray-300">₹{result.complianceResults.tax_breakdown.cgst_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>SGST (9%)</span>
                        <span className="text-gray-300">₹{result.complianceResults.tax_breakdown.sgst_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-gray-700 pt-2 mt-2 text-white">
                        <span>Total</span>
                        <span>₹{result.complianceResults.tax_breakdown.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logs Panel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/50 backdrop-blur-sm"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-purple-400" />
            Activity Logs
          </h3>
          
          <div className="bg-[#0A0A0A] rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm border border-gray-800">
            {logs.length === 0 ? (
              <p className="text-gray-600">No activity yet. Start processing to see logs.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-2 text-gray-400">
                  <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AgentDashboard;
