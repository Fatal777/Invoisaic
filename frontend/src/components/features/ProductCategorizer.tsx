import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Brain, Loader2, Tag } from 'lucide-react';
import { featuresApi } from '../../services/api';

export default function ProductCategorizer() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [productName, setProductName] = useState('Cloud Storage Subscription');
  const [productDescription, setProductDescription] = useState('Monthly subscription for 1TB cloud storage service');

  const categorize = async () => {
    setProcessing(true);
    
    try {
      const response: any = await featuresApi.categorizeProduct(productName, productDescription);
      setResult(response.categorization);
    } catch (err: any) {
      console.error('Categorization error:', err);
      // Fallback to default on error
      setResult({
        category: 'digital_service',
        taxTreatment: 'standard',
        hsn_sac_code: '998314',
        reasoning: 'Error connecting to AI - using default categorization',
        confidence: 60,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
        <p className="text-sm text-purple-800">
          <strong>AI Product Categorizer:</strong> Automatically categorizes products for correct tax treatment,
          assigns HSN/SAC codes for India, and determines applicable tax rates.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Product Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Cloud Storage Subscription"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Product Description</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg"
              rows={4}
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Detailed description of the product or service..."
            />
          </div>
        </div>
        
        <Button
          onClick={categorize}
          disabled={processing}
          className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI is analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Categorize with AI
            </>
          )}
        </Button>
      </Card>

      {result && (
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Categorization Result</h3>
            <Badge className="bg-purple-600">{result.confidence}% Confident</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Category</div>
              <div className="font-bold text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-600" />
                {result.category.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Tax Treatment</div>
              <div className="font-bold text-lg capitalize">{result.taxTreatment}</div>
            </div>
            <div className="bg-white p-4 rounded-lg col-span-2">
              <div className="text-sm text-gray-600 mb-1">HSN/SAC Code (India)</div>
              <div className="font-bold text-lg">{result.hsn_sac_code}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">AI Reasoning:</div>
            <p className="text-sm text-gray-600 italic">{result.reasoning}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-center">
            <div className="bg-white p-2 rounded">
              <div className="font-semibold">Germany</div>
              <div className="text-gray-600">19% VAT</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="font-semibold">India</div>
              <div className="text-gray-600">18% GST</div>
            </div>
            <div className="bg-white p-2 rounded">
              <div className="font-semibold">USA</div>
              <div className="text-gray-600">Varies by state</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
