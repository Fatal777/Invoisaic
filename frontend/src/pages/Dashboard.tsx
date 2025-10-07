import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  FileText,
  AlertCircle,
  Clock,
  Users,
  Activity,
  Search,
  Bell,
  Filter,
  Download,
  Plus,
  ArrowRight,
  Shield,
  Zap,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Navbar from '@/components/Navbar';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    revenueChange: 0,
    invoiceCount: 0,
    invoiceChange: 0,
    outstanding: 0,
    outstandingChange: 0,
    avgPaymentTime: 0,
    paymentTimeChange: 0,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    // TODO: Replace with real API call
    setTimeout(() => {
      setMetrics({
        totalRevenue: 245680,
        revenueChange: 12.5,
        invoiceCount: 134,
        invoiceChange: 8.3,
        outstanding: 45200,
        outstandingChange: -15.2,
        avgPaymentTime: 24,
        paymentTimeChange: -18.5,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'invoice_created',
          title: 'Invoice #INV-2024-156 created',
          customer: 'TechCorp Solutions',
          amount: 5400,
          time: '5 minutes ago',
          status: 'pending',
        },
        {
          id: '2',
          type: 'payment_received',
          title: 'Payment received',
          customer: 'GlobalTech Inc',
          amount: 12500,
          time: '2 hours ago',
          status: 'paid',
        },
        {
          id: '3',
          type: 'fraud_alert',
          title: 'Fraud alert: Duplicate invoice detected',
          customer: 'Unknown Vendor',
          amount: 8900,
          time: '4 hours ago',
          status: 'alert',
        },
      ]);

      setAiInsights([
        {
          type: 'prediction',
          icon: Brain,
          title: 'Payment Prediction',
          message: '3 invoices likely to be paid late this week',
          action: 'Send reminders',
          severity: 'warning',
        },
        {
          type: 'optimization',
          icon: Zap,
          title: 'Tax Optimization',
          message: 'Save ₹12,000 by switching to quarterly GST filing',
          action: 'View details',
          severity: 'info',
        },
        {
          type: 'fraud',
          icon: Shield,
          title: 'Fraud Prevention',
          message: '2 suspicious transactions detected',
          action: 'Review now',
          severity: 'error',
        },
      ]);

      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Dashboard
            </h1>
            <p className="text-gray-400">
              Welcome back! Here's what's happening with your invoices.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link to="/invoices/new">
              <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Insights Banner */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {aiInsights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <Card 
                key={idx}
                className={`bg-gradient-to-br backdrop-blur-xl border ${
                  insight.severity === 'error' ? 'from-red-500/20 to-red-600/20 border-red-500/50' :
                  insight.severity === 'warning' ? 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/50' :
                  'from-blue-500/20 to-blue-600/20 border-blue-500/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      insight.severity === 'error' ? 'bg-red-500/20' :
                      insight.severity === 'warning' ? 'bg-yellow-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-white">{insight.title}</h3>
                        <Badge className="text-xs bg-white/10">AI</Badge>
                      </div>
                      <p className="text-xs text-gray-300 mb-2">{insight.message}</p>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs text-white hover:bg-white/10 p-0 h-auto"
                      >
                        {insight.action} <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                ₹{metrics.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center text-xs">
                {metrics.revenueChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">+{metrics.revenueChange}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{metrics.revenueChange}%</span>
                  </>
                )}
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Count */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Invoices
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics.invoiceCount}
              </div>
              <div className="flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">+{metrics.invoiceChange}%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Amount */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Outstanding
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                ₹{metrics.outstanding.toLocaleString()}
              </div>
              <div className="flex items-center text-xs">
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">{metrics.outstandingChange}%</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Avg Payment Time */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Avg Payment Time
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-1">
                {metrics.avgPaymentTime} days
              </div>
              <div className="flex items-center text-xs">
                <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-500">{metrics.paymentTimeChange}%</span>
                <span className="text-gray-500 ml-1">faster</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-500" />
                    Recent Activity
                  </CardTitle>
                  <Link to="/invoices">
                    <Button variant="ghost" className="text-sm text-gray-400 hover:text-white">
                      View all <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'paid' ? 'bg-green-500' :
                        activity.status === 'alert' ? 'bg-red-500 animate-pulse' :
                        'bg-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {activity.title}
                          </h4>
                          <Badge className={`text-xs ${
                            activity.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                            activity.status === 'alert' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{activity.customer}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white">
                            ₹{activity.amount.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/invoices/new">
                  <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-white/10">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </Link>
                <Link to="/customers/new">
                  <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-white/10">
                    <Users className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </Link>
                <Link to="/search">
                  <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-white/10">
                    <Search className="h-4 w-4 mr-2" />
                    Search Everything
                  </Button>
                </Link>
                <Link to="/analytics">
                  <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white border-white/10">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">AI Agent</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Fraud Detection</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                    Monitoring
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Compliance</span>
                  <Badge className="bg-green-500/20 text-green-400 text-xs">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                    Up to date
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Processing Speed</span>
                  <span className="text-xs font-semibold text-white">124ms avg</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
