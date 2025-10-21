import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Brain, ShoppingCart, AlertTriangle, TrendingUp, Shield, Zap, Eye, CheckCircle, XCircle, DollarSign, Clock, MapPin, User, Building2 } from 'lucide-react';
import Navbar from '@/components/Navbar';

// Simulated e-commerce platforms for purchase detection
const ECOMMERCE_PLATFORMS = [
  { name: 'Amazon India', domain: 'amazon.in', commission: 2.5 },
  { name: 'Flipkart', domain: 'flipkart.com', commission: 3.0 },
  { name: 'Apple Store India', domain: 'apple.com/in', commission: 1.5 },
  { name: 'Myntra', domain: 'myntra.com', commission: 4.0 },
  { name: 'Nykaa', domain: 'nykaa.com', commission: 3.5 }
];

// Product database with market intelligence
const PRODUCT_DATABASE = {
  'iphone 15': {
    name: 'iPhone 15 128GB',
    category: 'Electronics',
    hsn: '8517',
    marketPrice: { min: 79900, max: 82900, avg: 81400 },
    brand: 'Apple',
    warranty: '1 Year',
    specifications: ['A16 Bionic', '128GB Storage', '6.1" Display'],
    taxRate: 0.18,
    importDuty: 0.20
  },
  'macbook': {
    name: 'MacBook Air M2',
    category: 'Electronics', 
    hsn: '8471',
    marketPrice: { min: 114900, max: 119900, avg: 117400 },
    brand: 'Apple',
    warranty: '1 Year',
    specifications: ['M2 Chip', '8GB RAM', '256GB SSD'],
    taxRate: 0.18,
    importDuty: 0.20
  }
};

export default function DemoSimulator() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [buyerLocation, setBuyerLocation] = useState('');
  const [processing, setProcessing] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [detectedAnomalies, setDetectedAnomalies] = useState<any[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null);
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const [currentPhase, setCurrentPhase] = useState(0);

  const agentPhases = [
    'Purchase Detection',
    'Market Price Analysis', 
    'Fraud & Anomaly Detection',
    'Tax Optimization',
    'Seller/Buyer Verification',
    'Invoice Generation'
  ];

  const simulateAgenticPurchase = async () => {
    if (!selectedProduct || !purchaseAmount || !buyerLocation) return;
    
    setProcessing(true);
    setCurrentPhase(0);
    setAgentLogs([]);
    setDetectedAnomalies([]);
    setMarketAnalysis(null);
    setInvoiceResult(null);

    const amount = parseFloat(purchaseAmount);
    const product = PRODUCT_DATABASE[selectedProduct as keyof typeof PRODUCT_DATABASE];

    try {
      // Call real Bedrock Agent
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      setAgentLogs(prev => [...prev, '🚀 Connecting to AWS Bedrock Agent...']);
      
      const response = await fetch(`${API_URL}/agentic-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process-purchase',
          data: {
            productName: product.name,
            amount: amount,
            location: buyerLocation,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Agent invocation failed');
      }

      const result = await response.json();
      
      // Stream logs from agent
      if (result.logs) {
        for (let i = 0; i < result.logs.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 300));
          setAgentLogs(prev => [...prev, result.logs[i]]);
          setCurrentPhase(Math.min(i + 1, 6));
        }
      }

      // Update UI with results
      if (result.marketAnalysis) {
        setMarketAnalysis(result.marketAnalysis);
      }

      if (result.fraudAnalysis) {
        setDetectedAnomalies(result.fraudAnalysis.anomalies || []);
      }

      if (result.invoice) {
        setInvoiceResult(result.invoice);
      }

      setProcessing(false);
      return;
    } catch (error) {
      console.error('Agent error:', error);
      setAgentLogs(prev => [...prev, '⚠️ Using fallback simulation...']);
    }
    
    // Fallback to simulation if agent fails
    // Phase 1: Purchase Detection
    setCurrentPhase(1);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAgentLogs(prev => [...prev, '🔍 AGENT: Purchase transaction detected']);
    setAgentLogs(prev => [...prev, `📱 Product: ${product.name}`]);
    setAgentLogs(prev => [...prev, `💰 Amount: ₹${amount.toLocaleString()}`]);
    setAgentLogs(prev => [...prev, `📍 Location: ${buyerLocation}`]);
    
    // Phase 2: Market Analysis
    setCurrentPhase(2);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setAgentLogs(prev => [...prev, '🧠 AGENT: Analyzing market prices across platforms...']);
    
    const priceVariance = ((amount - product.marketPrice.avg) / product.marketPrice.avg) * 100;
    const analysis = {
      marketPrice: product.marketPrice,
      paidPrice: amount,
      variance: priceVariance,
      recommendation: priceVariance > 10 ? 'OVERPRICED' : priceVariance < -5 ? 'GREAT_DEAL' : 'FAIR_PRICE'
    };
    
    setMarketAnalysis(analysis);
    setAgentLogs(prev => [...prev, `📊 Market avg: ₹${product.marketPrice.avg.toLocaleString()}`]);
    setAgentLogs(prev => [...prev, `📈 Price variance: ${priceVariance.toFixed(1)}%`]);
    
    // Phase 3: Fraud Detection
    setCurrentPhase(3);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAgentLogs(prev => [...prev, '🛡️ AGENT: Running fraud detection algorithms...']);
    
    const anomalies = [];
    if (Math.abs(priceVariance) > 20) {
      anomalies.push({
        type: 'PRICE_ANOMALY',
        severity: 'HIGH',
        message: `Price ${priceVariance > 0 ? 'significantly higher' : 'suspiciously lower'} than market average`
      });
    }
    
    if (amount > 100000) {
      anomalies.push({
        type: 'HIGH_VALUE',
        severity: 'MEDIUM', 
        message: 'High-value transaction requires additional verification'
      });
    }
    
    setDetectedAnomalies(anomalies);
    setAgentLogs(prev => [...prev, `⚠️ Anomalies detected: ${anomalies.length}`]);
    
    // Phase 4: Tax Optimization
    setCurrentPhase(4);
    await new Promise(resolve => setTimeout(resolve, 1800));
    setAgentLogs(prev => [...prev, '💡 AGENT: Calculating optimal tax structure...']);
    
    const gstAmount = amount * product.taxRate;
    const totalWithTax = amount + gstAmount;
    
    setAgentLogs(prev => [...prev, `📋 HSN Code: ${product.hsn}`]);
    setAgentLogs(prev => [...prev, `💸 GST (18%): ₹${gstAmount.toLocaleString()}`]);
    
    // Phase 5: Entity Verification
    setCurrentPhase(5);
    await new Promise(resolve => setTimeout(resolve, 2200));
    setAgentLogs(prev => [...prev, '🏢 AGENT: Verifying seller and buyer entities...']);
    
    const seller = {
      name: 'TechMart Electronics Pvt Ltd',
      gstin: 'GST123456789',
      address: 'Electronic City, Bangalore, Karnataka',
      verified: true
    };
    
    const buyer = {
      name: 'Rahul Sharma',
      location: buyerLocation,
      verified: true
    };
    
    setAgentLogs(prev => [...prev, `✅ Seller verified: ${seller.name}`]);
    setAgentLogs(prev => [...prev, `✅ Buyer verified: ${buyer.name}`]);
    
    // Phase 6: Invoice Generation
    setCurrentPhase(6);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setAgentLogs(prev => [...prev, '📄 AGENT: Generating comprehensive invoice...']);
    
    const invoice = {
      invoiceNumber: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN'),
      time: new Date().toLocaleTimeString('en-IN'),
      product: product,
      seller: seller,
      buyer: buyer,
      amount: amount,
      gst: gstAmount,
      total: totalWithTax,
      marketAnalysis: analysis,
      anomalies: anomalies,
      processingTime: '8.7s',
      confidence: anomalies.length === 0 ? 98 : 85
    };
    
    setInvoiceResult(invoice);
    setAgentLogs(prev => [...prev, '✅ AGENT: Invoice generated with market intelligence']);
    setAgentLogs(prev => [...prev, '🚀 AGENT: All systems operational']);
    
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-to-r from-[#F97272] to-[#EFA498] text-white text-sm px-4 py-2 mb-4">
            🤖 Agentic AI System
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white">
            Autonomous Invoice Agent
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-2">
            AI agent that detects, analyzes, and processes purchases automatically
          </p>
          <p className="text-gray-500">
            Market Intelligence • Fraud Detection • Tax Optimization • Full Automation
          </p>
        </div>

        {/* Purchase Simulation */}
        <Card className="mb-8 bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShoppingCart className="h-5 w-5 text-[#EFA498]" />
              Simulate Purchase
            </CardTitle>
            <p className="text-gray-400">The AI agent will automatically detect and process this purchase</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Product
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                >
                  <option value="">Choose a product...</option>
                  <option value="iphone 15">iPhone 15 128GB</option>
                  <option value="macbook">MacBook Air M2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Purchase Amount (₹)
                </label>
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                  placeholder="65000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buyer Location
                </label>
                <input
                  type="text"
                  value={buyerLocation}
                  onChange={(e) => setBuyerLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                  placeholder="Mumbai, Maharashtra"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Processing */}
        {(processing || agentLogs.length > 0) && (
          <Card className="mb-8 bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Brain className="h-5 w-5 text-[#EFA498]" />
                Agentic AI Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Phase Progress */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {agentPhases.map((phase, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    idx < currentPhase ? 'bg-green-500/20 border-green-500/50 text-green-400' :
                    idx === currentPhase ? 'bg-[#EFA498]/20 border-[#FEF5F4]0/50 text-[#F76B5E] animate-pulse' :
                    'bg-white/5 border-white/10 text-gray-500'
                  }`}>
                    <div className="text-sm font-medium">{phase}</div>
                  </div>
                ))}
              </div>

              {/* Agent Logs */}
              <div className="bg-black/50 rounded-xl p-4 font-mono text-sm max-h-64 overflow-y-auto">
                {agentLogs.map((log, idx) => (
                  <div key={idx} className="text-green-400 mb-1 animate-fadeIn">
                    {log}
                  </div>
                ))}
                {processing && (
                  <div className="text-yellow-400 animate-pulse">
                    ▶ Agent processing...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Market Analysis */}
        {marketAnalysis && (
          <Card className="mb-8 bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-[#EFA498]" />
                Market Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Market Average</div>
                  <div className="text-xl font-bold text-white">₹{marketAnalysis?.marketPrice?.avg?.toLocaleString() || '0'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">You Paid</div>
                  <div className="text-xl font-bold text-white">₹{marketAnalysis?.paidPrice?.toLocaleString() || '0'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Price Variance</div>
                  <div className={`text-xl font-bold ${(marketAnalysis?.variance || 0) > 0 ? 'text-[#F76B5E]' : 'text-green-400'}`}>
                    {(marketAnalysis?.variance || 0) > 0 ? '+' : ''}{(marketAnalysis?.variance || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Recommendation</div>
                  <div className={`text-sm font-bold ${
                    marketAnalysis?.recommendation === 'GREAT_DEAL' ? 'text-green-400' :
                    marketAnalysis?.recommendation === 'OVERPRICED' ? 'text-[#F76B5E]' : 'text-yellow-400'
                  }`}>
                    {marketAnalysis?.recommendation?.replace('_', ' ') || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Anomaly Detection */}
        {detectedAnomalies.length > 0 && (
          <Card className="mb-8 bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-[#EFA498]" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {detectedAnomalies.map((anomaly, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${
                    anomaly.severity === 'HIGH' ? 'bg-[#EFA498]/20 border-[#FEF5F4]0/50' :
                    'bg-yellow-500/20 border-yellow-500/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${
                        anomaly.severity === 'HIGH' ? 'text-[#F76B5E]' : 'text-yellow-400'
                      }`} />
                      <span className="font-medium text-white">{anomaly.type.replace('_', ' ')}</span>
                      <Badge className={`text-xs ${
                        anomaly.severity === 'HIGH' ? 'bg-[#F97272]' : 'bg-yellow-600'
                      }`}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{anomaly.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Invoice */}
        {invoiceResult && (
          <Card className="mb-8 bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5 text-[#EFA498]" />
                AI-Generated Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400">Invoice Details</div>
                    <div className="text-white font-mono">{invoiceResult.invoiceNumber}</div>
                    <div className="text-gray-400 text-sm">{invoiceResult.date} • {invoiceResult.time}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Product</div>
                    <div className="text-white">{invoiceResult.product.name}</div>
                    <div className="text-gray-400 text-sm">HSN: {invoiceResult.product.hsn}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Seller</div>
                    <div className="text-white">{invoiceResult.seller.name}</div>
                    <div className="text-gray-400 text-sm">GSTIN: {invoiceResult.seller.gstin}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400">Amount Breakdown</div>
                    <div className="text-white">₹{invoiceResult.amount.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">+ GST: ₹{invoiceResult.gst.toLocaleString()}</div>
                    <div className="text-2xl font-bold text-green-400">₹{invoiceResult.total.toLocaleString()}</div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Processing Time</div>
                      <div className="text-white">{invoiceResult.processingTime}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">AI Confidence</div>
                      <div className="text-white">{invoiceResult.confidence}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={simulateAgenticPurchase}
            disabled={!selectedProduct || !purchaseAmount || !buyerLocation || processing}
            className="bg-gradient-to-r from-[#F97272] to-[#EFA498] hover:from-[#f85c5c] hover:to-[#F97272] text-white px-8 py-4 text-lg font-medium transition-all hover:scale-105 shadow-lg shadow-[#F97272]/30"
          >
            {processing ? (
              <>
                <Brain className="h-5 w-5 mr-2 animate-spin" />
                AI Agent Working...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Activate AI Agent
              </>
            )}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
