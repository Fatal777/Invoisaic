import { useState, useEffect } from 'react';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Download,
  Filter,
  Brain,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  PieChart,
  LineChart as LineChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Navbar from '@/components/Navbar';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('6m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    // TODO: Replace with real API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Mock data
  const revenueData = [
    { month: 'Jul', revenue: 45000, predicted: 45000, invoices: 32 },
    { month: 'Aug', revenue: 52000, predicted: 52000, invoices: 38 },
    { month: 'Sep', revenue: 48000, predicted: 48000, invoices: 35 },
    { month: 'Oct', revenue: 61000, predicted: 61000, invoices: 42 },
    { month: 'Nov', revenue: 69000, predicted: 69000, invoices: 48 },
    { month: 'Dec', revenue: 75000, predicted: 75000, invoices: 52 },
    { month: 'Jan', revenue: null, predicted: 82000, invoices: null },
    { month: 'Feb', revenue: null, predicted: 89000, invoices: null },
  ];

  const paymentTrendsData = [
    { status: 'Paid on Time', value: 65, color: '#10B981' },
    { status: 'Paid Late', value: 25, color: '#F59E0B' },
    { status: 'Overdue', value: 10, color: '#EF4444' },
  ];

  const customerDistribution = [
    { country: 'USA', customers: 45, revenue: 125000 },
    { country: 'India', customers: 38, revenue: 98000 },
    { country: 'Germany', customers: 32, revenue: 87000 },
    { country: 'UK', customers: 28, revenue: 76000 },
    { country: 'Others', customers: 42, revenue: 54000 },
  ];

  const aiPredictions = [
    {
      icon: Brain,
      title: 'Revenue Forecast',
      prediction: '₹82K expected in Jan',
      confidence: 94,
      trend: 'up',
      change: '+9.3%',
      color: 'green',
    },
    {
      icon: Clock,
      title: 'Payment Delays',
      prediction: '5 invoices likely late',
      confidence: 87,
      trend: 'warning',
      change: '+2 from avg',
      color: 'yellow',
    },
    {
      icon: Users,
      title: 'Churn Risk',
      prediction: '3 customers at risk',
      confidence: 91,
      trend: 'down',
      change: 'High priority',
      color: 'red',
    },
    {
      icon: Target,
      title: 'Collection Rate',
      prediction: '92% this month',
      confidence: 96,
      trend: 'up',
      change: '+4% vs goal',
      color: 'green',
    },
  ];

  const topCustomers = [
    { name: 'TechCorp Solutions', revenue: 125000, invoices: 45, change: 12.5 },
    { name: 'GlobalTech GmbH', revenue: 89000, invoices: 32, change: 8.3 },
    { name: 'InnovateCorp', revenue: 67000, invoices: 28, change: -5.2 },
    { name: 'London Finance Ltd', revenue: 54000, invoices: 19, change: 15.7 },
    { name: 'Mumbai Startups', revenue: 42000, invoices: 15, change: 22.1 },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Analytics & Insights
            </h1>
            <p className="text-gray-400">
              AI-powered predictive analytics and business intelligence
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
              {['1m', '3m', '6m', '1y', 'all'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeRange === range
                      ? 'bg-[#EFA498] text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* AI Predictions Banner */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {aiPredictions.map((prediction, idx) => {
            const Icon = prediction.icon;
            return (
              <Card 
                key={idx}
                className={`bg-gradient-to-br backdrop-blur-xl border ${
                  prediction.color === 'green' ? 'from-green-500/20 to-green-600/20 border-green-500/50' :
                  prediction.color === 'yellow' ? 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50' :
                  'from-[#FEF5F4]0/20 to-[#F97272]/20 border-[#FEF5F4]0/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      prediction.color === 'green' ? 'bg-green-500/20' :
                      prediction.color === 'yellow' ? 'bg-yellow-500/20' :
                      'bg-[#EFA498]/20'
                    }`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">{prediction.title}</div>
                      <div className="text-sm font-semibold text-white mb-1">
                        {prediction.prediction}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {prediction.confidence}% confidence
                        </span>
                        <span className={`text-xs font-semibold ${
                          prediction.color === 'green' ? 'text-green-400' :
                          prediction.color === 'yellow' ? 'text-yellow-400' :
                          'text-[#F76B5E]'
                        }`}>
                          {prediction.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Revenue Forecast Chart */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <LineChartIcon className="h-5 w-5 text-[#EFA498]" />
                Revenue Forecast
              </CardTitle>
              <Badge className="bg-blue-500/20 text-blue-400">
                <Brain className="h-3 w-3 mr-1" />
                AI Predicted
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#EF4444" 
                  fill="url(#revenueGradient)"
                  name="Actual Revenue"
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#60A5FA" 
                  strokeDasharray="5 5"
                  fill="url(#predictedGradient)"
                  name="Predicted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Payment Trends */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#EFA498]" />
                Payment Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={paymentTrendsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentTrendsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Distribution */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#EFA498]" />
                Customer Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={customerDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="country" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="customers" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Customers */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-[#EFA498]" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FEF5F4]0 to-[#F97272] flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{customer.name}</div>
                      <div className="text-xs text-gray-400">{customer.invoices} invoices</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      ₹{(customer.revenue / 1000).toFixed(0)}K
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${
                      customer.change > 0 ? 'text-green-400' : 'text-[#F76B5E]'
                    }`}>
                      {customer.change > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(customer.change)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
