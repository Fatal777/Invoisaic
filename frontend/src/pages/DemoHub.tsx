/**
 * Demo Hub - Central hub for all interactive demos
 * Minimalist design - Black, white, grey with red accents
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Upload, Building2, Activity, ArrowRight, Zap, Eye, Sparkles, TrendingUp, Clock, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Demo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  status: 'live' | 'beta';
  features: string[];
}

export default function DemoHub() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  useEffect(() => {
    const hasVisited = localStorage.getItem('demo-hub-visited');
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem('demo-hub-visited', 'true');
    }
  }, []);

  const demos: Demo[] = [
    {
      id: 'livedoc',
      title: 'LiveDoc Intelligence',
      description: 'Watch AI process invoices live with visual annotations and agent activity',
      icon: <Eye className="w-8 h-8" />,
      path: '/demo/livedoc',
      status: 'live',
      features: ['Split-screen view', 'Live annotations', 'Real-time WebSocket', 'Visual AI'],
    },
    {
      id: 'ecommerce',
      title: 'Autonomous Invoice Generation',
      description: 'Simulate e-commerce purchase and watch AI automatically generate invoice',
      icon: <ShoppingCart className="w-8 h-8" />,
      path: '/demo/ecommerce',
      status: 'live',
      features: ['Webhook simulation', 'AI invoice generation', 'PDF download', 'Tax calculation'],
    },
    {
      id: 'onboarding',
      title: 'Company Onboarding',
      description: 'Register company, add products, generate GST-compliant invoices',
      icon: <Building2 className="w-8 h-8" />,
      path: '/demo/onboarding',
      status: 'live',
      features: ['GSTIN validation', 'Product catalog', 'GST calculation', 'Invoice generation'],
    },
    {
      id: 'agents',
      title: 'Agent Orchestration',
      description: 'Terminal view of multi-agent AI system working in real-time',
      icon: <Activity className="w-8 h-8" />,
      path: '/demo/agents',
      status: 'live',
      features: ['Real-time logs', '4 AI agents', 'Decision tracking', 'Cost monitoring'],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar variant="light" />

      {/* Welcome Banner */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-[#F97272] to-purple-600 border-b border-[#FEF5F4]0"
          >
            <div className="max-w-7xl mx-auto px-8 py-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Welcome to Interactive Demos!</h3>
                    <p className="text-white/90 mb-3 max-w-2xl">
                      Explore our AI-powered invoice automation platform through hands-on demos. Start with <strong>LiveDoc Intelligence</strong> to see real-time AI processing in action.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => navigate('/demo/livedoc')}
                        className="px-6 py-2 bg-white text-[#F97272] hover:bg-gray-100 rounded-lg font-semibold transition-colors flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Start with LiveDoc
                      </button>
                      <button
                        onClick={() => setShowWelcome(false)}
                        className="px-6 py-2 text-white/80 hover:text-white transition-colors"
                      >
                        Explore All Demos
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Dark Section */}
      <div className="bg-gradient-to-br from-black via-gray-950 to-black border-b border-gray-800 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#d42e2e]/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gray-800/30 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-8 py-20 relative">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 mb-6 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <div className="w-2 h-2 bg-[#EFA498] rounded-full animate-pulse" />
              <span className="text-sm text-gray-400 uppercase tracking-wider font-medium">Interactive Demos</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight"
            >
              Experience AI in Action
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 max-w-3xl mx-auto"
            >
              Explore our AI-powered invoice automation platform through hands-on, interactive demonstrations
            </motion.p>
          </div>
        </div>
      </div>

      {/* Demo Grid - Light Section */}
      <div className="bg-white max-w-7xl mx-auto px-8 py-20">
        {/* Recommended Demo Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-3"
        >
          <Star className="w-5 h-5 text-[#F97272]" />
          <span className="text-sm font-semibold text-gray-700">
            <span className="text-[#F97272]">Recommended:</span> Start with LiveDoc Intelligence for the best experience
          </span>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {demos.map((demo, index) => (
            <motion.div
              key={demo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white border-2 border-gray-200 hover:border-[#F97272] rounded-2xl p-8 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-[#F97272]/20"
              onClick={() => navigate(demo.path)}
              onMouseEnter={() => setSelectedDemo(demo.id)}
              onMouseLeave={() => setSelectedDemo(null)}
            >
              {/* Recommended Badge for LiveDoc */}
              {demo.id === 'livedoc' && (
                <div className="absolute -top-3 -right-3 z-10">
                  <div className="bg-gradient-to-r from-[#F97272] to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <Star className="w-3 h-3" />
                    RECOMMENDED
                  </div>
                </div>
              )}
              {/* Status badge */}
              <div className="absolute top-6 right-6">
                <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${
                  demo.status === 'live' 
                    ? 'bg-[#F97272] text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  {demo.status.toUpperCase()}
                </span>
              </div>

              {/* Icon */}
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-[#F97272] group-hover:to-[#f85c5c] group-hover:border-[#FEF5F4]0 transition-all text-gray-700 group-hover:text-white"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {demo.icon}
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 text-gray-900">{demo.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{demo.description}</p>

              {/* Features */}
              <div className="space-y-2 mb-8">
                {demo.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-[#F97272] rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-[#F97272] font-semibold group-hover:gap-4 transition-all">
                <span>Launch Demo</span>
                <motion.div
                  animate={{ x: selectedDemo === demo.id ? 5 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FEF5F4]/0 via-[#FEF5F4]/0 to-[#FEF5F4]/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Stats - Dark Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-4 gap-6 mt-20 pt-16 border-t border-gray-200"
        >
          {[
            { label: 'Processing Speed', value: '4.2s', sublabel: 'avg per invoice', icon: <Clock className="w-5 h-5" /> },
            { label: 'OCR Accuracy', value: '99.8%', sublabel: 'with Textract', icon: <TrendingUp className="w-5 h-5" /> },
            { label: 'Cost Savings', value: '99.98%', sublabel: 'vs enterprise', icon: <Sparkles className="w-5 h-5" /> },
            { label: 'Monthly Cost', value: '$9.13', sublabel: 'for 1000 invoices', icon: <Star className="w-5 h-5" /> },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="text-center group cursor-default"
            >
              <div className="flex items-center justify-center mb-3 text-[#F97272] group-hover:scale-110 transition-transform">
                {stat.icon}
              </div>
              <div className="text-3xl font-bold text-[#F97272] mb-2 group-hover:scale-105 transition-transform">{stat.value}</div>
              <div className="text-sm font-semibold text-gray-900 mb-1">{stat.label}</div>
              <div className="text-xs text-gray-600">{stat.sublabel}</div>
            </motion.div>
          ))}
        </motion.div>
        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-10 shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#FDDAD6] rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-[#F97272]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3 text-gray-900">Getting Started Tips</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F97272] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">1</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Start with LiveDoc Intelligence</p>
                    <p className="text-xs text-gray-600">See real-time AI processing with visual annotations and live agent activity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F97272] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">2</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Follow the guided tour</p>
                    <p className="text-xs text-gray-600">Each demo includes an interactive tutorial to help you understand the features</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F97272] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">3</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Use sample invoices</p>
                    <p className="text-xs text-gray-600">Upload any invoice PDF or image to test the AI processing capabilities</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F97272] rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">4</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Explore all demos</p>
                    <p className="text-xs text-gray-600">Each demo showcases different aspects of our AI-powered automation platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
