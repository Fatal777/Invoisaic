import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Link2, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { featuresApi } from '../../services/api';

export default function InvoiceReconciler() {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [invoice] = useState({
    id: 'INV-2025-001',
    customer: 'Acme Corp',
    total: 1190.00,
    date: '2025-01-15',
  });

  const [payment, setPayment] = useState({
    id: 'PAY-2025-001',
    amount: 1190.00,
    date: '2025-01-20',
    reference: 'INV-2025-001',
  });

  const reconcile = async () => {
    setProcessing(true);
    
    try {
      const response: any = await featuresApi.reconcileInvoices([invoice], [payment]);
      
      // Extract the first match result
      if (response.reconciliation && response.reconciliation.matches && response.reconciliation.matches.length > 0) {
        setResult(response.reconciliation.matches[0]);
      } else {
        // No match found
        setResult({
          matched: false,
          matchType: 'unclear',
          confidence: 0,
          difference: Math.abs(invoice.total - payment.amount),
          reasoning: 'No matches found by AI',
          suggestions: ['Check payment reference', 'Verify amounts'],
        });
      }
    } catch (err: any) {
      console.error('Reconciliation error:', err);
      // Fallback logic
      const difference = Math.abs(invoice.total - payment.amount);
      setResult({
        matched: difference === 0,
        matchType: difference === 0 ? 'exact' : 'unclear',
        confidence: difference === 0 ? 100 : 50,
        difference,
        reasoning: 'API error - using basic matching',
        suggestions: [],
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
        <p className="text-sm text-orange-800">
          <strong>Smart Reconciliation:</strong> AI matches payments to invoices automatically,
          handling partial payments, bank fees, and currency differences.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Invoice */}
        <Card className="p-6 bg-blue-50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Invoice
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice ID:</span>
              <span className="font-medium">{invoice.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{invoice.customer}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{invoice.date}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Payment */}
        <Card className="p-6 bg-green-50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payment
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID:</span>
              <span className="font-medium">{payment.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <input
                type="text"
                className="font-medium text-right bg-white border border-gray-300 rounded px-2 py-1 w-32"
                value={payment.reference}
                onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">{payment.date}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold">Amount:</span>
              <input
                type="number"
                className="font-bold text-lg text-right bg-white border border-gray-300 rounded px-2 py-1 w-32"
                value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: parseFloat(e.target.value) || 0 })}
                step="0.01"
              />
            </div>
          </div>
        </Card>
      </div>

      <Button
        onClick={reconcile}
        disabled={processing}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            AI is reconciling...
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 mr-2" />
            Reconcile with AI
          </>
        )}
      </Button>

      {result && (
        <Card className={`p-6 border-2 ${result.matched ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              {result.matched ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-yellow-600" />
              )}
              {result.matched ? 'Match Found' : 'Partial/No Match'}
            </h3>
            <Badge className={result.matched ? 'bg-green-600' : 'bg-yellow-600'}>
              {result.confidence}% Confidence
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">Match Type</div>
              <div className="font-bold capitalize">{result.matchType}</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">Difference</div>
              <div className="font-bold">${result.difference.toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">Status</div>
              <div className="font-bold">{result.matched ? 'Reconciled' : 'Review Needed'}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">AI Analysis:</div>
            <p className="text-sm text-gray-600">{result.reasoning}</p>
          </div>

          {result.suggestions.length > 0 && (
            <div className="bg-white p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Suggestions:</div>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                {result.suggestions.map((suggestion: string, idx: number) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
