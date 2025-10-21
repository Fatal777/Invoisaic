import { useState } from 'react';
import { 
  Settings as SettingsIcon,
  Bell,
  Shield,
  Zap,
  Users,
  CreditCard,
  Workflow,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Navbar from '@/components/Navbar';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    companyName: 'Invoisaic Inc',
    email: 'admin@invoisaic.com',
    country: 'India',
    currency: 'INR',
    taxId: 'GSTIN-29ABCDE1234F1Z5',
    autoApprove: false,
    emailNotifications: true,
    slackNotifications: false,
    fraudAlerts: true,
    paymentReminders: true,
    aiAssistance: true,
    autoTaxCalculation: true,
    multiCurrency: true,
  });

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const workflows = [
    {
      name: 'Invoice Approval',
      description: 'Automatic approval for invoices under ₹10,000',
      enabled: true,
      trigger: 'Invoice Created',
      condition: 'Amount < ₹10,000',
      action: 'Auto Approve',
    },
    {
      name: 'Fraud Detection',
      description: 'Flag invoices with suspicious patterns',
      enabled: true,
      trigger: 'Invoice Created',
      condition: 'Risk Score > 70%',
      action: 'Send Alert + Hold',
    },
    {
      name: 'Payment Reminder',
      description: 'Send reminders 3 days before due date',
      enabled: true,
      trigger: '3 Days Before Due',
      condition: 'Status = Unpaid',
      action: 'Email Customer',
    },
    {
      name: 'Late Payment Alert',
      description: 'Alert team when payment is overdue',
      enabled: true,
      trigger: 'Due Date Passed',
      condition: 'Status = Unpaid',
      action: 'Slack Alert',
    },
  ];

  const integrations = [
    {
      name: 'Stripe',
      description: 'Payment processing and webhooks',
      icon: '💳',
      connected: true,
      category: 'Payments',
    },
    {
      name: 'QuickBooks',
      description: 'Accounting software sync',
      icon: '📊',
      connected: false,
      category: 'Accounting',
    },
    {
      name: 'Slack',
      description: 'Team notifications and alerts',
      icon: '💬',
      connected: true,
      category: 'Communication',
    },
    {
      name: 'Salesforce',
      description: 'CRM integration',
      icon: '🎯',
      connected: false,
      category: 'CRM',
    },
    {
      name: 'Zapier',
      description: 'Connect to 3,000+ apps',
      icon: '⚡',
      connected: false,
      category: 'Automation',
    },
    {
      name: 'AWS S3',
      description: 'Document storage',
      icon: '☁️',
      connected: true,
      category: 'Storage',
    },
  ];

  const complianceSettings = [
    {
      country: 'India',
      enabled: true,
      rules: ['GST 18%', 'E-Invoicing', 'HSN Codes'],
      status: 'Active',
    },
    {
      country: 'Germany',
      enabled: true,
      rules: ['VAT 19%', '§14 UStG', 'Reverse Charge'],
      status: 'Active',
    },
    {
      country: 'USA',
      enabled: true,
      rules: ['Sales Tax', 'State Nexus', 'SaaS Rules'],
      status: 'Active',
    },
    {
      country: 'UK',
      enabled: false,
      rules: ['VAT 20%', 'MTD', 'CIS'],
      status: 'Inactive',
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-400">
            Configure your workspace, workflows, and integrations
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10 sticky top-4">
              <CardContent className="p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          activeTab === tab.id
                            ? 'bg-[#EFA498] text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <>
                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tax ID
                        </label>
                        <input
                          type="text"
                          value={settings.taxId}
                          onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Country
                        </label>
                        <select
                          value={settings.country}
                          onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                        >
                          <option value="India">India</option>
                          <option value="USA">USA</option>
                          <option value="Germany">Germany</option>
                          <option value="UK">UK</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Currency
                        </label>
                        <select
                          value={settings.currency}
                          onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#FEF5F4]0"
                        >
                          <option value="INR">INR (₹)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                    </div>
                    <Button className="bg-[#EFA498] hover:bg-[#F97272]">
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">AI Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'aiAssistance', label: 'AI-Powered Assistance', desc: 'Get intelligent suggestions and automation' },
                      { key: 'autoTaxCalculation', label: 'Auto Tax Calculation', desc: 'Automatically calculate taxes based on country rules' },
                      { key: 'multiCurrency', label: 'Multi-Currency Support', desc: 'Handle invoices in multiple currencies' },
                    ].map((feature) => (
                      <div key={feature.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-white">{feature.label}</div>
                          <div className="text-xs text-gray-400">{feature.desc}</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings[feature.key as keyof typeof settings] as boolean}
                            onChange={(e) => setSettings({ ...settings, [feature.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#e64545] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EFA498]"></div>
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Workflows */}
            {activeTab === 'workflows' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Workflow className="h-5 w-5 text-[#EFA498]" />
                      Automated Workflows
                    </CardTitle>
                    <Button className="bg-[#EFA498] hover:bg-[#F97272]">
                      Create Workflow
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workflows.map((workflow, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white">{workflow.name}</h4>
                            {workflow.enabled ? (
                              <Badge className="bg-green-500/20 text-green-400">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-500/20 text-gray-400">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{workflow.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={workflow.enabled} className="sr-only peer" readOnly />
                          <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-[#EFA498] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-gray-400 mb-1">Trigger</div>
                          <div className="text-white font-medium">{workflow.trigger}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-1">Condition</div>
                          <div className="text-white font-medium">{workflow.condition}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-1">Action</div>
                          <div className="text-white font-medium">{workflow.action}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'slackNotifications', label: 'Slack Notifications', desc: 'Get alerts in Slack' },
                    { key: 'fraudAlerts', label: 'Fraud Alerts', desc: 'Immediate alerts for suspicious activity' },
                    { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Reminders for upcoming payments' },
                  ].map((notif) => (
                    <div key={notif.key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-white">{notif.label}</div>
                        <div className="text-xs text-gray-400">{notif.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[notif.key as keyof typeof settings] as boolean}
                          onChange={(e) => setSettings({ ...settings, [notif.key]: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-[#EFA498] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Compliance */}
            {activeTab === 'compliance' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#EFA498]" />
                    Tax Compliance Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {complianceSettings.map((country, idx) => (
                    <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-1">{country.country}</h4>
                          <div className="flex flex-wrap gap-2">
                            {country.rules.map((rule, i) => (
                              <Badge key={i} className="bg-white/10 text-gray-300 text-xs">
                                {rule}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge className={country.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                          {country.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Integrations */}
            {activeTab === 'integrations' && (
              <Card className="bg-white/5 backdrop-blur-xl border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Integrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {integrations.map((integration, idx) => (
                      <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{integration.icon}</div>
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-1">{integration.name}</h4>
                              <p className="text-xs text-gray-400 mb-2">{integration.description}</p>
                              <Badge className="bg-white/10 text-gray-300 text-xs">
                                {integration.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          className={integration.connected ? 'bg-green-500 hover:bg-green-600 w-full' : 'bg-[#EFA498] hover:bg-[#F97272] w-full'}
                        >
                          {integration.connected ? 'Connected' : 'Connect'}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
