import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import Navbar from '@/components/Navbar';
import Chatbot from '@/components/Chatbot';
import InteractiveHero from '@/components/InteractiveHero';
import { useTheme } from '@/context/ThemeContext';
import {
  FileText, Globe, TrendingUp,
  Zap, Brain, Sparkles, ArrowRight, Play, Star, Mail, Phone, MapPin
} from 'lucide-react';

export default function Landing() {
  const { theme } = useTheme();
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress through the section
      const scrollStart = -rect.top;
      const scrollRange = sectionHeight - windowHeight;
      const progress = Math.max(0, Math.min(1, scrollStart / scrollRange));
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Automation',
      description: 'Amazon Bedrock Nova Micro generates invoices in milliseconds with 98% accuracy',
    },
    {
      icon: Globe,
      title: '5-Country Compliance',
      description: 'Automatic tax calculations for USA, Germany, India, UK, and France',
    },
    {
      icon: Zap,
      title: 'Bulk Processing',
      description: 'Generate 100+ invoices in under 3 seconds with parallel AI processing',
    },
    {
      icon: FileText,
      title: 'OCR Extraction',
      description: 'Extract data from existing invoices using AWS Textract',
    },
    {
      icon: TrendingUp,
      title: 'Smart Reconciliation',
      description: 'AI automatically matches payments to invoices',
    },
    {
      icon: Sparkles,
      title: 'Product Categorization',
      description: 'Auto-assign HSN/SAC codes and tax categories',
    },
  ];

  const stats = [
    { value: '98%', label: 'Accuracy' },
    { value: '<2s', label: 'Generation Time' },
    { value: '5', label: 'Countries' },
    { value: '6', label: 'AI Features' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      theme === 'dark' ? 'bg-black' : 'bg-gray-50'
    }`}>
      <Navbar />
      <Chatbot />

      {/* Interactive Hero Section */}
      <InteractiveHero />

      {/* Stacking Cards - Scroll-Locked Peel Effect */}
      <section ref={sectionRef} className="relative bg-gray-900">
        {/* Title Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white">Powerful Features</h2>
        </div>
        
        {/* Card Stack Container - This creates the scroll-lock effect */}
        <div style={{ height: '300vh', position: 'relative' }}>
          {/* Sticky wrapper that locks in viewport */}
          <div className="sticky top-0 left-0 right-0 h-screen flex items-center justify-center overflow-hidden">
            {/* Progress Indicator - Left Side */}
            <div className="absolute left-8 md:left-20 top-1/2 -translate-y-1/2 flex flex-col gap-4">
              {[...Array(6)].map((_, i) => {
                const isActive = scrollProgress >= i / 6 && scrollProgress < (i + 1) / 6;
                const isPassed = scrollProgress > (i + 1) / 6;
                
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      isPassed ? 'bg-[#EFA498] scale-75' : 
                      isActive ? 'bg-[#EFA498] scale-125 shadow-lg shadow-[#F97272]/50' : 
                      'bg-white/20'
                    }`} />
                    <div className={`text-sm font-mono transition-all duration-300 ${
                      isActive ? 'text-white font-bold' : 
                      isPassed ? 'text-gray-500' : 
                      'text-gray-600'
                    }`}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Hint - Right Side */}
            <div className="absolute right-8 md:right-20 top-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-4 text-gray-500">
                <div className="text-sm uppercase tracking-widest rotate-90 origin-center whitespace-nowrap">
                  Scroll
                </div>
                <div className="flex flex-col gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 h-8 bg-white/10 rounded-full"
                      style={{
                        opacity: scrollProgress > i * 0.3 ? 0.3 : 1,
                        transition: 'opacity 0.3s'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Card container */}
            <div className="relative w-[350px] h-[500px]" style={{ perspective: '1000px' }}>
              {[
                {
                  title: 'AI-Powered',
                  subtitle: 'Generation',
                  stat: '98%',
                  label: 'Accuracy',
                  description: 'Generate invoices instantly with Bedrock Nova Micro',
                  color: 'bg-gradient-to-br from-blue-600 to-cyan-600'
                },
                {
                  title: 'Smart',
                  subtitle: 'Validation',
                  stat: '<2s',
                  label: 'Speed',
                  description: 'Real-time compliance checking for all countries',
                  color: 'bg-gradient-to-br from-green-600 to-emerald-600'
                },
                {
                  title: 'Intelligent',
                  subtitle: 'Categorization',
                  stat: '100+',
                  label: 'Categories',
                  description: 'Auto-assign tax codes with AI understanding',
                  color: 'bg-gradient-to-br from-purple-600 to-pink-600'
                },
                {
                  title: 'OCR',
                  subtitle: 'Extraction',
                  stat: '95%',
                  label: 'Accuracy',
                  description: 'Extract data from any document format',
                  color: 'bg-gradient-to-br from-orange-600 to-[#F97272]'
                },
                {
                  title: 'Smart',
                  subtitle: 'Reconciliation',
                  stat: '99%',
                  label: 'Match Rate',
                  description: 'Automatic payment matching with intelligence',
                  color: 'bg-gradient-to-br from-indigo-600 to-purple-600'
                },
                {
                  title: 'Bulk',
                  subtitle: 'Generation',
                  stat: '3s',
                  label: 'Per 100',
                  description: 'Parallel processing for maximum speed',
                  color: 'bg-gradient-to-br from-yellow-600 to-orange-600'
                },
              ].map((feature, idx) => {
                // Calculate peel progress for this card
                // Each card peels when scroll reaches its threshold
                const totalCards = 6;
                const cardThreshold = idx / totalCards;
                const nextThreshold = (idx + 1) / totalCards;
                
                // How much this card has peeled (0 = stacked, 1 = fully peeled away)
                let peelAmount = 0;
                if (scrollProgress >= cardThreshold) {
                  peelAmount = Math.min(1, (scrollProgress - cardThreshold) / (nextThreshold - cardThreshold));
                }
                
                // Transform values
                const translateY = peelAmount * -700; // Slide up and away
                const scale = 1 - (peelAmount * 0.3); // Shrink as it peels
                const opacity = 1 - (peelAmount * 0.8); // Fade out
                const rotateX = peelAmount * 20; // Tilt forward as it peels
                
                return (
                  <div
                    key={idx}
                    className={`absolute inset-0 ${feature.color} rounded-3xl p-8 shadow-2xl flex flex-col justify-between`}
                    style={{
                      transform: `translateY(${translateY}px) scale(${scale}) rotateX(${rotateX}deg)`,
                      transformOrigin: 'center bottom',
                      transformStyle: 'preserve-3d',
                      opacity: opacity,
                      zIndex: totalCards - idx, // Bottom card has highest z-index (shows first)
                      transition: 'none',
                      willChange: 'transform, opacity',
                    }}
                  >
                  {/* Top section */}
                  <div>
                    <div className="mb-6">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
                        <span className="text-2xl font-mono text-white">{String(idx + 1).padStart(2, '0')}</span>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-1">{feature.title}</h3>
                      <h4 className="text-3xl font-bold text-white/80">{feature.subtitle}</h4>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-6xl font-bold text-white">
                          {feature.stat}
                        </span>
                        <span className="text-white/70 text-xl">{feature.label}</span>
                      </div>
                    </div>
                    
                    <p className="text-white/90 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Bottom decoration */}
                  <div className="mt-auto pt-8">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-white/30" />
                        ))}
                      </div>
                      <div className="text-white/50 text-sm font-mono">
                        {String(idx + 1).padStart(2, '0')} / 06
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className={`py-32 relative overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 relative">
            <div className={`inline-flex items-center gap-2 mb-6 px-5 py-3 rounded-full shadow-sm transition-colors ${
              theme === 'dark'
                ? 'border border-zinc-800 bg-zinc-900'
                : 'border border-gray-300 bg-gray-50'
            }`}>
              <Brain className={`h-4 w-4 ${
                theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
              }`} />
              <span className={`text-sm uppercase tracking-wider font-medium ${
                theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
              }`}>AI Features</span>
            </div>
            <h2 className={`text-5xl md:text-7xl font-bold mb-6 leading-tight transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Everything You Need
            </h2>
            <p className={`text-xl max-w-2xl mx-auto font-light transition-colors ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Six powerful AI features working together
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const isVisible = visibleCards.includes(idx);
              const delay = (idx % 3) * 150; // Stagger animation by column
              
              return (
                <div
                  key={idx}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  data-index={idx}
                  className={`group relative h-full transition-all duration-700 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-16'
                  }`}
                  style={{ transitionDelay: `${delay}ms` }}
                >
                  <div className={`absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-[#F97272]/20 to-[#f85c5c]/10'
                      : 'bg-gradient-to-br from-[#EFA498]/10 to-[#F97272]/10'
                  }`} />
                  <div className={`relative h-full flex flex-col p-8 border-2 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl min-h-[280px] ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-900/80 hover:border-[#F97272] hover:shadow-[#F97272]/20'
                      : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-[#EFA498] hover:shadow-[#EFA498]/20'
                  }`}>
                    <div className={`w-14 h-14 border-2 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all flex-shrink-0 ${
                      theme === 'dark'
                        ? 'border-zinc-700 group-hover:border-[#F97272] group-hover:bg-[#F97272]/10'
                        : 'border-gray-300 group-hover:border-[#EFA498] group-hover:bg-[#EFA498]/10'
                    }`}>
                      <Icon className={`h-7 w-7 transition-colors ${
                        theme === 'dark'
                          ? 'text-zinc-400 group-hover:text-[#F97272]'
                          : 'text-gray-600 group-hover:text-[#EFA498]'
                      }`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-3 flex-shrink-0 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{feature.title}</h3>
                    <p className={`text-sm leading-relaxed flex-grow ${
                      theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                    }`}>{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-16">
            <Link to="/features">
              <button className={`text-white px-10 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 inline-flex items-center gap-2 shadow-lg ${
                theme === 'dark'
                  ? 'bg-[#F97272] hover:bg-[#f85c5c] shadow-[#F97272]/30'
                  : 'bg-[#EFA498] hover:bg-[#F97272] shadow-[#EFA498]/30'
              }`}>
                Try All Features
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section id="demo" className={`py-32 relative overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-[#F97272]' : 'bg-[#EFA498]'
      }`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 text-white leading-tight">
            See It In Action
          </h2>
          <p className="text-xl text-[#FDDAD6] mb-12 max-w-2xl mx-auto font-light">
            Generate your first AI-powered invoice in under 30 seconds.
          </p>
          <Link to="/demo">
            <button className="bg-black hover:bg-zinc-900 text-white px-12 py-5 rounded-full text-lg font-medium transition-all hover:scale-105 inline-flex items-center gap-3">
              <Play className="h-6 w-6" />
              Start Free Demo
            </button>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className={`py-32 relative overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-black' : 'bg-zinc-100'
      }`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMDMiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className={`text-5xl md:text-7xl font-bold mb-6 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              How It Works
            </h2>
            <p className={`text-xl font-light transition-colors ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              Three simple steps to automation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Select Country',
                description: 'Choose from USA, Germany, India, UK, or France for automatic compliance',
              },
              {
                step: '02',
                title: 'Enter Details',
                description: 'Add customer info and line items - AI handles tax calculations automatically',
              },
              {
                step: '03',
                title: 'Generate & Download',
                description: 'Get a perfectly formatted, country-specific PDF invoice in seconds',
              },
            ].map((step, idx) => (
              <div key={idx} className="group relative">
                <div className={`absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-[#F97272]/20 to-[#f85c5c]/10'
                    : 'bg-gradient-to-br from-[#EFA498]/10 to-[#F97272]/10'
                }`} />
                <div className={`relative border rounded-3xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 ${
                  theme === 'dark'
                    ? 'bg-zinc-950 border-zinc-800'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className={`text-7xl font-bold mb-6 opacity-50 group-hover:opacity-100 transition-opacity ${
                    theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
                  }`}>
                    {step.step}
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{step.title}</h3>
                  <p className={`leading-relaxed ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                  }`}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies - Horizontal Scrolling AWS Services */}
      <section id="tech" className={`py-32 relative overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className={`text-4xl md:text-6xl font-bold text-center mb-4 transition-colors ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Built with AWS
          </h2>
          <p className={`text-center text-lg transition-colors ${
            theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
          }`}>Powered by world-class cloud services</p>
        </div>
        
        <div className="relative">
          {/* Gradient overlays */}
          <div className={`absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none transition-colors ${
            theme === 'dark' ? 'bg-gradient-to-r from-zinc-950 to-transparent' : 'bg-gradient-to-r from-gray-100 to-transparent'
          }`} />
          <div className={`absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none transition-colors ${
            theme === 'dark' ? 'bg-gradient-to-l from-zinc-950 to-transparent' : 'bg-gradient-to-l from-gray-100 to-transparent'
          }`} />
          
          {/* Scrolling container */}
          <div className="flex gap-6 pb-8 px-4 sm:px-6 lg:px-8 animate-scroll will-change-transform">
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex gap-6 flex-shrink-0">
                {[
                  { name: 'Amazon Bedrock', desc: 'Foundation Models & AI', color: 'from-purple-500 to-pink-500', icon: Brain },
                  { name: 'AWS Lambda', desc: 'Serverless Computing', color: 'from-[#F97272] to-[#EFA498]', icon: Zap },
                  { name: 'Amazon DynamoDB', desc: 'NoSQL Database', color: 'from-blue-500 to-cyan-500', icon: Star },
                  { name: 'AWS Textract', desc: 'Document Analysis', color: 'from-green-500 to-emerald-500', icon: FileText },
                  { name: 'Amazon API Gateway', desc: 'API Management', color: 'from-indigo-500 to-purple-500', icon: Globe },
                  { name: 'AWS CDK', desc: 'Infrastructure as Code', color: 'from-yellow-500 to-[#EFA498]', icon: Sparkles },
                ].map((service, idx) => (
                  <div
                    key={idx}
                    className="min-w-[300px] md:min-w-[350px] flex-shrink-0 group"
                  >
                    <div className="relative h-[200px]">
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-20 group-hover:opacity-40 blur-2xl transition-opacity rounded-3xl`} />
                      
                      {/* Card */}
                      <div className={`relative h-full border-2 rounded-3xl p-6 transition-all group-hover:-translate-y-2 shadow-xl flex flex-col justify-between ${
                        theme === 'dark'
                          ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}>
                        <div>
                          <div className={`w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg`}>
                            <service.icon className="h-7 w-7 text-white" />
                          </div>
                          <h3 className={`text-xl font-bold mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>{service.name}</h3>
                          <p className={`text-sm ${
                            theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                          }`}>{service.desc}</p>
                        </div>
                        
                        {/* Progress bar */}
                        <div className={`h-1 w-full bg-gradient-to-r ${service.color} rounded-full opacity-50 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`py-32 relative overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-black' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-5xl md:text-7xl font-bold mb-6 transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Get In Touch
            </h2>
            <p className={`text-xl max-w-2xl mx-auto font-light transition-colors ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}>
              Have questions? We're here to help you get started with AI-powered invoicing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Email */}
            <div className="group relative">
              <div className={`absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                theme === 'dark'
                  ? 'bg-gradient-to-br from-[#F97272]/20 to-[#f85c5c]/10'
                  : 'bg-gradient-to-br from-[#EFA498]/10 to-[#F97272]/10'
              }`} />
              <div className={`relative border-2 rounded-3xl p-8 hover:-translate-y-1 transition-all text-center ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 hover:border-[#F97272]'
                  : 'bg-gray-50 border-gray-200 hover:border-[#EFA498]'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  theme === 'dark' ? 'bg-[#F97272]/10' : 'bg-[#EFA498]/10'
                }`}>
                  <Mail className={`w-8 h-8 ${
                    theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
                  }`} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Email Us</h3>
                <a href="mailto:saadilkal.10@gmail.com" className={`font-medium break-all ${
                  theme === 'dark' ? 'text-[#F97272] hover:text-[#f85c5c]' : 'text-[#EFA498] hover:text-[#F97272]'
                }`}>
                  saadilkal.10@gmail.com
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`relative border-2 rounded-3xl p-8 hover:-translate-y-1 transition-all text-center ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 hover:border-blue-500'
                  : 'bg-gray-50 border-gray-200 hover:border-blue-300'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  theme === 'dark' ? 'bg-blue-950' : 'bg-blue-100'
                }`}>
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Call Us</h3>
                <a href="tel:+918792204995" className="text-blue-600 hover:text-blue-700 font-medium">
                  +91 8792204995
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`relative border-2 rounded-3xl p-8 hover:-translate-y-1 transition-all text-center ${
                theme === 'dark'
                  ? 'bg-zinc-950 border-zinc-800 hover:border-green-500'
                  : 'bg-gray-50 border-gray-200 hover:border-green-300'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  theme === 'dark' ? 'bg-green-950' : 'bg-green-100'
                }`}>
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Location</h3>
                <p className={`font-medium ${
                  theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  India
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 bg-gray-900 relative overflow-hidden">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#EFA498]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12">
            <Logo className="justify-center text-white" size="lg" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
            Ready to Automate?
          </h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light">
            Join businesses worldwide using AI to save time
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/demo">
              <button className={`text-white px-12 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 shadow-lg ${
                theme === 'dark'
                  ? 'bg-[#F97272] hover:bg-[#f85c5c] shadow-[#F97272]/30'
                  : 'bg-[#EFA498] hover:bg-[#F97272] shadow-[#EFA498]/30'
              }`}>
                Try Demo Now
              </button>
            </Link>
            <Link to="/features">
              <button className="border-2 border-white/20 hover:border-white/40 text-white px-12 py-4 rounded-full text-lg font-medium transition-all hover:scale-105">
                Explore Features
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gray-800 border-y border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#F97272] to-[#f85c5c] mb-6">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Get the latest updates on AI-powered invoicing features and industry insights
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-[#F97272] focus:bg-white/10 transition-all"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-[#F97272] to-[#f85c5c] hover:from-[#f85c5c] hover:to-[#e64545] text-white px-8 py-4 rounded-full font-medium transition-all hover:scale-105 whitespace-nowrap shadow-lg shadow-[#F97272]/30"
            >
              Subscribe
            </button>
          </form>
          
          <p className="text-sm text-gray-500 mt-4">
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-white/10 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Logo className="mb-4 text-white" size="sm" />
              <p className="text-sm text-gray-500">
                AI-powered invoice automation
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/demo" className="hover:text-white transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Technologies</h4>
              <ul className="space-y-3 text-sm">
                <li className="hover:text-white transition-colors cursor-default">Amazon Bedrock</li>
                <li className="hover:text-white transition-colors cursor-default">AWS Lambda</li>
                <li className="hover:text-white transition-colors cursor-default">AWS Textract</li>
                <li className="hover:text-white transition-colors cursor-default">DynamoDB</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Countries</h4>
              <ul className="space-y-3 text-sm">
                <li>🇺🇸 United States</li>
                <li>🇩🇪 Germany</li>
                <li>🇮🇳 India</li>
                <li>🇬🇧 United Kingdom</li>
                <li>🇫🇷 France</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">&copy; 2025 Invoisaic. Built for AWS Hackathon.</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#EFA498] rounded-full animate-pulse" />
              <span className="text-sm text-gray-500">Powered by Amazon Bedrock</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
