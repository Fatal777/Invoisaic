import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Play, Eye, Zap, HelpCircle, Sparkles } from 'lucide-react';
import { GuidedTour, TourStep } from '../../components/GuidedTour';
import { PDFViewer } from '../../components/PDFViewer';
import { AgentActivityStream } from '../../components/AgentActivityStream';
import { WatermarkAnimation } from '../../components/WatermarkAnimation';
import { FraudHeatMap, RiskArea } from '../../components/FraudHeatMap';
import { TaxBreakdownPanel, TaxBreakdown } from '../../components/TaxBreakdownPanel';
import { GLEntryPreview, GLEntry } from '../../components/GLEntryPreview';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAnnotations } from '../../hooks/useAnnotations';
import Navbar from '@/components/Navbar';

export default function LiveDocDemo() {
  const navigate = useNavigate();

  // File state
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string>('');
  const [s3Key, setS3Key] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Watermark state
  const [showWatermark, setShowWatermark] = useState(false);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');

  // Phase 4 state
  const [riskAreas, setRiskAreas] = useState<RiskArea[]>([]);
  const [taxData, setTaxData] = useState<TaxBreakdown | null>(null);
  const [glEntries, setGLEntries] = useState<GLEntry[]>([]);
  const [showTaxPanel, setShowTaxPanel] = useState(false);
  const [showGLPanel, setShowGLPanel] = useState(false);

  // Guided tour state
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  // WebSocket connection
  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:4000';
  const { isConnected, messages, sendMessage, clearMessages } = useWebSocket(wsUrl);

  // Annotations
  const { annotations, addAnnotation, clearAnnotations } = useAnnotations();

  // Tour steps configuration
  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to LiveDoc Intelligence! 👋',
      description: 'Experience real-time AI invoice processing with live visual feedback. This interactive demo will guide you through each step of the process.',
      position: 'center',
    },
    {
      id: 'upload',
      title: 'Step 1: Upload Your Invoice',
      description: 'Start by uploading an invoice document (PDF, JPG, or PNG). You\'ll see it appear in the document viewer on the left.',
      target: '[data-tour="upload-zone"]',
      position: 'bottom',
      highlight: true,
    },
    {
      id: 'preview',
      title: 'Step 2: Preview Your Document',
      description: 'Once uploaded, your document will be displayed here. You can zoom and navigate through pages if it\'s a multi-page PDF.',
      target: '[data-tour="document-viewer"]',
      position: 'right',
      highlight: true,
    },
    {
      id: 'process',
      title: 'Step 3: Start AI Processing',
      description: 'Click the "Start Processing" button to begin. Watch as AI agents extract data, validate fields, and analyze your invoice in real-time!',
      target: '[data-tour="process-button"]',
      position: 'bottom',
      highlight: true,
    },
    {
      id: 'activity',
      title: 'Step 4: Monitor Agent Activity',
      description: 'This panel shows live updates from AI agents as they work. You\'ll see extraction, validation, fraud detection, and tax analysis happening in real-time.',
      target: '[data-tour="activity-stream"]',
      position: 'left',
      highlight: true,
    },
    {
      id: 'annotations',
      title: 'Step 5: Live Visual Annotations',
      description: 'As fields are extracted, you\'ll see colored boxes appear on the document highlighting exactly where each piece of data was found. Different colors represent different field types.',
      target: '[data-tour="document-viewer"]',
      position: 'right',
      highlight: true,
    },
    {
      id: 'results',
      title: 'Step 6: Review Results',
      description: 'After processing, you\'ll see tax breakdowns, GL entries, and fraud analysis. The system will automatically approve or reject the invoice based on AI analysis.',
      position: 'center',
    },
  ];

  // Check if user has seen tour before
  useEffect(() => {
    const tourSeen = localStorage.getItem('livedoc-tour-seen');
    if (!tourSeen) {
      setShowTour(true);
    }
    setHasSeenTour(!!tourSeen);
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('livedoc-tour-seen', 'true');
    setHasSeenTour(true);
  };

  const handleTourSkip = () => {
    setShowTour(false);
    localStorage.setItem('livedoc-tour-seen', 'true');
    setHasSeenTour(true);
  };

  const restartTour = () => {
    setTourStep(0);
    setShowTour(true);
  };

  // Get color based on field type
  const getFieldColor = (fieldName: string): string => {
    const field = fieldName.toLowerCase();

    if (field.includes('invoice') || field.includes('number')) return '#3b82f6'; // Blue
    if (field.includes('date')) return '#8b5cf6'; // Purple
    if (field.includes('total') || field.includes('amount')) return '#ef4444'; // Red
    if (field.includes('tax') || field.includes('gst')) return '#f59e0b'; // Orange
    if (field.includes('name') || field.includes('vendor') || field.includes('customer')) return '#10b981'; // Green
    if (field.includes('address')) return '#06b6d4'; // Cyan

    return '#6b7280'; // Gray for others
  };

  // Track processing step states
  const [processingSteps, setProcessingSteps] = useState({
    upload: { status: 'idle', message: 'Waiting for upload...' },
    extraction: { status: 'idle', message: 'Waiting to start extraction...' },
    validation: { status: 'idle', message: 'Waiting to validate data...' },
    analysis: { status: 'idle', message: 'Waiting for analysis...' },
    completion: { status: 'idle', message: 'Processing not started' }
  });

  // Handle WebSocket messages to update UI state
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    const { type, data } = lastMessage;

    // Handle field extraction updates
    if (type === 'field_extracted' && data.boundingBox) {
      // Add annotation to PDF with color based on field type
      addAnnotation({
        page: data.page || 1,
        x: data.boundingBox.left,
        y: data.boundingBox.top,
        width: data.boundingBox.width,
        height: data.boundingBox.height,
        label: data.fieldName,
        color: getFieldColor(data.fieldName),
        type: 'field_extraction',
        confidence: data.confidence
      });
    }

    // Handle processing status updates
    if (type === 'agent_activity') {
      const { agentName, status, message } = data;
      
      // Update processing steps based on agent activity
      if (agentName.toLowerCase().includes('validation')) {
        setProcessingSteps(prev => ({
          ...prev,
          validation: { status, message }
        }));
      } else if (agentName.toLowerCase().includes('extraction')) {
        setProcessingSteps(prev => ({
          ...prev,
          extraction: { status, message }
        }));
      } else if (agentName.toLowerCase().includes('tax') || 
                agentName.toLowerCase().includes('fraud') ||
                agentName.toLowerCase().includes('analysis')) {
        setProcessingSteps(prev => ({
          ...prev,
          analysis: { status, message }
        }));
      }
    }

    // Handle tax compliance data
    if (type === 'tax_analysis' && data.taxBreakdown) {
      setTaxData(data.taxBreakdown);
      setShowTaxPanel(true);
    }

    // Handle fraud detection data
    if (type === 'fraud_analysis' && data.riskAreas) {
      setRiskAreas(data.riskAreas);
    }

    // Handle GL coding data
    if (type === 'gl_entries' && data.entries) {
      setGLEntries(data.entries);
      setShowGLPanel(true);
    }

    // Handle processing completion
    if (type === 'processing_complete' && data.decision) {
      setDecision(data.decision);
      setShowWatermark(true);
      setIsProcessing(false);
      
      // Update all steps to completed
      setProcessingSteps({
        upload: { status: 'completed', message: 'File uploaded successfully' },
        extraction: { status: 'completed', message: 'Extraction completed' },
        validation: { status: 'completed', message: 'Validation completed' },
        analysis: { status: 'completed', message: 'Analysis completed' },
        completion: { 
          status: 'completed', 
          message: `Processing complete - ${data.decision}` 
        }
      });
    }
  }, [messages, addAnnotation]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states for new file
    setInvoiceFile(file);
    setInvoiceUrl(URL.createObjectURL(file));
    setS3Key('');
    setIsProcessing(false);
    setIsUploading(true);
    setShowWatermark(false);
    setRiskAreas([]);
    setTaxData(null);
    setGLEntries([]);
    setShowTaxPanel(false);
    setShowGLPanel(false);
    clearMessages();
    clearAnnotations();

    // Check file type
    if (!file.type.match(/^(application\/pdf|image\/(jpeg|jpg|png))$/)) {
      alert('Please upload a PDF, JPG, or PNG file');
      setIsUploading(false);
      return;
    }

    setIsUploading(false);
  };

  // Start processing
  const handleStartProcessing = async () => {
    if (!invoiceFile) return;

    setIsProcessing(true);
    setIsUploading(true);
    clearMessages();
    clearAnnotations();

    try {
      // Upload to S3 via Textract endpoint
      const formData = new FormData();
      formData.append('file', invoiceFile);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const uploadResponse = await fetch(`${apiUrl}/textract`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadData);

      setS3Key(uploadData.s3Key);
      setIsUploading(false);

      // Start WebSocket processing
      sendMessage({
        action: 'processInvoice',
        s3Key: uploadData.s3Key,
        invoiceId: `INV-${Date.now()}`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  // Reset demo
  const handleReset = () => {
    setInvoiceFile(null);
    setInvoiceUrl('');
    setS3Key('');
    setIsProcessing(false);
    setIsUploading(false);
    setShowWatermark(false);
    setRiskAreas([]);
    setTaxData(null);
    setGLEntries([]);
    setShowTaxPanel(false);
    setShowGLPanel(false);
    clearMessages();
    clearAnnotations();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar variant="light" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/demo')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F97272] to-[#f85c5c] rounded-xl flex items-center justify-center shadow-lg shadow-[#F97272]/30">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">LiveDoc Intelligence</h1>
                  <p className="text-sm text-gray-600">Real-Time AI Document Processing</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                isConnected ? 'bg-green-50 border-green-300 text-green-700' : 'bg-[#FEF5F4] border-[#F99086] text-[#f85c5c]'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-[#EFA498]'}`} />
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </div>

              <button
                onClick={restartTour}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors group relative border border-gray-300"
                title="Start Guided Tour"
              >
                <HelpCircle className="w-5 h-5 text-gray-600 group-hover:text-[#F97272] transition-colors" />
              </button>

              {invoiceFile && (
                <button
                  onClick={handleReset}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold transition-colors text-gray-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-12">
        {!invoiceFile ? (
          // Upload State
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            {/* First-time user prompt */}
            {!hasSeenTour && !showTour && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 bg-gradient-to-r from-[#F97272] to-[#f85c5c] rounded-xl p-6 border-2 border-[#F97272] shadow-xl shadow-[#F97272]/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#F97272] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-white">New to LiveDoc? Take a Quick Tour!</h3>
                    <p className="text-[#FDDAD6] text-sm mb-4">
                      Learn how to use this demo in just 2 minutes with our interactive guided tour.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={restartTour}
                        className="px-6 py-2 bg-white text-[#F97272] hover:bg-gray-100 rounded-lg font-semibold transition-colors flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Start Tour
                      </button>
                      <button
                        onClick={() => {
                          localStorage.setItem('livedoc-tour-seen', 'true');
                          setHasSeenTour(true);
                        }}
                        className="px-6 py-2 text-white/80 hover:text-white transition-colors"
                      >
                        Skip for now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div data-tour="upload-zone" className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-[#F97272] transition-all duration-300 group shadow-lg">
              <Upload className="w-20 h-20 mx-auto mb-6 text-gray-400 group-hover:text-[#F97272] transition-colors" />
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Upload Invoice</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Upload an invoice to see AI agents process it in real-time with live visual effects
              </p>

              <label className="inline-flex items-center gap-3 px-10 py-5 bg-[#F97272] hover:bg-[#f85c5c] text-white rounded-lg font-bold text-lg transition-colors cursor-pointer group-hover:scale-105 transform duration-200 shadow-lg shadow-[#F97272]/30">
                <Upload className="w-6 h-6" />
                Choose Invoice
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <p className="text-xs text-gray-600 mt-6">
                Supports PDF, JPG, PNG files
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold mb-2 text-gray-900">Live Annotations</h3>
                <p className="text-sm text-gray-600">
                  Watch as AI highlights and extracts fields directly on your invoice
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 transition-all shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold mb-2 text-gray-900">Real-Time Processing</h3>
                <p className="text-sm text-gray-600">
                  See each AI agent work in sequence with live status updates
                </p>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 transition-all shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold mb-2 text-gray-900">Autonomous Decision</h3>
                <p className="text-sm text-gray-600">
                  AI agents collaborate to approve or reject invoices automatically
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // Split-Screen Processing View
          <div className="space-y-8">
            {/* Main Split View */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: PDF Viewer with Annotations */}
              <div data-tour="document-viewer" className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                  <div>
                    <h3 className="text-lg font-bold">Document View</h3>
                    <p className="text-sm text-gray-500">{invoiceFile.name}</p>
                  </div>

                  <button
                    data-tour="process-button"
                    onClick={handleStartProcessing}
                    disabled={isProcessing || isUploading}
                    className="px-6 py-3 bg-[#F97272] hover:bg-[#f85c5c] disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold flex items-center gap-2 transition-all transform hover:scale-105 disabled:hover:scale-100"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Start Processing
                      </>
                    )}
                  </button>
                </div>

                <div className="h-[800px] relative">
                  <PDFViewer url={invoiceUrl} annotations={annotations} />
                  {/* Fraud Heat Map Overlay */}
                  <FraudHeatMap
                    riskAreas={riskAreas}
                    canvasWidth={800}
                    canvasHeight={800}
                    currentPage={1}
                  />
                </div>
              </div>

              {/* Right: Agent Activity Stream */}
              <div data-tour="activity-stream" className="bg-gray-950 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Agent Activity</h3>
                    <p className="text-sm text-gray-500">Live AI Processing Updates</p>
                  </div>
                </div>

                <AgentActivityStream messages={messages} />
              </div>
            </div>

            {/* Bottom Panels: Tax & GL */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Tax Breakdown Panel */}
              <TaxBreakdownPanel taxData={taxData} isVisible={showTaxPanel} />

              {/* GL Entry Preview */}
              <GLEntryPreview entries={glEntries} isVisible={showGLPanel} />
            </div>
          </div>
        )}

        {/* Watermark Animation */}
        <WatermarkAnimation decision={decision} show={showWatermark} />

        {/* Guided Tour */}
        <GuidedTour
          steps={tourSteps}
          isActive={showTour}
          currentStepIndex={tourStep}
          onStepChange={setTourStep}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      </div>
    </div>
  );
}
