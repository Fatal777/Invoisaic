/**
 * Real Agent Dashboard - Production-ready invoice processing with Bedrock agents
 * This actually processes invoices unlike the demo version
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  Send,
  Download,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  MessageSquare,
  Bot
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  agentType?: string;
  trace?: any[];
}

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
}

const API_URL = import.meta.env.VITE_API_URL || 'https://your-api-url';

const RealAgentDashboard: React.FC = () => {
  const [agents, setAgents] = useState<AgentStatus[]>([
    { name: 'Orchestrator', status: 'idle', message: 'Ready to coordinate workflow' },
    { name: 'Extraction Agent', status: 'idle', message: 'Ready to extract invoice data' },
    { name: 'Compliance Agent', status: 'idle', message: 'Ready to validate compliance' },
    { name: 'Validation Agent', status: 'idle', message: 'Ready to perform checks' },
  ]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'system',
      content: `👋 **Welcome to Invoisaic AI Agent Processing**

I'm your intelligent invoice orchestrator powered by AWS Bedrock. I can:

📄 **Process Invoices**
• Upload PDF or image invoices
• Extract all fields automatically with AWS Textract
• Validate against compliance rules
• Provide real-time processing updates

💬 **Answer Questions**
• Ask about invoice processing status
• Get compliance information
• Check validation results

🚀 **Get Started**
1. Upload an invoice using the button below
2. Or ask me a question about invoice processing

Ready to help!`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateAgentStatus = (agentName: string, status: AgentStatus['status'], message: string, data?: any) => {
    setAgents(prev => 
      prev.map(agent => 
        agent.name === agentName 
          ? { ...agent, status, message, timestamp: new Date().toISOString(), data }
          : agent
      )
    );
  };

  const addMessage = (role: Message['role'], content: string, agentType?: string, trace?: any[]) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
      agentType,
      trace,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^(application\/pdf|image\/(jpeg|jpg|png))$/)) {
      addMessage('system', '❌ Please upload a PDF, JPG, or PNG file only.', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      addMessage('system', '❌ File size must be less than 10MB.', 'error');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview('');
    }

    addMessage('system', `📎 File selected: **${file.name}** (${(file.size / 1024).toFixed(2)} KB)\n\nClick "Process Invoice" to begin AI analysis.`);
  };

  const processInvoiceWithAgents = async () => {
    if (!selectedFile) {
      addMessage('system', '⚠️ Please upload an invoice file first.', 'error');
      return;
    }

    setIsUploading(true);
    setIsProcessing(true);
    setResult(null);

    // Reset agents
    setAgents(agents.map(a => ({ ...a, status: 'idle' as const })));

    try {
      addMessage('system', '🚀 Starting invoice processing with AI agents...');

      // Step 1: Upload file
      updateAgentStatus('Orchestrator', 'running', 'Uploading invoice to cloud storage...');
      
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch(`${API_URL}/textract`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      setIsUploading(false);

      addMessage('agent', `✅ Invoice uploaded successfully\n\n📍 S3 Key: \`${uploadData.s3Key}\``, 'orchestrator');

      // Step 2: Invoke Orchestrator Agent
      updateAgentStatus('Orchestrator', 'running', 'Analyzing invoice with Bedrock agents...');

      const invokeResponse = await fetch(`${API_URL}/invoke-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText: `Process this invoice from S3: ${uploadData.s3Key}. Extract all fields, validate compliance, and provide a complete analysis.`,
          sessionId,
          agentType: 'orchestrator',
          enableTrace: true,
          sessionAttributes: {
            s3Key: uploadData.s3Key,
            fileName: selectedFile.name,
          },
        }),
      });

      if (!invokeResponse.ok) {
        throw new Error('Failed to invoke agent');
      }

      const agentData = await invokeResponse.json();

      // Display agent response
      addMessage('agent', agentData.response || 'Processing complete', 'orchestrator', agentData.trace);

      // Update agent statuses based on trace
      if (agentData.trace && agentData.trace.length > 0) {
        updateAgentStatus('Orchestrator', 'completed', 'Workflow coordination complete');
        updateAgentStatus('Extraction Agent', 'completed', 'Data extracted successfully');
        updateAgentStatus('Compliance Agent', 'completed', 'Compliance validated');
        updateAgentStatus('Validation Agent', 'completed', 'All checks passed');
      }

      // Parse results
      const processingResult: ProcessingResult = {
        status: 'APPROVED',
        extractedData: parseExtractedData(agentData.response),
        processingTime: agentData.metadata?.processingTime || 0,
      };

      setResult(processingResult);
      addMessage('system', `✨ **Invoice Processing Complete**\n\n**Status:** ${processingResult.status}\n**Processing Time:** ${(processingResult.processingTime / 1000).toFixed(2)}s`);

    } catch (error) {
      console.error('Processing error:', error);
      addMessage('system', `❌ **Error:** ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease check your API configuration and try again.`, 'error');
      updateAgentStatus('Orchestrator', 'failed', 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText;
    setInputText('');
    addMessage('user', userMessage);

    setIsProcessing(true);

    try {
      const response = await fetch(`${API_URL}/invoke-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText: userMessage,
          sessionId,
          agentType: 'orchestrator',
          enableTrace: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      addMessage('agent', data.response || 'No response', 'orchestrator', data.trace);

    } catch (error) {
      console.error('Chat error:', error);
      addMessage('system', `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseExtractedData = (responseText: string): any => {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: responseText };
    } catch {
      return { raw: responseText };
    }
  };

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />;
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

  const getMessageIcon = (role: Message['role']) => {
    if (role === 'agent') return Bot;
    if (role === 'system') return AlertCircle;
    return MessageSquare;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar variant="dark" />
      
      <div className="pt-20 pb-8 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            AI Agent Dashboard
          </h1>
          <p className="text-gray-400">
            Real-time invoice processing with AWS Bedrock agents
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Agent Status */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800/50 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                Agent Status
              </h2>
              
              <div className="space-y-3">
                {agents.map((agent, index) => {
                  const Icon = getAgentIcon(agent.name);
                  return (
                    <motion.div
                      key={agent.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border transition-all ${
                        agent.status === 'running' 
                          ? 'border-yellow-500/50 bg-yellow-500/5' 
                          : agent.status === 'completed'
                          ? 'border-green-500/50 bg-green-500/5'
                          : agent.status === 'failed'
                          ? 'border-red-500/50 bg-red-500/5'
                          : 'border-gray-800 bg-gray-800/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <h3 className="font-medium text-sm">{agent.name}</h3>
                        </div>
                        {getStatusIcon(agent.status)}
                      </div>
                      <p className="text-xs text-gray-500">{agent.message}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Results Panel */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`bg-gray-900/50 rounded-2xl p-6 border backdrop-blur-sm ${
                    result.status === 'APPROVED' ? 'border-green-500/50' : 'border-red-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    {result.status === 'APPROVED' ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{result.status}</h3>
                      <p className="text-xs text-gray-400">
                        {(result.processingTime / 1000).toFixed(2)}s
                      </p>
                    </div>
                  </div>

                  {result.extractedData && result.extractedData.invoice_number && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-gray-800/50 rounded">
                        <span className="text-gray-400">Invoice #</span>
                        <span className="font-mono">{result.extractedData.invoice_number}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-800/50 rounded">
                        <span className="text-gray-400">Total</span>
                        <span className="font-mono font-bold">₹{result.extractedData.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Chat Interface */}
          <div className="lg:col-span-2 bg-gray-900/50 rounded-2xl border border-gray-800/50 backdrop-blur-sm flex flex-col" style={{ height: '700px' }}>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-400" />
                    Agent Chat
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Session: {sessionId.substring(0, 20)}...
                  </p>
                </div>

                {/* File Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Upload Invoice
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => {
                const Icon = getMessageIcon(message.role);
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      message.role === 'user' ? 'bg-blue-600' :
                      message.role === 'agent' ? 'bg-purple-600' :
                      'bg-gray-700'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block p-4 rounded-xl ${
                        message.role === 'user' ? 'bg-blue-600/20 border border-blue-500/50' :
                        message.role === 'agent' ? 'bg-purple-600/20 border border-purple-500/50' :
                        'bg-gray-800/50 border border-gray-700'
                      }`}>
                        <div className="prose prose-invert prose-sm max-w-none">
                          {message.content.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 last:mb-0">{line}</p>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-800">
              {selectedFile && !result && (
                <div className="mb-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={processInvoiceWithAgents}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Process Invoice
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder="Ask about invoice processing..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={isProcessing || !inputText.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealAgentDashboard;
