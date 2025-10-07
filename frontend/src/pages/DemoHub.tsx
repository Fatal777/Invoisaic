/**
 * Demo Hub - Central hub for all interactive demos
 * Minimalist design - Black, white, grey with red accents
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Upload, Building2, Activity, ArrowRight, Zap } from 'lucide-react';

interface Demo {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  path: string;
  status: 'live' | 'beta';
  features: string[];
}

export default function DemoHub() {
  const navigate = useNavigate();

  const demos: Demo[] = [
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
      id: 'ocr',
      title: 'Invoice OCR & Extraction',
      description: 'Upload any invoice and extract data with Amazon Textract',
      icon: <Upload className="w-8 h-8" />,
      path: '/demo/ocr',
      status: 'live',
      features: ['Real Textract OCR', 'Field validation', 'Data export', '99.8% accuracy'],
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Interactive Demos</h1>
              <p className="text-gray-400">Experience real AI-powered invoice automation</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Demo Grid */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          {demos.map((demo) => (
            <div
              key={demo.id}
              className="group relative bg-gray-950 border border-gray-800 hover:border-red-600 rounded-xl p-8 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(demo.path)}
            >
              {/* Status badge */}
              <div className="absolute top-6 right-6">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  demo.status === 'live' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {demo.status.toUpperCase()}
                </span>
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-red-600 transition-colors">
                {demo.icon}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold mb-3 text-white">{demo.title}</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">{demo.description}</p>

              {/* Features */}
              <div className="space-y-2 mb-8">
                {demo.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-red-600 font-semibold group-hover:gap-4 transition-all">
                <span>Launch Demo</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mt-16 pt-16 border-t border-gray-800">
          {[
            { label: 'Processing Speed', value: '4.2s', sublabel: 'avg per invoice' },
            { label: 'OCR Accuracy', value: '99.8%', sublabel: 'with Textract' },
            { label: 'Cost Savings', value: '99.98%', sublabel: 'vs enterprise' },
            { label: 'Monthly Cost', value: '$9.13', sublabel: 'for 1000 invoices' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-white mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
