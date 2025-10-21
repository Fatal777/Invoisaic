import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import { ArrowLeft, Play, Activity, Zap, FileText, Brain, DollarSign, LogIn, UserPlus, Menu, X, Sun, Moon } from 'lucide-react';

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
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
    <nav className={`sticky top-4 z-50 mx-4 rounded-2xl transition-all ${
      isDark 
        ? 'bg-white text-gray-900 shadow-lg border border-gray-200' 
        : 'bg-gray-900 text-white shadow-lg border border-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <Logo size="sm" dark={isDark} />
          </Link>

          {/* Agent Status Center (Center of navbar) */}
          {showAgentStatus && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700">
              <Activity className={`w-4 h-4 ${isDark ? 'text-blue-600' : 'text-blue-400'} animate-pulse`} />
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
              to="/features" 
              className={`text-sm font-medium tracking-wide transition-all duration-200 ${
                isDark 
                  ? 'text-gray-400 hover:text-[#EFA498]' 
                  : 'text-gray-600 hover:text-[#F97272]'
              }`}
            >
              Features
            </Link>
            <Link 
              to="/demo" 
              className={`text-sm font-medium tracking-wide transition-all duration-200 ${
                isDark 
                  ? 'text-gray-400 hover:text-[#EFA498]' 
                  : 'text-gray-600 hover:text-[#F97272]'
              }`}
            >
              Demos
            </Link>
            <Link 
              to="/architecture" 
              className={`text-sm font-medium tracking-wide transition-all duration-200 ${
                isDark 
                  ? 'text-gray-400 hover:text-[#EFA498]' 
                  : 'text-gray-600 hover:text-[#F97272]'
              }`}
            >
              Architecture
            </Link>
            
            {/* Theme Toggle with Animation */}
            <button
              onClick={toggleTheme}
              className={`p-2 transition-all duration-200 ${
                isDark
                  ? 'text-gray-400 hover:text-[#EFA498]'
                  : 'text-gray-600 hover:text-[#F97272]'
              }`}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Sun className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Moon className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            
            {/* Divider */}
            <div className={`h-6 w-px ${
              isDark ? 'bg-gray-700' : 'bg-gray-300'
            }`} />
            
            {/* Auth Buttons - Clerk */}
            <SignedOut>
              <SignInButton mode="modal">
                <button className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isDark
                    ? 'text-gray-400 hover:text-[#EFA498]'
                    : 'text-gray-600 hover:text-[#F97272]'
                }`}>
                  <LogIn className="h-4 w-4" />
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-[#F97272] hover:bg-[#f85c5c] text-white px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#F97272]/20">
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10 ring-2 ring-[#F97272]/20 hover:ring-[#F97272]/40 transition-all',
                    userButtonPopoverCard: isDark 
                      ? 'bg-white border border-gray-200 shadow-2xl' 
                      : 'bg-gray-900 border border-gray-700 shadow-2xl',
                    userButtonPopoverActionButton: isDark 
                      ? 'hover:bg-gray-100 text-gray-900 hover:text-black' 
                      : 'hover:bg-gray-800 text-gray-100 hover:text-white',
                    userButtonPopoverActionButtonText: isDark ? 'text-gray-900 font-medium' : 'text-gray-100 font-medium',
                    userButtonPopoverActionButtonIcon: isDark ? 'text-gray-700' : 'text-gray-300',
                    userButtonPopoverFooter: isDark ? 'border-t border-gray-200' : 'border-t border-gray-700',
                    userPreviewMainIdentifier: isDark ? 'text-gray-900 font-semibold' : 'text-white font-semibold',
                    userPreviewSecondaryIdentifier: isDark ? 'text-gray-600' : 'text-gray-300',
                  }
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-all duration-200 ${
              isDark ? 'text-gray-400 hover:text-[#EFA498]' : 'text-gray-600 hover:text-[#F97272]'
            }`}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700/40 pt-4 space-y-2">
            <Link
              to="/features"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'text-gray-400 hover:text-[#EFA498] active:text-[#F97272]'
                  : 'text-gray-600 hover:text-[#F97272] active:text-[#f85c5c]'
              }`}
            >
              Features
            </Link>
            <Link
              to="/demo"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'text-gray-400 hover:text-[#EFA498] active:text-[#F97272]'
                  : 'text-gray-600 hover:text-[#F97272] active:text-[#f85c5c]'
              }`}
            >
              Demos
            </Link>
            <Link
              to="/architecture"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'text-gray-400 hover:text-[#EFA498] active:text-[#F97272]'
                  : 'text-gray-600 hover:text-[#F97272] active:text-[#f85c5c]'
              }`}
            >
              Architecture
            </Link>
            <div className={`border-t my-3 ${
              isDark ? 'border-gray-700/40' : 'border-gray-300/40'
            }`} />
            <button
              onClick={() => {
                toggleTheme();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                isDark
                  ? 'text-gray-400 hover:text-[#EFA498] active:text-[#F97272]'
                  : 'text-gray-600 hover:text-[#F97272] active:text-[#f85c5c]'
              }`}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <div className={`border-t my-3 ${
              isDark ? 'border-gray-700/40' : 'border-gray-300/40'
            }`} />
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full text-left px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isDark
                      ? 'text-gray-400 hover:text-[#EFA498] active:text-[#F97272]'
                      : 'text-gray-600 hover:text-[#F97272] active:text-[#f85c5c]'
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full bg-[#F97272] hover:bg-[#f85c5c] active:bg-[#e64545] text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#F97272]/20"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <div className="px-4 py-2 flex items-center gap-3">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10 ring-2 ring-[#FEF5F4]0/20 hover:ring-[#FEF5F4]0/40 transition-all',
                      userButtonPopoverCard: isDark ? 'bg-gray-900 border border-gray-800 shadow-2xl' : 'bg-white border border-gray-200 shadow-2xl',
                      userButtonPopoverActionButton: isDark ? 'hover:bg-gray-800 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-700',
                      userButtonPopoverActionButtonText: 'font-medium',
                      userButtonPopoverActionButtonIcon: isDark ? 'text-gray-400' : 'text-gray-500',
                      userButtonPopoverFooter: isDark ? 'border-t border-gray-800' : 'border-t border-gray-200',
                      userPreviewMainIdentifier: isDark ? 'text-white font-semibold' : 'text-gray-900 font-semibold',
                      userPreviewSecondaryIdentifier: isDark ? 'text-gray-400' : 'text-gray-600',
                    }
                  }}
                />
                <span className={`text-sm font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>Account</span>
              </div>
            </SignedIn>
          </div>
        )}
      </div>
    </nav>
  );
}