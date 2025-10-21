import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Trash2, Download, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceData {
  customerName: string;
  customerEmail: string;
  billingAddress: string;
  country: string;
  items: LineItem[];
}

export default function InvoiceBuilder() {
  const [step, setStep] = useState<'customer' | 'items' | 'review' | 'complete'>('customer');
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    customerName: '',
    customerEmail: '',
    billingAddress: '',
    country: 'US',
    items: [],
  });
  const [currentItem, setCurrentItem] = useState<LineItem>({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  const countries = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
  ];

  const taxRates = {
    US: 0.07,
    DE: 0.19,
    IN: 0.18,
    GB: 0.20,
    FR: 0.20,
  };

  const addItem = () => {
    if (currentItem.description && currentItem.unitPrice > 0) {
      setInvoiceData({
        ...invoiceData,
        items: [...invoiceData.items, currentItem],
      });
      setCurrentItem({ description: '', quantity: 1, unitPrice: 0 });
    }
  };

  const removeItem = (index: number) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter((_, i) => i !== index),
    });
  };

  const generateInvoice = () => {
    const subtotal = invoiceData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const taxRates: any = {
      US: 0.07,
      DE: 0.19,
      IN: 0.18,
      GB: 0.20,
      FR: 0.20,
    };

    const taxRate = taxRates[invoiceData.country] || 0.15;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoice = {
      invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString().split('T')[0],
      customer: {
        name: invoiceData.customerName,
        email: invoiceData.customerEmail,
        address: invoiceData.billingAddress,
        country: invoiceData.country,
      },
      items: invoiceData.items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      currency: invoiceData.country === 'IN' ? 'INR' : invoiceData.country === 'GB' ? 'GBP' : invoiceData.country === 'US' ? 'USD' : 'EUR',
    };

    setGeneratedInvoice(invoice);
    setStep('complete');
  };

  const downloadPDF = () => {
    if (!generatedInvoice) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246);
    doc.text('INVOICE', 105, 20, { align: 'center' });
    
    // Invoice details
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice #: ${generatedInvoice.invoiceNumber}`, 20, 40);
    doc.text(`Date: ${generatedInvoice.date}`, 20, 47);
    
    // Customer
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(generatedInvoice.customer.name, 20, 67);
    doc.text(generatedInvoice.customer.email, 20, 74);
    doc.text(generatedInvoice.customer.address, 20, 81);
    
    // Items
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, 100);
    doc.text('Qty', 120, 100);
    doc.text('Price', 145, 100);
    doc.text('Total', 175, 100, { align: 'right' });
    doc.line(20, 103, 190, 103);
    
    doc.setFont('helvetica', 'normal');
    let y = 110;
    generatedInvoice.items.forEach((item: any) => {
      doc.text(item.description, 20, y);
      doc.text(item.quantity.toString(), 120, y);
      doc.text(`${generatedInvoice.currency} ${item.unitPrice.toFixed(2)}`, 145, y);
      doc.text(`${generatedInvoice.currency} ${(item.quantity * item.unitPrice).toFixed(2)}`, 175, y, { align: 'right' });
      y += 7;
    });
    
    // Totals
    doc.line(20, y, 190, y);
    y += 10;
    doc.text('Subtotal:', 120, y);
    doc.text(`${generatedInvoice.currency} ${generatedInvoice.subtotal.toFixed(2)}`, 175, y, { align: 'right' });
    y += 7;
    doc.text(`Tax (${(generatedInvoice.taxRate * 100).toFixed(0)}%):`, 120, y);
    doc.text(`${generatedInvoice.currency} ${generatedInvoice.taxAmount.toFixed(2)}`, 175, y, { align: 'right' });
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 120, y);
    doc.text(`${generatedInvoice.currency} ${generatedInvoice.total.toFixed(2)}`, 175, y, { align: 'right' });
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by Invoisaic AI - Built with Amazon Bedrock', 105, 280, { align: 'center' });
    
    doc.save(`${generatedInvoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {['customer', 'items', 'review', 'complete'].map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : idx < ['customer', 'items', 'review', 'complete'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {idx < ['customer', 'items', 'review', 'complete'].indexOf(step) ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                idx + 1
              )}
            </div>
            {idx < 3 && (
              <div
                className={`w-16 h-1 ${
                  idx < ['customer', 'items', 'review', 'complete'].indexOf(step)
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Customer Details */}
      {step === 'customer' && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Customer Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer Name</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={invoiceData.customerName}
                onChange={(e) =>
                  setInvoiceData({ ...invoiceData, customerName: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={invoiceData.customerEmail}
                onChange={(e) =>
                  setInvoiceData({ ...invoiceData, customerEmail: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Billing Address</label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                value={invoiceData.billingAddress}
                onChange={(e) =>
                  setInvoiceData({ ...invoiceData, billingAddress: e.target.value })
                }
                placeholder="123 Main St, City, State, ZIP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={invoiceData.country}
                onChange={(e) =>
                  setInvoiceData({ ...invoiceData, country: e.target.value })
                }
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => setStep('items')}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!invoiceData.customerName || !invoiceData.customerEmail}
            >
              Continue to Line Items →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Line Items */}
      {step === 'items' && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Line Items</h3>
          
          {/* Added Items */}
          {invoiceData.items.length > 0 && (
            <div className="mb-6 space-y-2">
              {invoiceData.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-gray-600">
                      Qty: {item.quantity} × ${item.unitPrice.toFixed(2)} = $
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-[#F97272]" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Item */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={currentItem.description}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, description: e.target.value })
                }
                placeholder="Service or product description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      quantity: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit Price ($)</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={currentItem.unitPrice}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      unitPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <Button
              onClick={addItem}
              variant="outline"
              className="w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => setStep('customer')} className="flex-1">
              ← Back
            </Button>
            <Button
              onClick={() => setStep('review')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={invoiceData.items.length === 0}
            >
              Review Invoice →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Review & Generate</h3>
          
          {/* Customer Summary */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Customer</h4>
            <div className="text-sm text-gray-600">
              <div>{invoiceData.customerName}</div>
              <div>{invoiceData.customerEmail}</div>
              <div>{invoiceData.billingAddress}</div>
              <div>
                {countries.find((c) => c.code === invoiceData.country)?.flag}{' '}
                {countries.find((c) => c.code === invoiceData.country)?.name}
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Items</h4>
            <div className="space-y-2">
              {invoiceData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.description}</span>
                  <span>
                    {item.quantity} × ${item.unitPrice.toFixed(2)} = $
                    {(item.quantity * item.unitPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>
                $
                {invoiceData.items
                  .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                Tax (
                {(
                  (taxRates[
                    invoiceData.country as keyof typeof taxRates
                  ] || 0.15) * 100
                ).toFixed(0)}
                %):
              </span>
              <span>
                $
                {(
                  invoiceData.items.reduce(
                    (sum, item) => sum + item.quantity * item.unitPrice,
                    0
                  ) *
                  (taxRates[
                    invoiceData.country as keyof typeof taxRates
                  ] || 0.15)
                ).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>
                $
                {(
                  invoiceData.items.reduce(
                    (sum, item) => sum + item.quantity * item.unitPrice,
                    0
                  ) *
                  (1 +
                    (taxRates[
                      invoiceData.country as keyof typeof taxRates
                    ] || 0.15))
                ).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => setStep('items')} className="flex-1">
              ← Back
            </Button>
            <Button
              onClick={generateInvoice}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && generatedInvoice && (
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">
              Invoice Generated Successfully!
            </h3>
            <p className="text-gray-600">
              Invoice #{generatedInvoice.invoiceNumber}
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Customer</div>
                <div className="font-medium">{generatedInvoice.customer.name}</div>
              </div>
              <div>
                <div className="text-gray-600">Date</div>
                <div className="font-medium">{generatedInvoice.date}</div>
              </div>
              <div>
                <div className="text-gray-600">Total Amount</div>
                <div className="font-medium text-lg">
                  {generatedInvoice.currency} {generatedInvoice.total.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Items</div>
                <div className="font-medium">{generatedInvoice.items.length}</div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setStep('customer');
                setInvoiceData({
                  customerName: '',
                  customerEmail: '',
                  billingAddress: '',
                  country: 'US',
                  items: [],
                });
                setGeneratedInvoice(null);
              }}
              className="flex-1"
            >
              Create Another Invoice
            </Button>
            <Button
              onClick={downloadPDF}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
