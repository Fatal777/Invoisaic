/**
 * Onboarding Demo - Main Component
 * Production-ready company onboarding and GST invoice generation
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Building2, Package, FileText, Settings as SettingsIcon,
  CheckCircle, Loader2, Download, Plus, Save
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Import modular components
import { OnboardingStepType, Company, Product, Customer } from './onboarding/types';
import { 
  DEMO_PRODUCTS, 
  DEMO_CUSTOMERS, 
  ONBOARDING_STEPS, 
  INDIAN_STATES,
  BUSINESS_TYPES,
  INDUSTRIES,
  PRODUCT_CATEGORIES,
  UNITS,
  GST_RATES
} from './onboarding/data';
import { 
  useCompany, 
  useProductCatalog, 
  useInvoiceBuilder, 
  useInvoiceGeneration,
  useOnboardingLogger 
} from './onboarding/hooks';
import { 
  CompanyCard, 
  ProductCard, 
  InvoiceItemCard, 
  InvoicePreview,
  ProgressSteps,
  LogEntryCard,
  EmptyState
} from './onboarding/components';

export default function OnboardingDemo() {
  const navigate = useNavigate();
  
  // State management
  const [currentStep, setCurrentStep] = useState<OnboardingStepType>('company');
  const [showProductForm, setShowProductForm] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<Partial<Customer>>({
    name: '',
    type: 'b2b',
    address: { street: '', city: '', state: 'Karnataka', zipCode: '', country: 'India' },
    contact: { email: '', phone: '' }
  });

  // Invoice formatting settings
  const [invoiceFormatting, setInvoiceFormatting] = useState({
    template: 'modern' as 'modern' | 'classic' | 'minimal',
    accentColor: '#dc2626' as string,
    showLogo: true,
    showBankDetails: false,
    showTerms: true,
    showNotes: false,
    currency: 'INR',
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    notes: '',
    terms: 'Payment due within 30 days',
    bankName: '',
    accountNumber: '',
    ifscCode: ''
  });

  // Custom hooks
  const { 
    company, 
    isValidating, 
    validationErrors, 
    validateGSTIN, 
    saveCompany 
  } = useCompany();

  const { 
    products, 
    addProduct, 
    removeProduct, 
    importProducts,
    productCount 
  } = useProductCatalog();

  const { 
    items, 
    addItem, 
    updateItemQuantity, 
    removeItem, 
    clearItems,
    calculateTax,
    itemCount 
  } = useInvoiceBuilder();

  const { 
    isGenerating, 
    generatedInvoice, 
    generateInvoice 
  } = useInvoiceGeneration();

  const { logs, addLog, clearLogs } = useOnboardingLogger();

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    name: '',
    gstin: '',
    pan: '',
    street: '',
    city: '',
    state: 'Karnataka',
    zipCode: '',
    email: '',
    phone: '',
    businessType: 'private_limited' as const,
    industry: 'Technology & Software'
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    hsn: '',
    category: 'Software & IT Services',
    unit: 'pcs' as const,
    price: 0,
    gst: 18,
    isService: true,
    sku: ''
  });

  // Progress steps
  const progressSteps = [
    { id: 'company', title: 'Company', status: currentStep === 'company' ? 'current' as const : company ? 'completed' as const : 'pending' as const },
    { id: 'products', title: 'Products', status: currentStep === 'products' ? 'current' as const : productCount > 0 ? 'completed' as const : 'pending' as const },
    { id: 'invoice', title: 'Invoice', status: currentStep === 'invoice' ? 'current' as const : generatedInvoice ? 'completed' as const : 'pending' as const }
  ];

  // Event handlers
  const handleCompanySubmit = async () => {
    if (!companyForm.name || !companyForm.gstin) {
      addLog('error', 'company', 'Please fill all required fields');
      return;
    }

    addLog('info', 'company', 'Validating GSTIN...');
    const validation = await validateGSTIN(companyForm.gstin);

    if (!validation.isValid) {
      addLog('error', 'validation', 'Invalid GSTIN', validation.errors?.join(', '));
      return;
    }

    const companyData: Company = {
      name: companyForm.name,
      gstin: companyForm.gstin,
      address: {
        street: companyForm.street,
        city: companyForm.city,
        state: companyForm.state,
        zipCode: companyForm.zipCode,
        country: 'India'
      },
      contact: {
        email: companyForm.email,
        phone: companyForm.phone
      },
      tax: {
        gstin: companyForm.gstin,
        pan: companyForm.pan,
        taxType: 'regular'
      },
      business: {
        type: companyForm.businessType,
        industry: companyForm.industry
      },
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (saveCompany(companyData)) {
      addLog('success', 'company', 'Company registered successfully', validation.businessName);
      setCurrentStep('products');
    }
  };

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.hsn || productForm.price <= 0) {
      addLog('error', 'product', 'Please fill all required fields');
      return;
    }

    const result = addProduct({
      ...productForm,
      sku: productForm.sku || `SKU-${Date.now()}`,
      isActive: true,
      tags: []
    });

    if (result.success) {
      addLog('success', 'product', `Added ${productForm.name} to catalog`);
      setProductForm({
        name: '',
        description: '',
        hsn: '',
        category: 'Software & IT Services',
        unit: 'pcs',
        price: 0,
        gst: 18,
        isService: true,
        sku: ''
      });
      setShowProductForm(false);
    } else {
      addLog('error', 'product', 'Failed to add product', result.error);
    }
  };

  const handleImportDemoProducts = () => {
    const count = importProducts(DEMO_PRODUCTS);
    addLog('success', 'product', `Imported ${count} demo products`);
  };

  const handleGenerateInvoice = async () => {
    if (!company) {
      addLog('error', 'invoice', 'Company details not found');
      return;
    }

    if (itemCount === 0) {
      addLog('error', 'invoice', 'Please add items to the invoice');
      return;
    }

    if (!customerInfo.name) {
      addLog('error', 'invoice', 'Please enter customer name');
      return;
    }

    const customer: Customer = {
      name: customerInfo.name,
      gstin: customerInfo.gstin,
      type: customerInfo.type || 'b2b',
      address: customerInfo.address as Customer['address'],
      contact: customerInfo.contact as Customer['contact'],
      verified: false
    };

    const taxCalc = calculateTax();

    addLog('info', 'invoice', 'Generating GST invoice...');
    const result = await generateInvoice(company, customer, items, taxCalc);

    if (result.success) {
      addLog('success', 'invoice', 'Invoice generated successfully', result.data?.invoiceNumber);
      setCurrentStep('invoice');
    } else {
      addLog('error', 'invoice', 'Failed to generate invoice', result.error);
    }
  };

  const handleReset = () => {
    setCurrentStep('company');
    clearItems();
    clearLogs();
    setCustomerInfo({
      name: '',
      type: 'b2b',
      address: { street: '', city: '', state: 'Karnataka', zipCode: '', country: 'India' },
      contact: { email: '', phone: '' }
    });
  };

  const handleDownloadPDF = async () => {
    if (!generatedInvoice) return;

    try {
      addLog('info', 'system', 'Generating PDF...');

      // Find the invoice preview element
      const invoiceElement = document.querySelector('[data-invoice-preview]') as HTMLElement;
      if (!invoiceElement) {
        addLog('error', 'system', 'Invoice preview not found');
        return;
      }

      // Capture the invoice as canvas with optimized settings for smaller file size
      const canvas = await html2canvas(invoiceElement, {
        scale: 1.2, // Reduced from 2 for smaller file size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculate PDF dimensions (A4 size)
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add image to PDF using JPEG for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG with 85% quality
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      // Download the PDF
      pdf.save(`${generatedInvoice.invoiceNumber || 'invoice'}.pdf`);

      addLog('success', 'system', `PDF downloaded: ${generatedInvoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      addLog('error', 'system', 'Failed to generate PDF');
    }
  };

  const taxCalc = calculateTax();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 border-b border-gray-800 bg-black/95 backdrop-blur-xl"
      >
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/demo')}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F97272] rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Company Onboarding</h1>
                  <p className="text-xs text-gray-500">GST Invoice Generation</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-3 py-1.5 bg-[#F97272] rounded-lg text-xs font-bold">
                LIVE DEMO
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="border-b border-gray-800 bg-gray-950">
        <div className="max-w-[1800px] mx-auto px-8 py-6">
          <ProgressSteps steps={progressSteps} />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Company Step */}
          {currentStep === 'company' && (
            <motion.div
              key="company"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="max-w-4xl mx-auto"
            >
              {company ? (
                <div className="space-y-6">
                  <CompanyCard company={company} verified />
                  <button
                    onClick={() => setCurrentStep('products')}
                    className="w-full px-6 py-4 bg-[#F97272] hover:bg-[#f85c5c] rounded-lg font-bold transition-colors"
                  >
                    Continue to Products
                  </button>
                </div>
              ) : (
                <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                  <h2 className="text-2xl font-bold mb-6">Company Registration</h2>
                  
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Company Name *</label>
                        <input
                          type="text"
                          value={companyForm.name}
                          onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          placeholder="Tech Solutions Pvt Ltd"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">GSTIN *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={companyForm.gstin}
                            onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })}
                            className="flex-1 px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none font-mono"
                            placeholder="29ABCDE1234F1Z5"
                            maxLength={15}
                          />
                          <button
                            onClick={() => setCompanyForm({ ...companyForm, gstin: '29ABCDE1234F1Z5' })}
                            className="px-4 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold transition-colors"
                          >
                            Mock
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Business Type</label>
                        <select
                          value={companyForm.businessType}
                          onChange={(e) => setCompanyForm({ ...companyForm, businessType: e.target.value as any })}
                          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                        >
                          {BUSINESS_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">Industry</label>
                        <select
                          value={companyForm.industry}
                          onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                        >
                          {INDUSTRIES.map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Address</label>
                      <input
                        type="text"
                        value={companyForm.street}
                        onChange={(e) => setCompanyForm({ ...companyForm, street: e.target.value })}
                        className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                        placeholder="Street Address"
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <input
                          type="text"
                          value={companyForm.city}
                          onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <select
                          value={companyForm.state}
                          onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                        >
                          {INDIAN_STATES.map(state => (
                            <option key={state.code} value={state.name}>{state.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={companyForm.zipCode}
                          onChange={(e) => setCompanyForm({ ...companyForm, zipCode: e.target.value })}
                          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          placeholder="ZIP Code"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Email</label>
                        <input
                          type="email"
                          value={companyForm.email}
                          onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          placeholder="company@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Phone</label>
                        <input
                          type="tel"
                          value={companyForm.phone}
                          onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          placeholder="+91 1234567890"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCompanySubmit}
                      disabled={isValidating}
                      className="w-full px-6 py-4 bg-[#F97272] hover:bg-[#f85c5c] disabled:bg-gray-800 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Save & Continue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Products Step */}
          {currentStep === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Product Catalog ({productCount})</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleImportDemoProducts}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold transition-colors"
                      >
                        Import Demo
                      </button>
                      <button
                        onClick={() => setShowProductForm(!showProductForm)}
                        className="px-4 py-2 bg-[#F97272] hover:bg-[#f85c5c] rounded-lg font-semibold transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Product
                      </button>
                    </div>
                  </div>

                  {showProductForm && (
                    <div className="mb-6 p-6 bg-gray-950 border border-gray-800 rounded-xl">
                      <h3 className="font-bold mb-4">Add New Product</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg"
                            placeholder="Product Name"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={productForm.hsn}
                            onChange={(e) => setProductForm({ ...productForm, hsn: e.target.value })}
                            className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg"
                            placeholder="HSN/SAC Code"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                            className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg"
                            placeholder="Price"
                          />
                        </div>
                        <div>
                          <select
                            value={productForm.gst}
                            onChange={(e) => setProductForm({ ...productForm, gst: Number(e.target.value) })}
                            className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg"
                          >
                            {GST_RATES.map(rate => (
                              <option key={rate} value={rate}>{rate}% GST</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={productForm.unit}
                            onChange={(e) => setProductForm({ ...productForm, unit: e.target.value as any })}
                            className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg"
                          >
                            {UNITS.map(unit => (
                              <option key={unit.value} value={unit.value}>{unit.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2 flex gap-3">
                          <button
                            onClick={handleAddProduct}
                            className="flex-1 px-4 py-3 bg-[#F97272] hover:bg-[#f85c5c] rounded-lg font-semibold"
                          >
                            Add Product
                          </button>
                          <button
                            onClick={() => setShowProductForm(false)}
                            className="px-4 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {products.length === 0 ? (
                    <EmptyState
                      icon={<Package className="w-16 h-16" />}
                      title="No products added"
                      description="Add products to your catalog or import demo products"
                      action={
                        <button
                          onClick={handleImportDemoProducts}
                          className="px-6 py-3 bg-[#F97272] hover:bg-[#f85c5c] rounded-lg font-semibold"
                        >
                          Import Demo Products
                        </button>
                      }
                    />
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {products.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onDelete={removeProduct}
                          onAddToInvoice={addItem}
                          inInvoice={items.some(item => item.product.id === product.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:sticky lg:top-24 h-fit">
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-xl font-bold mb-4">Invoice Items ({itemCount})</h3>
                    
                    {itemCount === 0 ? (
                      <div className="text-center py-8 text-gray-600">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No items added</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                          {items.map(item => (
                            <InvoiceItemCard
                              key={item.id}
                              item={item}
                              onUpdateQuantity={updateItemQuantity}
                              onRemove={removeItem}
                            />
                          ))}
                        </div>

                        <div className="border-t border-gray-800 pt-4 space-y-2 text-sm mb-6">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Subtotal</span>
                            <span>₹{taxCalc.subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">CGST</span>
                            <span>₹{taxCalc.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">SGST</span>
                            <span>₹{taxCalc.sgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-800">
                            <span>Total</span>
                            <span className="text-[#F97272]">₹{taxCalc.total.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <input
                            type="text"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            className="w-full px-4 py-3 bg-black border border-gray-800 rounded-lg"
                            placeholder="Customer Name *"
                          />
                        </div>

                        <button
                          onClick={handleGenerateInvoice}
                          disabled={isGenerating}
                          className="w-full px-6 py-4 bg-[#F97272] hover:bg-[#f85c5c] disabled:bg-gray-800 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="w-5 h-5" />
                              Generate Invoice
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Invoice Step */}
          {currentStep === 'invoice' && generatedInvoice && (
            <motion.div
              key="invoice"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="max-w-6xl mx-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Generated Invoice</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFormatting(!showFormatting)}
                    className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold flex items-center gap-2"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    {showFormatting ? 'Hide' : 'Show'} Formatting
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold"
                  >
                    Create New Invoice
                  </button>
                </div>
              </div>

              {/* Formatting Options Panel */}
              {showFormatting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gray-950 border border-gray-800 rounded-xl p-6 mb-6"
                >
                  <h3 className="text-lg font-bold mb-4">Invoice Formatting Options</h3>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Template Selection */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Template</label>
                      <select
                        value={invoiceFormatting.template}
                        onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, template: e.target.value as any })}
                        className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>

                    {/* Accent Color */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Accent Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={invoiceFormatting.accentColor}
                          onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, accentColor: e.target.value })}
                          className="w-16 h-10 bg-black border border-gray-800 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={invoiceFormatting.accentColor}
                          onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, accentColor: e.target.value })}
                          className="flex-1 px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none font-mono text-sm"
                          placeholder="#dc2626"
                        />
                      </div>
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Currency</label>
                      <select
                        value={invoiceFormatting.currency}
                        onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, currency: e.target.value })}
                        className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Date Format</label>
                      <select
                        value={invoiceFormatting.dateFormat}
                        onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, dateFormat: e.target.value })}
                        className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Language</label>
                      <select
                        value={invoiceFormatting.language}
                        onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, language: e.target.value })}
                        className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invoiceFormatting.showLogo}
                        onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, showLogo: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-800 bg-black text-[#F97272] focus:ring-[#F97272]"
                      />
                      <span className="text-sm">Show Logo</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invoiceFormatting.showBankDetails}
                        onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, showBankDetails: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-800 bg-black text-[#F97272] focus:ring-[#F97272]"
                      />
                      <span className="text-sm">Show Bank Details</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invoiceFormatting.showTerms}
                        onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, showTerms: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-800 bg-black text-[#F97272] focus:ring-[#F97272]"
                      />
                      <span className="text-sm">Show Terms</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={invoiceFormatting.showNotes}
                        onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, showNotes: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-800 bg-black text-[#F97272] focus:ring-[#F97272]"
                      />
                      <span className="text-sm">Show Notes</span>
                    </label>
                  </div>

                  {/* Bank Details */}
                  {invoiceFormatting.showBankDetails && (
                    <div className="grid md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={invoiceFormatting.bankName}
                          onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, bankName: e.target.value })}
                          className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          placeholder="State Bank of India"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">Account Number</label>
                        <input
                          type="text"
                          value={invoiceFormatting.accountNumber}
                          onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, accountNumber: e.target.value })}
                          className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">IFSC Code</label>
                        <input
                          type="text"
                          value={invoiceFormatting.ifscCode}
                          onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, ifscCode: e.target.value })}
                          className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          placeholder="SBIN0001234"
                        />
                      </div>
                    </div>
                  )}

                  {/* Terms & Notes */}
                  <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
                    {invoiceFormatting.showTerms && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">Terms & Conditions</label>
                        <textarea
                          value={invoiceFormatting.terms}
                          onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, terms: e.target.value })}
                          className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          rows={3}
                          placeholder="Payment due within 30 days"
                        />
                      </div>
                    )}
                    {invoiceFormatting.showNotes && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">Notes</label>
                        <textarea
                          value={invoiceFormatting.notes}
                          onChange={(e) => setInvoiceFormatting({ ...invoiceFormatting, notes: e.target.value })}
                          className="w-full px-4 py-2 bg-black border border-gray-800 rounded-lg focus:border-[#F97272] focus:outline-none"
                          rows={3}
                          placeholder="Thank you for your business!"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              <InvoicePreview
                invoice={generatedInvoice}
                formatting={invoiceFormatting}
                onDownload={handleDownloadPDF}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logs Panel */}
        {logs.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">Activity Logs</h3>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="bg-black border border-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                {logs.map(log => (
                  <LogEntryCard key={log.id} log={log} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
