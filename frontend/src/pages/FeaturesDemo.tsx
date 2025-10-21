import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Layers, 
  CheckCircle, 
  Tag, 
  FileText, 
  GitCompare,
  Zap,
  Upload,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://fmuvwabtoi.execute-api.ap-south-1.amazonaws.com/prod';

export default function FeaturesDemo() {
  const [activeFeature, setActiveFeature] = useState('bulk');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const features = [
    { id: 'bulk', name: 'Bulk Generation', icon: Layers, color: 'blue' },
    { id: 'validate', name: 'Validation Engine', icon: CheckCircle, color: 'green' },
    { id: 'categorize', name: 'Auto Categorize', icon: Tag, color: 'purple' },
    { id: 'ocr', name: 'OCR Extraction', icon: FileText, color: 'orange' },
    { id: 'reconcile', name: 'Reconciliation', icon: GitCompare, color: 'pink' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Features
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered Invoice Automation at Scale
          </p>
        </div>

        {/* Feature Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => {
                  setActiveFeature(feature.id);
                  setResult(null);
                }}
                className={`p-6 rounded-xl border-2 transition-all ${
                  activeFeature === feature.id
                    ? `border-${feature.color}-500 bg-${feature.color}-50 shadow-lg`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon className={`h-8 w-8 mx-auto mb-2 text-${feature.color}-500`} />
                <div className="font-semibold text-sm">{feature.name}</div>
              </button>
            );
          })}
        </div>

        {/* Feature Content */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          {activeFeature === 'bulk' && <BulkGenerationDemo setLoading={setLoading} setResult={setResult} result={result} loading={loading} />}
          {activeFeature === 'validate' && <ValidationDemo setLoading={setLoading} setResult={setResult} result={result} loading={loading} />}
          {activeFeature === 'categorize' && <CategorizationDemo setLoading={setLoading} setResult={setResult} result={result} loading={loading} />}
          {activeFeature === 'ocr' && <OCRDemo setLoading={setLoading} setResult={setResult} result={result} loading={loading} />}
          {activeFeature === 'reconcile' && <ReconciliationDemo setLoading={setLoading} setResult={setResult} result={result} loading={loading} />}
        </div>
      </div>
    </div>
  );
}

// Feature 1: Bulk Generation
function BulkGenerationDemo({ setLoading, setResult, result, loading }: any) {
  const [orderCount, setOrderCount] = useState(50);

  const generateBulk = async () => {
    setLoading(true);
    setResult(null);

    // Generate sample orders
    const countries = ['DE', 'IN', 'US', 'GB', 'FR'];
    const products = [
      { name: 'SaaS License', price: 100, type: 'digital' },
      { name: 'Consulting', price: 500, type: 'service' },
      { name: 'Software Download', price: 50, type: 'digital' },
    ];

    const orders = Array.from({ length: orderCount }, (_, i) => ({
      orderId: `ORD-${i + 1}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      customerName: `Customer ${i + 1}`,
      product: products[Math.floor(Math.random() * products.length)],
      amount: products[Math.floor(Math.random() * products.length)].price,
      countryData: { format: 'Invoice' },
    }));

    try {
      const response = await fetch(`${API_URL}/features/bulk-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Bulk generation error:', error);
      setResult({ error: 'Failed to generate invoices' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Layers className="h-6 w-6 text-blue-500" />
        Bulk Invoice Generation
      </h2>
      <p className="text-gray-600 mb-6">
        Generate hundreds of invoices in seconds with AI-powered tax calculations
      </p>

      <div className="mb-6">
        <label className="block mb-2 font-semibold">Number of Invoices</label>
        <input
          type="range"
          min="10"
          max="100"
          value={orderCount}
          onChange={(e) => setOrderCount(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="text-center text-2xl font-bold text-blue-600">{orderCount}</div>
      </div>

      <Button 
        onClick={generateBulk} 
        disabled={loading}
        size="lg"
        className="w-full mb-6"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Generating {orderCount} Invoices...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 mr-2" />
            Generate {orderCount} Invoices
          </>
        )}
      </Button>

      {result && result.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{result.stats.total}</div>
              <div className="text-sm text-gray-600">Total Generated</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{result.stats.successful}</div>
              <div className="text-sm text-gray-600">Successful</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{result.stats.processingTime}</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600">{result.stats.avgTimePerInvoice}</div>
              <div className="text-sm text-gray-600">Avg Per Invoice</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Feature 2: Validation
function ValidationDemo({ setLoading, setResult, result, loading }: any) {
  const validateInvoice = async () => {
    setLoading(true);
    
    const sampleInvoice = {
      invoiceNumber: 'INV-2025-001',
      country: 'DE',
      amount: 100,
      taxAmount: 19,
      customerName: 'Acme Corp',
      items: [{ name: 'SaaS License', quantity: 1, price: 100 }],
    };

    try {
      const response = await fetch(`${API_URL}/features/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice: sampleInvoice }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <CheckCircle className="h-6 w-6 text-green-500" />
        Invoice Validation Engine
      </h2>
      <p className="text-gray-600 mb-6">
        AI validates invoices for compliance with local tax laws
      </p>

      <Button onClick={validateInvoice} disabled={loading} size="lg" className="w-full mb-6">
        {loading ? 'Validating...' : 'Validate Sample Invoice'}
      </Button>

      {result && result.validation && (
        <div className="space-y-4">
          <Card className={result.validation.isValid ? 'border-green-500' : 'border-[#FEF5F4]0'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.validation.isValid ? (
                  <><CheckCircle2 className="h-5 w-5 text-green-500" /> Valid</>
                ) : (
                  <><XCircle className="h-5 w-5 text-[#EFA498]" /> Invalid</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-center mb-4">
                {result.validation.complianceScore}%
              </div>
              <div className="text-center text-gray-600">Compliance Score</div>
            </CardContent>
          </Card>

          {result.validation.errors?.length > 0 && (
            <Card className="border-[#FBB5AE] bg-[#FEF5F4]">
              <CardHeader>
                <CardTitle className="text-[#f85c5c]">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.validation.errors.map((error: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-[#EFA498] flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {result.validation.warnings?.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-700">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.validation.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Feature 3: Product Categorization
function CategorizationDemo({ setLoading, setResult, result, loading }: any) {
  const [productName, setProductName] = useState('Annual SaaS Subscription');
  const [productDesc, setProductDesc] = useState('Cloud-based software service with monthly billing');

  const categorize = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/features/categorize-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, productDescription: productDesc }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Categorization error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Tag className="h-6 w-6 text-purple-500" />
        Auto Product Categorization
      </h2>
      <p className="text-gray-600 mb-6">
        AI automatically categorizes products for correct tax treatment
      </p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block mb-2 font-semibold">Product Name</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-2 font-semibold">Description</label>
          <textarea
            value={productDesc}
            onChange={(e) => setProductDesc(e.target.value)}
            className="w-full p-3 border rounded-lg"
            rows={3}
          />
        </div>
      </div>

      <Button onClick={categorize} disabled={loading} size="lg" className="w-full mb-6">
        {loading ? 'Categorizing...' : 'Categorize Product'}
      </Button>

      {result && result.categorization && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Category</div>
                <Badge className="mt-1">{result.categorization.category}</Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tax Treatment</div>
                <Badge className="mt-1">{result.categorization.taxTreatment}</Badge>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-600 mb-2">AI Reasoning</div>
                <p className="text-sm">{result.categorization.reasoning}</p>
              </div>
              <div>
                <div className="text-sm text-gray-600">Confidence</div>
                <div className="text-2xl font-bold">{result.categorization.confidence}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Feature 4: OCR
function OCRDemo({ setLoading, setResult, result, loading }: any) {
  const performOCR = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/features/ocr-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'demo', documentType: 'invoice' }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('OCR error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6 text-orange-500" />
        OCR Invoice Extraction
      </h2>
      <p className="text-gray-600 mb-6">
        Extract structured data from PDF/image invoices using AI + AWS Textract
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6 text-center">
        <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Upload invoice PDF or image</p>
        <Button onClick={performOCR} disabled={loading}>
          {loading ? 'Processing...' : 'Demo OCR Extraction'}
        </Button>
      </div>

      {result && result.ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data ({result.ocrResult.confidence}% confidence)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Invoice Number</div>
                <div className="font-semibold">{result.ocrResult.extractedData.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Date</div>
                <div className="font-semibold">{result.ocrResult.extractedData.date}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Customer</div>
                <div className="font-semibold">{result.ocrResult.extractedData.customerName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total</div>
                <div className="font-semibold">${result.ocrResult.extractedData.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Feature 5: Reconciliation
function ReconciliationDemo({ setLoading, setResult, result, loading }: any) {
  const reconcile = async () => {
    setLoading(true);
    
    const invoices = [
      { id: 'INV-001', amount: 100, customer: 'Acme Corp' },
      { id: 'INV-002', amount: 250, customer: 'Beta Inc' },
      { id: 'INV-003', amount: 500, customer: 'Gamma LLC' },
    ];

    const payments = [
      { id: 'PAY-001', amount: 100, reference: 'Payment for INV-001' },
      { id: 'PAY-002', amount: 245, reference: 'Beta payment' },
      { id: 'PAY-003', amount: 500, reference: 'Gamma' },
    ];

    try {
      const response = await fetch(`${API_URL}/features/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices, payments }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Reconciliation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <GitCompare className="h-6 w-6 text-pink-500" />
        Smart Reconciliation
      </h2>
      <p className="text-gray-600 mb-6">
        AI matches payments to invoices automatically, even with discrepancies
      </p>

      <Button onClick={reconcile} disabled={loading} size="lg" className="w-full mb-6">
        {loading ? 'Reconciling...' : 'Run Reconciliation Demo'}
      </Button>

      {result && result.reconciliation && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{result.reconciliation.matches?.length || 0}</div>
              <div className="text-sm text-gray-600">Matched</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{result.reconciliation.unmatchedInvoices?.length || 0}</div>
              <div className="text-sm text-gray-600">Unmatched Invoices</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">${result.reconciliation.totalReconciled || 0}</div>
              <div className="text-sm text-gray-600">Total Reconciled</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
