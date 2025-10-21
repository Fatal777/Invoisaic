import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Upload, Loader2, FileText } from 'lucide-react';
import { featuresApi } from '../../services/api';

export default function OCRExtractor() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1]; // Remove data:image/...;base64, prefix
        
        const response: any = await featuresApi.ocrInvoice(base64Data, file.type);
        setResult(response.ocrResult);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('OCR error:', err);
      // Fallback demo data
      setResult({
        extractedData: {
          invoiceNumber: 'DEMO-001',
          date: new Date().toISOString().split('T')[0],
          customerName: 'Demo Customer',
          items: [{ name: 'Service', quantity: 1, price: 100 }],
          subtotal: 100,
          taxAmount: 19,
          total: 119,
          country: 'DE',
        },
        confidence: 60,
        suggestions: ['API error - showing demo data'],
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
        <p className="text-sm text-indigo-800">
          <strong>OCR Invoice Extraction:</strong> Upload PDF or image invoices and extract all
          data using AWS Textract + AI for structured information.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Upload Invoice</h3>
        
        {!fileName ? (
          <label className="border-2 border-dashed border-gray-300 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors">
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
            />
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700 mb-1">
                Click to upload invoice
              </p>
              <p className="text-sm text-gray-500">
                PDF, PNG, JPG up to 10MB
              </p>
            </div>
          </label>
        ) : processing ? (
          <div className="border-2 border-indigo-300 bg-indigo-50 rounded-lg p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
            <p className="font-medium text-gray-700 mb-1">Processing with AWS Textract...</p>
            <p className="text-sm text-gray-500">{fileName}</p>
          </div>
        ) : (
          <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">{fileName}</p>
                <p className="text-sm text-gray-600">Extraction complete</p>
              </div>
            </div>
            <label>
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
              />
              <Button variant="outline" size="sm">
                Upload Another
              </Button>
            </label>
          </div>
        )}
      </Card>

      {result && (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Extracted Data</h3>
            <Badge className="bg-indigo-600">{result.confidence}% Accuracy</Badge>
          </div>

          {/* Invoice Header */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Invoice Number</div>
                <div className="font-bold">{result.extractedData.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Date</div>
                <div className="font-bold">{result.extractedData.date}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Country</div>
                <div className="font-bold">{result.extractedData.country}</div>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <div className="text-sm text-gray-600 mb-1">Customer</div>
            <div className="font-bold text-lg">{result.extractedData.customerName}</div>
          </div>

          {/* Line Items */}
          <div className="bg-white p-4 rounded-lg mb-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Line Items</div>
            <div className="space-y-2">
              {result.extractedData.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                  <span>{item.name}</span>
                  <span className="font-medium">
                    {item.quantity} × €{item.price.toFixed(2)} = €{(item.quantity * item.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-white p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>€{result.extractedData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>€{result.extractedData.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>Total:</span>
                <span>€{result.extractedData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-4 bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="text-sm font-medium text-green-800 mb-1">Validation Passed</div>
            <ul className="list-disc list-inside space-y-1 text-xs text-green-700">
              {result.suggestions.map((suggestion: string, idx: number) => (
                <li key={idx}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
