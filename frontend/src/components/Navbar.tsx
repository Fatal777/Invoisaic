import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import Logo from './Logo';
import { ArrowLeft, Play, Activity, Zap, FileText, Brain, DollarSign } from 'lucide-react';

interface NavbarProps {
  variant?: 'light' | 'dark';
  showAgentStatus?: boolean;
}

interface AgentStatus {
  id: string;
  name: string;
  icon: JSX.Element;
  status: 'idle' | 'active' | 'processing';
  color: string;
}

export default function Navbar({ variant = 'dark', showAgentStatus = false }: NavbarProps) {
  const location = useLocation();
  const isDark = variant === 'dark';
  
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([
    { id: 'textract', name: 'Textract', icon: <FileText className="w-3 h-3" />, status: 'idle', color: '#3b82f6' },
    { id: 'bedrock', name: 'Bedrock', icon: <Brain className="w-3 h-3" />, status: 'idle', color: '#8b5cf6' },
    { id: 'sagemaker', name: 'SageMaker', icon: <DollarSign className="w-3 h-3" />, status: 'idle', color: '#ff8000' },
    { id: 'workflow', name: 'Workflow', icon: <Zap className="w-3 h-3" />, status: 'idle', color: '#00ff00' },
  ]);

  // Simulate agent activity
  useEffect(() => {
    if (!showAgentStatus) return;

    const interval = setInterval(() => {
      setAgentStatuses(prev => prev.map(agent => ({
        ...agent,
        status: Math.random() > 0.7 ? 'processing' : Math.random() > 0.5 ? 'active' : 'idle'
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [showAgentStatus]);
  
  return (
    <nav className={`backdrop-blur-2xl sticky top-4 z-50 mx-4 rounded-2xl transition-all ${
      isDark 
        ? 'bg-gradient-to-r from-gray-950/95 via-gray-900/95 to-gray-950/95 border border-gray-700/40 shadow-2xl shadow-black/50 ring-1 ring-white/10' 
        : 'bg-white/80 border border-gray-200/50 shadow-2xl'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <Logo size="sm" dark={!isDark} />
          </Link>

          {/* Agent Status Center (Center of navbar) */}
          {showAgentStatus && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700">
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
              <div className="flex items-center gap-3">
                {agentStatuses.map(agent => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-900/50"
                    title={`${agent.name}: ${agent.status}`}
                  >
                    <div style={{ color: agent.color }}>{agent.icon}</div>
                    <div
                      className={`w-2 h-2 rounded-full transition-all ${
                        agent.status === 'processing'
                          ? 'bg-green-400 animate-pulse'
                          : agent.status === 'active'
                          ? 'bg-yellow-400'
                          : 'bg-gray-600'
                      }`}
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs text-gray-400 ml-2">Live</span>
            </div>
          )}
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/#features" 
              className={`text-sm uppercase tracking-wider transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Features
            </Link>
            <Link 
              to="/agent-theater" 
              className={`text-sm uppercase tracking-wider transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Agent Theater
            </Link>
            <Link 
              to="/architecture" 
              className={`text-sm uppercase tracking-wider transition-colors ${
                isDark 
                  ? 'text-gray-300 hover:text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Architecture
            </Link>
            <Link to="/demo">
              <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-red-500/20">
                <Play className="h-4 w-4" />
                Try Demo
              </button>
            </Link>
            {location.pathname !== '/' && (
              <Link to="/">
                <Button variant="ghost" size="sm" className={isDark ? 'text-gray-300 hover:text-white' : ''}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}