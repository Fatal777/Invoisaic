import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Navbar from '@/components/Navbar';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  taxAmount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
  country: string;
  aiConfidence?: number;
  fraudScore?: number;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus]);

  const fetchInvoices = async () => {
    // TODO: Replace with real API call
    setTimeout(() => {
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoiceNumber: 'INV-2024-001',
          customerName: 'TechCorp Solutions',
          customerEmail: 'billing@techcorp.com',
          amount: 50000,
          taxAmount: 9000,
          total: 59000,
          currency: 'INR',
          status: 'paid',
          dueDate: '2024-01-15',
          createdAt: '2024-01-01',
          country: 'India',
          aiConfidence: 98,
          fraudScore: 5,
        },
        {
          id: '2',
          invoiceNumber: 'INV-2024-002',
          customerName: 'GlobalTech GmbH',
          customerEmail: 'finance@globaltech.de',
          amount: 12500,
          taxAmount: 2375,
          total: 14875,
          currency: 'EUR',
          status: 'sent',
          dueDate: '2024-02-01',
          createdAt: '2024-01-15',
          country: 'Germany',
          aiConfidence: 95,
          fraudScore: 8,
        },
        {
          id: '3',
          invoiceNumber: 'INV-2024-003',
          customerName: 'InnovateCorp',
          customerEmail: 'ap@innovatecorp.com',
          amount: 8500,
          taxAmount: 680,
          total: 9180,
          currency: 'USD',
          status: 'overdue',
          dueDate: '2024-01-20',
          createdAt: '2024-01-05',
          country: 'USA',
          aiConfidence: 92,
          fraudScore: 15,
        },
        {
          id: '4',
          invoiceNumber: 'INV-2024-004',
          customerName: 'London Finance Ltd',
          customerEmail: 'accounts@londonfinance.co.uk',
          amount: 15000,
          taxAmount: 3000,
          total: 18000,
          currency: 'GBP',
          status: 'viewed',
          dueDate: '2024-02-10',
          createdAt: '2024-01-25',
          country: 'UK',
          aiConfidence: 97,
          fraudScore: 3,
        },
        {
          id: '5',
          invoiceNumber: 'INV-2024-005',
          customerName: 'Mumbai Startups Pvt Ltd',
          customerEmail: 'billing@mumbaistartups.in',
          amount: 25000,
          taxAmount: 4500,
          total: 29500,
          currency: 'INR',
          status: 'draft',
          dueDate: '2024-02-15',
          createdAt: '2024-01-28',
          country: 'India',
          aiConfidence: 88,
          fraudScore: 12,
        },
      ];

      setInvoices(mockInvoices);
      setLoading(false);
    }, 1000);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      draft: { color: 'bg-gray-500/20 text-gray-400', icon: FileText },
      sent: { color: 'bg-blue-500/20 text-blue-400', icon: Send },
      viewed: { color: 'bg-purple-500/20 text-purple-400', icon: Eye },
      paid: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      overdue: { color: 'bg-[#EFA498]/20 text-[#F76B5E]', icon: AlertCircle },
    };
    return configs[status as keyof typeof configs] || configs.draft;
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || invoice.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Invoices
            </h1>
            <p className="text-gray-400">
              Manage all your invoices with AI-powered automation
            </p>
          </div>

          <Link to="/invoices/new">
            <Button className="bg-gradient-to-r from-[#F97272] to-[#EFA498] hover:from-[#f85c5c] hover:to-[#F97272]">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'all' ? 'border-[#FEF5F4]0' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('all')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'draft' ? 'border-gray-500' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('draft')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.draft}</div>
              <div className="text-xs text-gray-400">Draft</div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'sent' ? 'border-blue-500' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('sent')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.sent}</div>
              <div className="text-xs text-gray-400">Sent</div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'paid' ? 'border-green-500' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('paid')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.paid}</div>
              <div className="text-xs text-gray-400">Paid</div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'overdue' ? 'border-[#FEF5F4]0' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('overdue')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.overdue}</div>
              <div className="text-xs text-gray-400">Overdue</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices by number, customer, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FEF5F4]0"></div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No invoices found</p>
                <p className="text-sm text-gray-500">Create your first invoice to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        AI Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredInvoices.map((invoice) => {
                      const statusConfig = getStatusConfig(invoice.status);
                      const StatusIcon = statusConfig.icon;

                      return (
                        <tr 
                          key={invoice.id}
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FEF5F4]0 to-[#F97272] flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {invoice.invoiceNumber}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {invoice.country}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-white">{invoice.customerName}</div>
                            <div className="text-xs text-gray-400">{invoice.customerEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-white">
                              {invoice.currency} {invoice.total.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">
                              Tax: {invoice.currency} {invoice.taxAmount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${statusConfig.color} flex items-center gap-1.5 w-fit`}>
                              <StatusIcon className="h-3 w-3" />
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-400">Confidence:</div>
                                <div className="text-xs font-semibold text-green-400">
                                  {invoice.aiConfidence}%
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-gray-400">Fraud:</div>
                                <div className={`text-xs font-semibold ${
                                  invoice.fraudScore! > 10 ? 'text-[#F76B5E]' : 'text-green-400'
                                }`}>
                                  {invoice.fraudScore}%
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-white">{invoice.dueDate}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white hover:bg-white/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // View invoice
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white hover:bg-white/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit invoice
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white hover:bg-white/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // More options
                                }}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
