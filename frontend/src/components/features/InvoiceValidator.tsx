import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { featuresApi } from '../../services/api';

export default function InvoiceValidator() {
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: 'INV-2025-001',
    country: 'DE',
    amount: 1000,
    taxAmount: 190,
    customerName: 'Demo Customer',
    hasVatId: true,
  });

  const validateInvoice = async () => {
    setValidating(true);
    setError('');
    
    try {
      const response: any = await featuresApi.validateInvoice({
        ...invoiceData,
        date: new Date().toISOString().split('T')[0],
      });
      
      setValidation(response.validation);
    } catch (err: any) {
      setError(err.message || 'Failed to validate invoice');
      console.error('Validation error:', err);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <strong>AI Validation Engine:</strong> Checks invoices for compliance with local tax laws,
          validates calculations, and ensures all required fields are present.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Invoice to Validate</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Invoice Number</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={invoiceData.invoiceNumber}
              onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Country</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={invoiceData.country}
              onChange={(e) => setInvoiceData({ ...invoiceData, country: e.target.value })}
            >
              <option value="DE">🇩🇪 Germany</option>
              <option value="IN">🇮🇳 India</option>
              <option value="US">🇺🇸 USA</option>
              <option value="GB">🇬🇧 UK</option>
              <option value="FR">🇫🇷 France</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount (€)</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={invoiceData.amount}
              onChange={(e) => setInvoiceData({ ...invoiceData, amount: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tax Amount (€)</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={invoiceData.taxAmount}
              onChange={(e) => setInvoiceData({ ...invoiceData, taxAmount: parseFloat(e.target.value) })}
            />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={invoiceData.hasVatId}
                onChange={(e) => setInvoiceData({ ...invoiceData, hasVatId: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Includes VAT ID (Required for DE/EU)</span>
            </label>
          </div>
        </div>
        
        <Button
          onClick={validateInvoice}
          disabled={validating}
          className="w-full mt-6 bg-green-600 hover:bg-green-700"
        >
          {validating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Validating with AI...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate Invoice
            </>
          )}
        </Button>
      </Card>

      {validation && (
        <Card className={`p-6 border-2 ${validation.isValid ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Validation Results</h3>
            <Badge className={validation.isValid ? 'bg-green-600' : 'bg-orange-600'}>
              {validation.complianceScore}% Compliant
            </Badge>
          </div>

          {/* Checks */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(validation.details).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                {value === 'pass' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-[#F97272]" />
                )}
                <span className="text-sm">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            ))}
          </div>

          {/* Errors */}
          {validation.errors.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-[#F97272] mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Errors
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validation.errors.map((error: string, idx: number) => (
                  <li key={idx} className="text-[#f85c5c]">{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-orange-600 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validation.warnings.map((warning: string, idx: number) => (
                  <li key={idx} className="text-orange-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {validation.suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Suggestions</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validation.suggestions.map((suggestion: string, idx: number) => (
                  <li key={idx} className="text-blue-700">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
