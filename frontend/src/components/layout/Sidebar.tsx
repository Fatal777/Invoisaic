import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Brain, 
  Activity,
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'AI Insights', href: '/insights', icon: Brain },
  { name: 'Agent Monitor', href: '/agents', icon: Activity },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Invoisaic</h1>
        </div>
        <p className="text-xs text-gray-500 mt-1">AI-Powered Invoicing</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-900 mb-1">
            AWS Hackathon 2025
          </p>
          <p className="text-xs text-blue-700">
            Powered by Bedrock AgentCore
          </p>
        </div>
      </div>
    </div>
  );
}
