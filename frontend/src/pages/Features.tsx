import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/context/ThemeContext';
import {
  FileText, CheckCircle, Layers, BarChart3, Upload, Zap,
  Brain, Sparkles, ArrowRight, Globe, TrendingUp, Shield,
  Clock, DollarSign, Users, Award
} from 'lucide-react';

export default function Features() {
  const { theme } = useTheme();
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setVisibleCards((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.2 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const mainFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Generation',
      description: 'Amazon Bedrock Nova Micro generates invoices in milliseconds with 98% accuracy. Natural language processing understands your requirements.',
      color: 'from-purple-500 to-pink-500',
      stats: { value: '98%', label: 'Accuracy' }
    },
    {
      icon: CheckCircle,
      title: 'Smart Validation',
      description: 'Real-time compliance checking for all countries. Automatically validates tax calculations, formats, and regulatory requirements.',
      color: 'from-green-500 to-emerald-500',
      stats: { value: '<2s', label: 'Validation' }
    },
    {
      icon: Layers,
      title: 'Product Categorization',
      description: 'AI automatically assigns HSN/SAC codes and tax categories. Learns from your patterns to improve accuracy over time.',
      color: 'from-purple-500 to-pink-500',
      stats: { value: '100+', label: 'Categories' }
    },
    {
      icon: BarChart3,
      title: 'Smart Reconciliation',
      description: 'Automatically matches payments to invoices using AI. Detects discrepancies and suggests corrections instantly.',
      color: 'from-[#F97272] to-[#EFA498]',
      stats: { value: '99%', label: 'Match Rate' }
    },
    {
      icon: Upload,
      title: 'OCR Extraction',
      description: 'Extract data from existing PDF and image invoices using AWS Textract. Supports multiple formats and languages.',
      color: 'from-indigo-500 to-blue-500',
      stats: { value: '95%', label: 'Accuracy' }
    },
    {
      icon: Zap,
      title: 'Bulk Generation',
      description: 'Generate 100+ invoices in under 3 seconds with parallel AI processing. Perfect for high-volume businesses.',
      color: 'from-yellow-500 to-[#EFA498]',
      stats: { value: '3s', label: 'Per 100' }
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      description: '90% reduction in invoice processing time',
      color: theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
    },
    {
      icon: DollarSign,
      title: 'Reduce Costs',
      description: 'Cut operational costs by up to 70%',
      color: theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
    },
    {
      icon: Shield,
      title: 'Stay Compliant',
      description: '100% compliance with local tax regulations',
      color: theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
    },
    {
      icon: Users,
      title: 'Scale Easily',
      description: 'Handle unlimited invoices without extra staff',
      color: theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
    },
  ];

  const countries = [
    { flag: '🇺🇸', name: 'United States', tax: 'Sales Tax' },
    { flag: '🇩🇪', name: 'Germany', tax: 'VAT (MwSt)' },
    { flag: '🇮🇳', name: 'India', tax: 'GST' },
    { flag: '🇬🇧', name: 'United Kingdom', tax: 'VAT' },
    { flag: '🇫🇷', name: 'France', tax: 'TVA' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      <Navbar />

      {/* Hero Section */}
      <section className={`relative overflow-hidden py-24 transition-colors ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-zinc-950 via-black to-zinc-950'
          : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
      }`}>
        <div className="absolute inset-0">
          {theme === 'dark' ? (
            <>
              <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-[#F97272]/15 to-zinc-900/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-zinc-800/10 to-black/5 rounded-full blur-3xl" />
            </>
          ) : (
            <>
              <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-[#EFA498]/30 to-gray-100/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-gray-200/20 to-gray-100/20 rounded-full blur-3xl" />
            </>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 mb-8 px-5 py-3 rounded-full transition-colors ${
              theme === 'dark'
                ? 'border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl'
                : 'border border-gray-300 bg-white shadow-sm'
            }`}>
              <Brain className={`h-4 w-4 ${
                theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
              }`} />
              <span className={`text-sm uppercase tracking-wider font-medium ${
                theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
              }`}>AI-Powered Features</span>
            </div>

            <h1 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Everything You Need
              <br />
              <span className={theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'}>
                In One Platform
              </span>
            </h1>

            <p className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light transition-colors ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              Six powerful AI features working together to automate your entire invoice workflow
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/demo">
                <button className={`text-white px-10 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-lg ${
                  theme === 'dark'
                    ? 'bg-[#F97272] hover:bg-[#f85c5c] shadow-[#F97272]/30'
                    : 'bg-[#EFA498] hover:bg-[#F97272] shadow-[#EFA498]/30'
                }`}>
                  <Sparkles className="h-5 w-5" />
                  Try Live Demo
                </button>
              </Link>
              <Link to="/">
                <button className={`border-2 px-10 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-sm ${
                  theme === 'dark'
                    ? 'border-zinc-700 hover:border-zinc-600 text-white bg-zinc-900'
                    : 'border-gray-300 hover:border-gray-400 text-gray-900 bg-white'
                }`}>
                  Learn More
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className={`py-32 transition-colors ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className={`text-4xl md:text-6xl font-bold mb-6 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Core Features
            </h2>
            <p className={`text-xl max-w-2xl mx-auto font-light transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Powered by Amazon Bedrock Nova Micro and AWS services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              const isVisible = visibleCards.includes(idx);
              const delay = (idx % 3) * 150;

              return (
                <div
                  key={idx}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  data-index={idx}
                  className={`group relative transition-all duration-700 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-16'
                  }`}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 blur-2xl rounded-3xl transition-opacity`} />
                  
                  {/* Card */}
                  <div className={`relative h-full flex flex-col p-8 border-2 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 hover:border-[#F97272]'
                      : 'bg-gray-50 border-gray-200 hover:border-[#EFA498]'
                  }`}>
                    {/* Icon */}
                    <div className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className={`text-2xl font-bold mb-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{feature.title}</h3>
                    
                    <p className={`text-sm leading-relaxed mb-6 flex-grow ${
                      theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                    }`}>{feature.description}</p>

                    {/* Stats */}
                    <div className={`pt-6 border-t flex items-baseline gap-2 ${
                      theme === 'dark' ? 'border-zinc-800' : 'border-gray-200'
                    }`}>
                      <span className={`text-3xl font-bold ${
                        theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
                      }`}>{feature.stats.value}</span>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                      }`}>{feature.stats.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`py-32 transition-colors ${
        theme === 'dark' ? 'bg-black' : 'bg-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className={`text-4xl md:text-6xl font-bold mb-6 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Why Choose Invoisaic?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className={`group relative p-8 rounded-3xl border-2 transition-all hover:-translate-y-2 hover:shadow-xl ${
                    theme === 'dark'
                      ? 'bg-zinc-950 border-zinc-800 hover:border-[#F97272]'
                      : 'bg-white border-gray-200 hover:border-[#EFA498]'
                  }`}
                >
                  <Icon className={`h-12 w-12 mb-4 ${benefit.color}`} />
                  <h3 className={`text-xl font-bold mb-3 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{benefit.title}</h3>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                  }`}>{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section className={`py-32 transition-colors ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className={`inline-flex items-center gap-2 mb-6 px-5 py-3 rounded-full shadow-sm transition-colors ${
              theme === 'dark'
                ? 'border border-zinc-800 bg-zinc-900'
                : 'border border-gray-300 bg-gray-50'
            }`}>
              <Globe className={`h-4 w-4 ${
                theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
              }`} />
              <span className={`text-sm uppercase tracking-wider font-medium ${
                theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
              }`}>Global Coverage</span>
            </div>

            <h2 className={`text-4xl md:text-6xl font-bold mb-6 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              5 Countries Supported
            </h2>
            <p className={`text-xl max-w-2xl mx-auto font-light transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Automatic tax calculations and compliance for each region
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {countries.map((country, idx) => (
              <div
                key={idx}
                className={`group relative p-8 rounded-3xl border-2 text-center transition-all hover:-translate-y-2 hover:shadow-xl ${
                  theme === 'dark'
                    ? 'bg-zinc-900 border-zinc-800 hover:border-[#F97272]'
                    : 'bg-gray-50 border-gray-200 hover:border-[#EFA498]'
                }`}
              >
                <div className="text-5xl mb-4">{country.flag}</div>
                <h3 className={`text-lg font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{country.name}</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                }`}>{country.tax}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-32 relative overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-[#F97272]' : 'bg-[#EFA498]'
      }`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Award className="h-16 w-16 text-white mx-auto mb-6" />
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white leading-tight">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto font-light">
            Join businesses worldwide using AI to automate their invoicing
          </p>
          <Link to="/demo">
            <button className="bg-black hover:bg-zinc-900 text-white px-12 py-5 rounded-full text-lg font-medium transition-all hover:scale-105 inline-flex items-center gap-3 shadow-2xl">
              <Sparkles className="h-6 w-6" />
              Start Free Demo
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
