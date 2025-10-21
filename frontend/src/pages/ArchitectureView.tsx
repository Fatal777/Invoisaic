/**
 * Architecture View - How Invoisaic Works
 * 
 * Visual flow diagram showing the complete invoice processing architecture
 * From user input to AI-powered invoice generation
 */

import React from 'react';
import { 
  Cloud, Database, Zap, FileText, Brain, Server, Shield, 
  Users, ArrowRight, CheckCircle, Sparkles, Globe, Lock, BarChart3
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';

export default function ArchitectureView() {
  const { theme } = useTheme();

  const flowSteps = [
    {
      id: 1,
      title: 'User Input',
      icon: Users,
      color: 'blue',
      description: 'User creates invoice via React frontend with country selection and invoice details'
    },
    {
      id: 2,
      title: 'API Gateway',
      icon: Server,
      color: 'purple',
      description: 'REST API with JWT authentication validates and routes requests'
    },
    {
      id: 3,
      title: 'Lambda Functions',
      icon: Zap,
      color: 'orange',
      description: 'Serverless compute processes invoice and triggers AI agent workflow'
    },
    {
      id: 4,
      title: 'AI Agent Layer',
      icon: Brain,
      color: 'pink',
      description: '4 specialized agents work in parallel: Supervisor, Pricing, Compliance, Customer Intelligence'
    },
    {
      id: 5,
      title: 'Data Storage',
      icon: Database,
      color: 'green',
      description: 'DynamoDB stores invoices, S3 stores PDFs, with AI recommendations'
    },
    {
      id: 6,
      title: 'Invoice Generated',
      icon: CheckCircle,
      color: 'emerald',
      description: 'Country-specific invoice with AI insights returned to user in <2 seconds'
    }
  ];

  const agents = [
    {
      name: 'Supervisor Agent',
      model: 'Nova Lite',
      icon: Brain,
      color: 'purple',
      responsibilities: [
        'Orchestrates multi-agent workflow',
        'Makes final coordination decisions',
        'Resolves conflicts between agents',
        'Determines approval requirements'
      ]
    },
    {
      name: 'Pricing Agent',
      model: 'Nova Micro',
      icon: BarChart3,
      color: 'blue',
      responsibilities: [
        'Complex pricing calculations',
        'Volume discount optimization',
        'Currency conversion',
        'Competitive analysis'
      ]
    },
    {
      name: 'Compliance Agent',
      model: 'Nova Micro',
      icon: Shield,
      color: 'green',
      responsibilities: [
        'Tax calculations across jurisdictions',
        'Regulatory validation',
        'E-invoicing standards',
        'Industry compliance'
      ]
    },
    {
      name: 'Customer Intelligence',
      model: 'Nova Micro',
      icon: Sparkles,
      color: 'orange',
      responsibilities: [
        'Payment behavior prediction',
        'Risk assessment',
        'Optimal timing recommendations',
        'Relationship health scoring'
      ]
    }
  ];

  const awsServices = [
    { name: 'API Gateway', icon: Server, description: 'RESTful API endpoints with JWT auth' },
    { name: 'Lambda', icon: Zap, description: '11 serverless functions for compute' },
    { name: 'Bedrock AgentCore', icon: Brain, description: 'Multi-agent AI orchestration' },
    { name: 'DynamoDB', icon: Database, description: '3 tables for invoices, customers, agents' },
    { name: 'S3', icon: Cloud, description: 'Document storage with encryption' },
    { name: 'Cognito', icon: Lock, description: 'User authentication & authorization' },
    { name: 'Textract', icon: FileText, description: 'OCR for invoice extraction' },
    { name: 'CloudFront', icon: Globe, description: 'Global CDN for frontend' }
  ];

  const colorClasses = {
    blue: {
      bg: theme === 'dark' ? 'bg-blue-950' : 'bg-blue-50',
      border: theme === 'dark' ? 'border-blue-800' : 'border-blue-200',
      text: 'text-blue-600',
      icon: theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'
    },
    purple: {
      bg: theme === 'dark' ? 'bg-purple-950' : 'bg-purple-50',
      border: theme === 'dark' ? 'border-purple-800' : 'border-purple-200',
      text: 'text-purple-600',
      icon: theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'
    },
    orange: {
      bg: theme === 'dark' ? 'bg-orange-950' : 'bg-orange-50',
      border: theme === 'dark' ? 'border-orange-800' : 'border-orange-200',
      text: 'text-orange-600',
      icon: theme === 'dark' ? 'bg-orange-900' : 'bg-orange-100'
    },
    pink: {
      bg: theme === 'dark' ? 'bg-pink-950' : 'bg-pink-50',
      border: theme === 'dark' ? 'border-pink-800' : 'border-pink-200',
      text: 'text-pink-600',
      icon: theme === 'dark' ? 'bg-pink-900' : 'bg-pink-100'
    },
    green: {
      bg: theme === 'dark' ? 'bg-green-950' : 'bg-green-50',
      border: theme === 'dark' ? 'border-green-800' : 'border-green-200',
      text: 'text-green-600',
      icon: theme === 'dark' ? 'bg-green-900' : 'bg-green-100'
    },
    emerald: {
      bg: theme === 'dark' ? 'bg-emerald-950' : 'bg-emerald-50',
      border: theme === 'dark' ? 'border-emerald-800' : 'border-emerald-200',
      text: 'text-emerald-600',
      icon: theme === 'dark' ? 'bg-emerald-900' : 'bg-emerald-100'
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className={`text-5xl md:text-7xl font-bold mb-6 transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            How Invoisaic Works
          </h1>
          <p className={`text-xl max-w-3xl mx-auto transition-colors ${
            theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          }`}>
            A serverless, AI-powered architecture built on AWS that generates country-specific invoices in under 2 seconds
          </p>
        </div>

        {/* Architecture Flow */}
        <div className="mb-20">
          <h2 className={`text-3xl font-bold mb-8 text-center transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Invoice Processing Flow
          </h2>

          <div className="space-y-6">
            {flowSteps.map((step, index) => (
              <div key={step.id}>
                <div className={`relative border-2 rounded-2xl p-6 transition-all hover:scale-102 ${
                  colorClasses[step.color as keyof typeof colorClasses].bg
                } ${
                  colorClasses[step.color as keyof typeof colorClasses].border
                }`}>
                  <div className="flex items-start gap-6">
                    {/* Step Number */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                      colorClasses[step.color as keyof typeof colorClasses].icon
                    } ${
                      colorClasses[step.color as keyof typeof colorClasses].text
                    }`}>
                      {step.id}
                    </div>

                    {/* Icon */}
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                      colorClasses[step.color as keyof typeof colorClasses].icon
                    }`}>
                      <step.icon className={`w-7 h-7 ${
                        colorClasses[step.color as keyof typeof colorClasses].text
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold mb-2 transition-colors ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-lg transition-colors ${
                        theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                {index < flowSteps.length - 1 && (
                  <div className="flex justify-center my-4">
                    <ArrowRight className={`w-8 h-8 ${
                      theme === 'dark' ? 'text-zinc-700' : 'text-gray-400'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Agents Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Multi-Agent AI System
            </h2>
            <p className={`text-lg transition-colors ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              4 specialized AI agents powered by Amazon Bedrock Nova models work in parallel
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <div key={agent.name} className={`border-2 rounded-2xl p-6 transition-all hover:-translate-y-1 ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 hover:border-orange-600'
                  : 'bg-white border-gray-200 hover:border-orange-300'
              }`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    colorClasses[agent.color as keyof typeof colorClasses].icon
                  }`}>
                    <agent.icon className={`w-6 h-6 ${
                      colorClasses[agent.color as keyof typeof colorClasses].text
                    }`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold transition-colors ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {agent.name}
                    </h3>
                    <p className={`text-sm transition-colors ${
                      theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                    }`}>
                      Powered by {agent.model}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2">
                  {agent.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        colorClasses[agent.color as keyof typeof colorClasses].text
                      }`} />
                      <span className={`text-sm transition-colors ${
                        theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                      }`}>
                        {resp}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* AWS Services */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              AWS Services Stack
            </h2>
            <p className={`text-lg transition-colors ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              Serverless, scalable, and cost-effective infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {awsServices.map((service) => (
              <div key={service.name} className={`border-2 rounded-xl p-4 transition-all hover:-translate-y-1 ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  theme === 'dark' ? 'bg-orange-950' : 'bg-orange-100'
                }`}>
                  <service.icon className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className={`font-bold mb-1 transition-colors ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {service.name}
                </h3>
                <p className={`text-sm transition-colors ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Benefits */}
        <div className={`border-2 rounded-2xl p-8 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-orange-950/20 to-zinc-950 border-orange-900'
            : 'bg-gradient-to-br from-orange-50 to-white border-orange-200'
        }`}>
          <h2 className={`text-3xl font-bold mb-6 text-center transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Why This Architecture?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                theme === 'dark' ? 'bg-orange-950' : 'bg-orange-100'
              }`}>
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className={`text-xl font-bold mb-2 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Lightning Fast
              </h3>
              <p className={`transition-colors ${
                theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                Generate invoices in under 2 seconds with parallel AI processing
              </p>
            </div>

            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                theme === 'dark' ? 'bg-green-950' : 'bg-green-100'
              }`}>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className={`text-xl font-bold mb-2 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Auto-Scaling
              </h3>
              <p className={`transition-colors ${
                theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                Serverless architecture scales automatically from 1 to 1M invoices
              </p>
            </div>

            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                theme === 'dark' ? 'bg-blue-950' : 'bg-blue-100'
              }`}>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className={`text-xl font-bold mb-2 transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Enterprise Security
              </h3>
              <p className={`transition-colors ${
                theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
              }`}>
                Encryption at rest and in transit, JWT auth, IAM roles
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
