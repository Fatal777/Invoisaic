import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, Upload, CheckCircle, Layers, BarChart3, 
  Zap, Brain, Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import InvoiceBuilder from '../components/features/InvoiceBuilder';
import InvoiceValidator from '../components/features/InvoiceValidator';
import ProductCategorizer from '../components/features/ProductCategorizer';
import InvoiceReconciler from '../components/features/InvoiceReconciler';
import OCRExtractor from '../components/features/OCRExtractor';
import BulkGenerator from '../components/features/BulkGenerator';

type FeatureTab = 'builder' | 'validator' | 'categorizer' | 'reconciler' | 'ocr' | 'bulk';

export default function Features() {
  const [activeFeature, setActiveFeature] = useState<FeatureTab>('builder');

  const features = [
    {
      id: 'builder' as FeatureTab,
      name: 'Interactive Invoice Builder',
      description: 'AI-guided step-by-step invoice creation',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Most Popular',
    },
    {
      id: 'validator' as FeatureTab,
      name: 'Invoice Validation Engine',
      description: 'Validate compliance & detect errors with AI',
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
      badge: 'AI-Powered',
    },
    {
      id: 'categorizer' as FeatureTab,
      name: 'Product Categorization',
      description: 'Auto-detect tax categories & HSN codes',
      icon: Layers,
      color: 'from-purple-500 to-pink-500',
      badge: 'Smart',
    },
    {
      id: 'reconciler' as FeatureTab,
      name: 'Smart Reconciliation',
      description: 'Match payments to invoices automatically',
      icon: BarChart3,
      color: 'from-orange-500 to-[#EFA498]',
      badge: 'Automated',
    },
    {
      id: 'ocr' as FeatureTab,
      name: 'OCR Invoice Extraction',
      description: 'Extract data from PDF/image invoices',
      icon: Upload,
      color: 'from-indigo-500 to-blue-500',
      badge: 'Textract',
    },
    {
      id: 'bulk' as FeatureTab,
      name: 'Bulk Invoice Generation',
      description: 'Generate 100+ invoices in seconds',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      badge: 'High-Speed',
    },
  ];

  const renderFeature = () => {
    switch (activeFeature) {
      case 'builder':
        return <InvoiceBuilder />;
      case 'validator':
        return <InvoiceValidator />;
      case 'categorizer':
        return <ProductCategorizer />;
      case 'reconciler':
        return <InvoiceReconciler />;
      case 'ocr':
        return <OCRExtractor />;
      case 'bulk':
        return <BulkGenerator />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar variant="dark" />

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm px-4 py-2 mb-4">
            <Brain className="h-4 w-4 inline mr-2" />
            AI-Powered Features
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Invoisaic Advanced Features
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore our comprehensive suite of AI-powered invoice management tools
          </p>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Built with Amazon Bedrock Nova Micro for blazing-fast performance.
          </p>
        </div>

        {/* Feature Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeFeature === feature.id;
            
            return (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-[#FEF5F4]0 bg-white/10 shadow-lg shadow-[#F97272]/20 transform scale-105'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge 
                    variant={isActive ? 'default' : 'outline'}
                    className={`text-xs ${isActive ? 'bg-[#F97272]' : 'border-white/20 text-gray-400'}`}
                  >
                    {feature.badge}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-2 text-white">{feature.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{feature.description}</p>
                {isActive && (
                  <div className="flex items-center text-[#EFA498] text-sm font-medium">
                    <Sparkles className="h-4 w-4 mr-1" />
                    Active
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Feature Demo */}
        <Card className="border-2 border-blue-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const feature = features.find(f => f.id === activeFeature);
                  const Icon = feature?.icon || FileText;
                  return <Icon className="h-6 w-6 text-blue-600" />;
                })()}
                <CardTitle className="text-2xl">
                  {features.find(f => f.id === activeFeature)?.name}
                </CardTitle>
              </div>
              <Badge className="bg-blue-600">
                Live Demo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {renderFeature()}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">6</div>
            <div className="text-sm text-gray-600">AI Features</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">98%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-purple-600">&lt;2s</div>
            <div className="text-sm text-gray-600">Avg Processing</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-orange-600">5</div>
            <div className="text-sm text-gray-600">Countries</div>
          </div>
        </div>
      </div>
    </div>
  );
}
