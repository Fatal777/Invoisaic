import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Send, CheckCircle, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { invoiceApi } from '@/services/api';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response: any = await invoiceApi.getInvoice(id!);
      setInvoice(response.data || response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-500',
      sent: 'bg-blue-500',
      paid: 'bg-green-500',
      overdue: 'bg-[#EFA498]',
      cancelled: 'bg-gray-400',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-[#EFA498] mx-auto mb-4" />
        <p className="text-gray-600">{error || 'Invoice not found'}</p>
        <Button onClick={() => navigate('/invoices')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            <p className="text-gray-600">Created {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {invoice.status === 'draft' && (
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Invoice Info */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{invoice.customerName}</p>
                  <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Issue Date</p>
                  <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems?.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right">${item.unitPrice}</td>
                      <td className="text-right">${item.amount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={3} className="text-right py-2 font-medium">Subtotal:</td>
                    <td className="text-right py-2">${invoice.subtotal}</td>
                  </tr>
                  <tr className="font-bold text-lg">
                    <td colSpan={3} className="text-right py-2">Total:</td>
                    <td className="text-right py-2">${invoice.totalAmount} {invoice.currency}</td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Sidebar */}
        <div className="space-y-6">
          {/* AI Processing Summary */}
          {invoice.agentProcessing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Supervisor Decision */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Supervisor Decision</p>
                  <Badge className={invoice.agentProcessing.supervisorDecision === 'approved' ? 'bg-green-500' : 'bg-yellow-500'}>
                    {invoice.agentProcessing.supervisorDecision}
                  </Badge>
                </div>

                <Separator />

                {/* Compliance Check */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Compliance Status
                  </p>
                  {invoice.agentProcessing.complianceCheck?.isCompliant ? (
                    <p className="text-sm text-green-600">✓ Compliant</p>
                  ) : (
                    <p className="text-sm text-[#F97272]">✗ Needs Review</p>
                  )}
                </div>

                <Separator />

                {/* Customer Insights */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Payment Prediction
                  </p>
                  <p className="text-sm text-gray-700">
                    Reliability: {invoice.agentProcessing.customerInsights?.paymentReliability || 0}%
                  </p>
                  {invoice.agentProcessing.customerInsights?.averagePaymentDelay > 0 && (
                    <p className="text-sm text-yellow-600">
                      Avg. Delay: {invoice.agentProcessing.customerInsights.averagePaymentDelay} days
                    </p>
                  )}
                </div>

                <Separator />

                {/* Processing Time */}
                <div>
                  <p className="text-sm text-gray-600">Processing Time</p>
                  <p className="text-xs text-gray-500">
                    {(invoice.agentProcessing.processingTime / 1000).toFixed(2)}s
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence: {(invoice.agentProcessing.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Recommendations */}
          {invoice.aiRecommendations && invoice.aiRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {invoice.aiRecommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
