import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Upload, FileText, Brain, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  trace?: TraceEvent[];
  metadata?: {
    agentType?: string;
    processingTime?: number;
    traceEventsCount?: number;
  };
}

interface TraceEvent {
  timestamp: string;
  type: string;
  content?: any;
  rationale?: any;
  observation?: any;
  invocationInput?: any;
  failureReason?: string;
}

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://your-api-gateway.execute-api.us-east-1.amazonaws.com/prod';

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [showTrace, setShowTrace] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<'supervisor' | 'extraction' | 'fraudDetection' | 'compliance' | 'approval' | 'cashFlow'>('supervisor');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'system',
      content: `Welcome to Invoisaic Multi-Agent System! I'm the ${selectedAgent === 'supervisor' ? 'Supervisor Agent' : selectedAgent} ready to help you with invoice processing.

Try asking:
• "Process invoice from S3"
• "Check vendor history for Acme Corp"
• "What are the US tax requirements?"
• "Forecast cash flow for next 90 days"
• "Analyze vendor concentration risks"`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await fetch(`${API_ENDPOINT}/invoke-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText: text,
          sessionId,
          agentType: selectedAgent,
          enableTrace: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const agentMessage: Message = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: data.response || 'Processing complete',
        timestamp: new Date(),
        trace: data.trace || [],
        metadata: data.metadata,
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (error) {
      console.error('Agent invocation failed:', error);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        content: `⚠️ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}

Make sure:
• Bedrock agents are configured
• API Gateway endpoint is correct
• Agent IDs are set in environment variables`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setInputText('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      sendMessage(`Process uploaded file: ${file.name}`);
    }
  };

  const renderTraceEvent = (trace: TraceEvent, index: number) => {
    const [expanded, setExpanded] = useState(false);

    const getTraceIcon = (type: string) => {
      switch (type) {
        case 'preprocessing': return <Brain className="w-4 h-4 text-blue-500" />;
        case 'orchestration_input': return <Send className="w-4 h-4 text-green-500" />;
        case 'orchestration_observation': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
        case 'orchestration_rationale': return <Brain className="w-4 h-4 text-purple-500" />;
        case 'failure': return <AlertTriangle className="w-4 h-4 text-red-500" />;
        default: return <FileText className="w-4 h-4 text-gray-500" />;
      }
    };

    const getTraceTitle = (type: string) => {
      const titles: Record<string, string> = {
        'preprocessing': 'Pre-processing',
        'orchestration_input': 'Agent Input',
        'orchestration_observation': 'Observation',
        'orchestration_rationale': 'Reasoning',
        'orchestration_model_input': 'Model Input',
        'postprocessing': 'Post-processing',
        'failure': 'Error',
      };
      return titles[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="mb-2"
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-left"
        >
          <div className="flex-shrink-0 mt-1">
            {getTraceIcon(trace.type)}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {getTraceTitle(trace.type)}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {new Date(trace.timestamp).toLocaleTimeString()}
                </span>
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>
            
            {/* Show preview if not expanded */}
            {!expanded && trace.type === 'orchestration_rationale' && trace.rationale?.text && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {trace.rationale.text}
              </p>
            )}
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 ml-10 overflow-hidden"
            >
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                {trace.type === 'orchestration_rationale' && trace.rationale?.text && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border-l-4 border-purple-400">
                    <span className="font-medium text-purple-700 dark:text-purple-300 block mb-2">Agent Reasoning:</span>
                    <p className="text-sm whitespace-pre-wrap">{trace.rationale.text}</p>
                  </div>
                )}
                
                {trace.type === 'orchestration_observation' && trace.observation && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border-l-4 border-green-400">
                    <span className="font-medium text-green-700 dark:text-green-300 block mb-2">Action Result:</span>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(trace.observation, null, 2)}
                    </pre>
                  </div>
                )}
                
                {trace.type === 'failure' && trace.failureReason && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-red-400">
                    <span className="font-medium text-red-700 dark:text-red-300 block mb-2">Error:</span>
                    <p className="text-sm">{trace.failureReason}</p>
                  </div>
                )}
                
                {!['orchestration_rationale', 'orchestration_observation', 'failure'].includes(trace.type) && (
                  <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                    {JSON.stringify(trace, null, 2)}
                  </pre>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div className={`max-w-4xl ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : isSystem 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        } rounded-lg p-4 shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              isUser ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {message.role === 'user' ? 'You' : message.role === 'agent' ? `${selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1)} Agent` : 'System'}
            </span>
            <span className={`text-xs ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>

          {message.metadata && (
            <div className="mt-2 pt-2 border-t border-opacity-20 text-xs text-gray-500">
              Processing time: {message.metadata.processingTime}ms • Trace events: {message.metadata.traceEventsCount}
            </div>
          )}

          {message.trace && message.trace.length > 0 && showTrace && !isUser && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Agent Reasoning Trace ({message.trace.length} steps)
                </h3>
              </div>
              
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {message.trace.map((trace, index) => renderTraceEvent(trace, index))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Invoisaic Multi-Agent System
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              6 Specialized Agents • Session: {sessionId.slice(0, 8)}...
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Agent Selector */}
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="supervisor">Supervisor Agent</option>
              <option value="extraction">Extraction Agent</option>
              <option value="fraudDetection">Fraud Detection Agent</option>
              <option value="compliance">Compliance Agent</option>
              <option value="approval">Approval Agent</option>
              <option value="cashFlow">Cash Flow Agent</option>
            </select>

            <button
              onClick={() => setShowTrace(!showTrace)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                showTrace 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {showTrace ? 'Hide' : 'Show'} Trace
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map(renderMessage)}
        </AnimatePresence>
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-600 dark:text-gray-300">Agent is processing...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
        <div className="flex items-end space-x-3">
          <div className="flex-grow">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputText);
                }
              }}
              placeholder="Ask about invoices, compliance, cash flow forecasting..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              rows={2}
              disabled={isProcessing}
            />
          </div>
          
          <div className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => sendMessage(inputText)}
              disabled={isProcessing || !inputText.trim()}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
