import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { apiClient } from '@/services/api';

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await apiClient.get<any>('/invoices', params);
      setInvoices(response.items || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    searchTerm === '' ||
    invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">Manage and track all your invoices</p>
        </div>
        <Link to="/invoices/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No invoices found. Click "Create Invoice" to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Invoice #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Issue Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice: any) => (
                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link to={`/invoices/${invoice.id}`} className="text-primary hover:underline font-medium">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-4">{invoice.customerName}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(invoice.issueDate)}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDate(invoice.dueDate)}</td>
                  <td className="py-3 px-4 font-semibold">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
