import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Network
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Navbar from '@/components/Navbar';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  taxId: string;
  totalInvoices: number;
  totalAmount: number;
  avgPaymentDays: number;
  status: 'verified' | 'pending' | 'flagged';
  riskScore: number;
  relationshipScore: number;
  lastInvoice: string;
  connectedVendors?: string[];
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [filterStatus]);

  const fetchVendors = async () => {
    // TODO: Replace with real API call
    setTimeout(() => {
      const mockVendors: Vendor[] = [
        {
          id: '1',
          name: 'TechSupplies Inc',
          email: 'billing@techsupplies.com',
          phone: '+1-555-0123',
          address: '123 Tech Street, San Francisco, CA 94105',
          country: 'USA',
          taxId: 'EIN-12-3456789',
          totalInvoices: 45,
          totalAmount: 125000,
          avgPaymentDays: 18,
          status: 'verified',
          riskScore: 5,
          relationshipScore: 95,
          lastInvoice: '2024-01-28',
          connectedVendors: ['2', '4'],
        },
        {
          id: '2',
          name: 'GlobalTech GmbH',
          email: 'accounts@globaltech.de',
          phone: '+49-30-12345678',
          address: 'Alexanderplatz 1, 10178 Berlin, Germany',
          country: 'Germany',
          taxId: 'DE123456789',
          totalInvoices: 32,
          totalAmount: 89000,
          avgPaymentDays: 25,
          status: 'verified',
          riskScore: 8,
          relationshipScore: 88,
          lastInvoice: '2024-01-25',
          connectedVendors: ['1'],
        },
        {
          id: '3',
          name: 'Mumbai Services Pvt Ltd',
          email: 'vendor@mumbaiservices.in',
          phone: '+91-22-12345678',
          address: 'Bandra West, Mumbai, Maharashtra 400050',
          country: 'India',
          taxId: 'GSTIN-29ABCDE1234F1Z5',
          totalInvoices: 28,
          totalAmount: 67000,
          avgPaymentDays: 32,
          status: 'pending',
          riskScore: 15,
          relationshipScore: 75,
          lastInvoice: '2024-01-20',
          connectedVendors: [],
        },
        {
          id: '4',
          name: 'London Supplies Ltd',
          email: 'sales@londonsupplies.co.uk',
          phone: '+44-20-12345678',
          address: '25 Canary Wharf, London E14 5AB',
          country: 'UK',
          taxId: 'VAT-GB123456789',
          totalInvoices: 19,
          totalAmount: 54000,
          avgPaymentDays: 21,
          status: 'verified',
          riskScore: 6,
          relationshipScore: 91,
          lastInvoice: '2024-01-22',
          connectedVendors: ['1'],
        },
        {
          id: '5',
          name: 'Suspicious Vendor LLC',
          email: 'contact@suspicious.com',
          phone: '+1-555-9999',
          address: 'Unknown Address',
          country: 'USA',
          taxId: 'N/A',
          totalInvoices: 3,
          totalAmount: 15000,
          avgPaymentDays: 45,
          status: 'flagged',
          riskScore: 85,
          relationshipScore: 25,
          lastInvoice: '2024-01-15',
          connectedVendors: [],
        },
      ];

      setVendors(mockVendors);
      setLoading(false);
    }, 1000);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      verified: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle },
      flagged: { color: 'bg-[#EFA498]/20 text-[#F76B5E]', icon: AlertTriangle },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.taxId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || vendor.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: vendors.length,
    verified: vendors.filter(v => v.status === 'verified').length,
    pending: vendors.filter(v => v.status === 'pending').length,
    flagged: vendors.filter(v => v.status === 'flagged').length,
    totalSpend: vendors.reduce((sum, v) => sum + v.totalAmount, 0),
    avgRisk: Math.round(vendors.reduce((sum, v) => sum + v.riskScore, 0) / vendors.length),
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Vendor Management
            </h1>
            <p className="text-gray-400">
              AI-powered vendor intelligence with relationship graph
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="border-white/10 text-white hover:bg-white/10"
              onClick={() => setShowGraph(!showGraph)}
            >
              <Network className="h-4 w-4 mr-2" />
              {showGraph ? 'Hide' : 'Show'} Graph
            </Button>
            <Link to="/vendors/new">
              <Button className="bg-gradient-to-r from-[#F97272] to-[#EFA498] hover:from-[#f85c5c] hover:to-[#F97272]">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'all' ? 'border-[#FEF5F4]0' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('all')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
              <div className="text-xs text-gray-400">Total Vendors</div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'verified' ? 'border-green-500' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('verified')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.verified}</div>
              <div className="text-xs text-gray-400">Verified</div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'pending' ? 'border-yellow-500' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('pending')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.pending}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-white/5 backdrop-blur-xl border transition-all cursor-pointer ${
              filterStatus === 'flagged' ? 'border-[#FEF5F4]0' : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setFilterStatus('flagged')}
          >
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">{stats.flagged}</div>
              <div className="text-xs text-gray-400">Flagged</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white mb-1">₹{(stats.totalSpend / 1000).toFixed(0)}K</div>
              <div className="text-xs text-gray-400">Total Spend</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold mb-1 ${
                stats.avgRisk < 20 ? 'text-green-400' : stats.avgRisk < 50 ? 'text-yellow-400' : 'text-[#F76B5E]'
              }`}>
                {stats.avgRisk}%
              </div>
              <div className="text-xs text-gray-400">Avg Risk</div>
            </CardContent>
          </Card>
        </div>

        {/* Network Graph Visualization */}
        {showGraph && (
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Network className="h-5 w-5 text-[#EFA498]" />
                Vendor Relationship Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/30 rounded-xl p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Network className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">Neptune Graph Database</p>
                  <p className="text-sm text-gray-500">Interactive vendor relationship visualization</p>
                  <p className="text-xs text-gray-600 mt-2">
                    Shows connections, shared invoices, and fraud patterns
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name, email, or tax ID..."
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendor List */}
        <div className="grid md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FEF5F4]0"></div>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No vendors found</p>
              <p className="text-sm text-gray-500">Add your first vendor to get started</p>
            </div>
          ) : (
            filteredVendors.map((vendor) => {
              const statusConfig = getStatusConfig(vendor.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card 
                  key={vendor.id}
                  className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all cursor-pointer"
                  onClick={() => setSelectedVendor(vendor)}
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FEF5F4]0 to-[#F97272] flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{vendor.name}</h3>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {vendor.status}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Mail className="h-4 w-4" />
                        <span>{vendor.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Phone className="h-4 w-4" />
                        <span>{vendor.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{vendor.address}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-black/30 rounded-lg mb-4">
                      <div>
                        <div className="text-xs text-gray-400">Total Invoices</div>
                        <div className="text-lg font-semibold text-white">{vendor.totalInvoices}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Total Amount</div>
                        <div className="text-lg font-semibold text-white">₹{(vendor.totalAmount / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Avg Payment</div>
                        <div className="text-lg font-semibold text-white">{vendor.avgPaymentDays}d</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Last Invoice</div>
                        <div className="text-sm font-semibold text-white">{vendor.lastInvoice}</div>
                      </div>
                    </div>

                    {/* AI Scores */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Risk Score</span>
                        <span className={`text-xs font-semibold ${
                          vendor.riskScore < 20 ? 'text-green-400' :
                          vendor.riskScore < 50 ? 'text-yellow-400' : 'text-[#F76B5E]'
                        }`}>
                          {vendor.riskScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            vendor.riskScore < 20 ? 'bg-green-500' :
                            vendor.riskScore < 50 ? 'bg-yellow-500' : 'bg-[#EFA498]'
                          }`}
                          style={{ width: `${vendor.riskScore}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400">Relationship Score</span>
                        <span className="text-xs font-semibold text-green-400">
                          {vendor.relationshipScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${vendor.relationshipScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                      <Button size="sm" variant="ghost" className="flex-1 text-gray-400 hover:text-white hover:bg-white/10">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 text-gray-400 hover:text-white hover:bg-white/10">
                        <FileText className="h-4 w-4 mr-2" />
                        Invoices
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
