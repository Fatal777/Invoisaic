/**
 * E-commerce Demo - Main Component
 * Production-ready e-commerce demo with modular architecture
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, Check, CreditCard, Package,
  Download, Star, Filter, Search, Grid, List
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Import modular components
import { DemoStep, Product, Customer, Order, ShippingOption, PaymentMethod } from './ecommerce/types';
import { DEMO_PRODUCTS, SHIPPING_OPTIONS, PAYMENT_METHODS, CATEGORIES, SORT_OPTIONS } from './ecommerce/data';
import { useCart, useCoupons, useLogger, useAPI, useAnalytics } from './ecommerce/hooks';
import { 
  ProductCard, 
  CartItemComponent, 
  LogEntryComponent, 
  ShippingOptionComponent,
  PaymentMethodComponent,
  ProgressBar,
  LoadingSpinner,
  Badge,
  EmptyState
} from './ecommerce/components';

export default function EcommerceDemo() {
  const navigate = useNavigate();
  
  // State management
  const [currentStep, setCurrentStep] = useState<DemoStep>('shopping');
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    }
  });
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [sortBy, setSortBy] = useState('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Shipping and payment
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  
  // Processing state
  const [processingProgress, setProcessingProgress] = useState(0);
  const [invoice, setInvoice] = useState<any>(null);

  // Custom hooks
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount, isInCart, getCartItem } = useCart();
  const { appliedCoupon, couponCode, couponError, isValidating, applyCoupon, removeCoupon, calculateDiscount } = useCoupons();
  const { logs, addLog, clearLogs } = useLogger();
  const { isLoading, error, processOrder } = useAPI();
  const { trackEvent, trackPageView, trackPurchase } = useAnalytics();

  // Calculations
  const subtotal = getCartTotal();
  const discount = calculateDiscount(subtotal);
  const shipping = selectedShipping?.cost || 0;
  const tax = (subtotal - discount + shipping) * 0.18;
  const total = subtotal - discount + shipping + tax;

  // Filter and sort products
  const filteredProducts = DEMO_PRODUCTS
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All Products' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        default: return 0;
      }
    });

  // Step navigation
  const steps: { key: DemoStep; label: string; icon: React.ReactNode }[] = [
    { key: 'shopping', label: 'Shopping', icon: <ShoppingCart className="w-4 h-4" /> },
    { key: 'cart', label: 'Cart', icon: <Package className="w-4 h-4" /> },
    { key: 'checkout', label: 'Checkout', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'processing', label: 'Processing', icon: <LoadingSpinner size="sm" /> },
    { key: 'complete', label: 'Complete', icon: <Check className="w-4 h-4" /> }
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  // Event handlers
  const handleAddToCart = (product: Omit<Product, 'quantity'>) => {
    addToCart(product);
    trackEvent('add_to_cart', 'ecommerce', { product_id: product.id, product_name: product.name });
    addLog('success', 'order', `Added ${product.name} to cart`);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      addLog('error', 'order', 'Cart is empty');
      return;
    }
    setCurrentStep('checkout');
    trackEvent('begin_checkout', 'ecommerce', { cart_value: total });
  };

  const handlePlaceOrder = async () => {
    if (!customer.name || !customer.email || !selectedShipping || !selectedPayment) {
      addLog('error', 'order', 'Please fill all required fields');
      return;
    }

    setCurrentStep('processing');
    clearLogs();
    
    // Simulate processing steps
    const processingSteps = [
      { progress: 10, message: '🛒 Order received', category: 'order' as const },
      { progress: 25, message: '💳 Processing payment', category: 'payment' as const },
      { progress: 40, message: '✅ Payment confirmed', category: 'payment' as const },
      { progress: 55, message: '📡 Sending webhook to backend', category: 'system' as const },
      { progress: 70, message: '🤖 AI agent received webhook', category: 'ai' as const },
      { progress: 85, message: '🧠 Generating invoice with Bedrock', category: 'ai' as const },
      { progress: 100, message: '🎉 Order complete!', category: 'order' as const }
    ];

    for (const step of processingSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProcessingProgress(step.progress);
      addLog('info', step.category, step.message);
    }

    // Call real backend
    try {
      const order: Partial<Order> = {
        id: `ORD-${Date.now()}`,
        customer,
        items: cart,
        pricing: { subtotal, discount, shipping, tax, total }
      };

      const result = await processOrder(order);
      
      if (result.success) {
        setInvoice(result.data);
        addLog('success', 'system', 'Backend integration successful');
        trackPurchase(order as Order);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (err) {
      addLog('error', 'system', 'Using demo mode', (err as Error).message);
      // Fallback demo invoice
      setInvoice({
        invoiceNumber: `INV-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        customer,
        items: cart,
        total
      });
    }

    setCurrentStep('complete');
  };

  const resetDemo = () => {
    setCurrentStep('shopping');
    clearCart();
    setCustomer({
      name: '', email: '', phone: '',
      address: { street: '', city: '', state: '', zipCode: '', country: 'India' }
    });
    setSelectedShipping(null);
    setSelectedPayment(null);
    setInvoice(null);
    clearLogs();
    setProcessingProgress(0);
    removeCoupon();
  };

  const handleDownloadInvoice = async () => {
    if (!invoice) return;

    try {
      addLog('info', 'system', 'Generating PDF...');

      // Create a temporary container with invoice content
      const invoiceContent = document.createElement('div');
      invoiceContent.style.position = 'absolute';
      invoiceContent.style.left = '-9999px';
      invoiceContent.style.width = '800px';
      invoiceContent.style.background = 'white';
      invoiceContent.style.padding = '40px';

      // Build invoice HTML
      invoiceContent.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #000;">
          <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #dc2626;">
            <h1 style="color: #dc2626; font-size: 36px; margin: 0;">INVOICE</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Order Confirmation</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
            <div>
              <div style="font-size: 10px; color: #666; margin-bottom: 8px;">INVOICE TO:</div>
              <div style="font-weight: bold; font-size: 18px; margin-bottom: 4px;">${customer.name}</div>
              <div style="font-size: 14px; color: #666;">
                ${customer.address.street}<br />
                ${customer.address.city}, ${customer.address.state}<br />
                ${customer.address.zipCode}
              </div>
              <div style="font-size: 14px; color: #666; margin-top: 8px;">
                ${customer.email}<br />
                ${customer.phone}
              </div>
            </div>

            <div style="text-align: right;">
              <div style="margin-bottom: 16px;">
                <div style="font-size: 10px; color: #666; margin-bottom: 4px;">INVOICE NUMBER</div>
                <div style="font-weight: bold; font-size: 20px;">${invoice.invoiceNumber}</div>
              </div>
              <div style="margin-bottom: 16px;">
                <div style="font-size: 10px; color: #666; margin-bottom: 4px;">INVOICE DATE</div>
                <div style="font-weight: 600;">${invoice.date}</div>
              </div>
              <div>
                <div style="font-size: 10px; color: #666; margin-bottom: 4px;">PAYMENT METHOD</div>
                <div style="font-weight: 600;">${selectedPayment?.name || 'N/A'}</div>
              </div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #ddd;">
                <th style="text-align: left; padding: 12px 0; font-size: 12px;">ITEM</th>
                <th style="text-align: center; padding: 12px 0; font-size: 12px;">QTY</th>
                <th style="text-align: right; padding: 12px 0; font-size: 12px;">PRICE</th>
                <th style="text-align: right; padding: 12px 0; font-size: 12px;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px 0;">
                    <div style="font-weight: 600;">${item.name}</div>
                  </td>
                  <td style="text-align: center; padding: 12px 0;">${item.quantity}</td>
                  <td style="text-align: right; padding: 12px 0;">₹${item.price.toLocaleString()}</td>
                  <td style="text-align: right; padding: 12px 0; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
            <div style="width: 300px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
                <span style="color: #666;">Subtotal:</span>
                <span style="font-weight: 600;">₹${subtotal.toLocaleString()}</span>
              </div>
              ${discount > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #10b981;">
                  <span>Discount:</span>
                  <span style="font-weight: 600;">-₹${discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
                <span style="color: #666;">Shipping:</span>
                <span style="font-weight: 600;">${shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px;">
                <span style="color: #666;">Tax (18%):</span>
                <span style="font-weight: 600;">₹${tax.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 16px 0 8px 0; border-top: 2px solid #dc2626; font-size: 20px; font-weight: bold;">
                <span>TOTAL:</span>
                <span style="color: #dc2626;">₹${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 10px; color: #666; margin-bottom: 4px;">PAYMENT TERMS</div>
            <div style="font-size: 14px;">Thank you for your purchase! Payment has been confirmed.</div>
          </div>

          <div style="border-top: 2px solid #dc2626; padding-top: 20px; font-size: 12px; color: #666; text-align: center;">
            <p style="margin: 0;">This is an automated invoice generated by Invoisaic</p>
            <p style="margin: 8px 0 0 0;">For any queries, please contact support</p>
          </div>
        </div>
      `;

      document.body.appendChild(invoiceContent);

      // Convert to canvas with optimized settings for smaller file size
      const canvas = await html2canvas(invoiceContent, {
        scale: 1.2, // Reduced from 2 for smaller file size
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Remove temporary element
      document.body.removeChild(invoiceContent);

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add image using JPEG for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG with 85% quality
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      // Download
      pdf.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);

      addLog('success', 'system', `PDF downloaded: ${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      addLog('error', 'system', 'Failed to generate PDF');
    }
  };

  // Track page view
  useEffect(() => {
    trackPageView('ecommerce-demo');
  }, [trackPageView]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm"
      >
        <div className="max-w-[1800px] mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/demo')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F97272] rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">E-Commerce Demo</h1>
                  <p className="text-xs text-gray-600">Autonomous Invoice Generation</p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentStep === step.key 
                      ? 'bg-[#F97272] text-white' 
                      : index < currentStepIndex 
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.icon}
                    <span className="hidden lg:block">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-300" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Cart Badge */}
            {currentStep === 'shopping' && (
              <button
                onClick={() => setCurrentStep('cart')}
                className="relative px-6 py-2 bg-[#F97272] hover:bg-[#f85c5c] text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {getCartItemCount() > 0 && (
                  <Badge variant="success" size="sm">
                    {getCartItemCount()}
                  </Badge>
                )}
              </button>
            )}

            <Badge variant="error" size="md">LIVE DEMO</Badge>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Shopping Step */}
          {currentStep === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="space-y-6"
            >
              {/* Filters and Search */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none w-64 text-gray-900"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#F97272] text-white' : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#F97272] text-white' : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <EmptyState
                  icon={<Search className="w-16 h-16" />}
                  title="No products found"
                  description="Try adjusting your search or filters"
                />
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      isInCart={isInCart(product.id)}
                      cartQuantity={getCartItem(product.id)?.quantity}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Cart Step */}
          {currentStep === 'cart' && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-sm text-gray-500 hover:text-[#EFA498] transition-colors"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingCart className="w-16 h-16" />}
                    title="Your cart is empty"
                    description="Add some products to get started"
                    action={
                      <button
                        onClick={() => setCurrentStep('shopping')}
                        className="px-6 py-3 bg-[#F97272] hover:bg-[#f85c5c] rounded-lg font-semibold transition-colors"
                      >
                        Continue Shopping
                      </button>
                    }
                  />
                ) : (
                  <>
                    <div className="space-y-4 mb-8">
                      {cart.map(item => (
                        <CartItemComponent
                          key={item.id}
                          item={item}
                          onUpdateQuantity={updateQuantity}
                          onRemove={removeFromCart}
                        />
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="border-t border-gray-300 pt-6">
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal ({getCartItemCount()} items)</span>
                          <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-500">
                            <span>Discount</span>
                            <span>-₹{discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-400">
                          <span>Shipping</span>
                          <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Tax (18%)</span>
                          <span>₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-300 flex justify-between text-2xl font-bold text-gray-900">
                          <span>Total</span>
                          <span className="text-[#F97272]">₹{total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setCurrentStep('shopping')}
                          className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold transition-colors text-gray-900"
                        >
                          Continue Shopping
                        </button>
                        <button
                          onClick={handleProceedToCheckout}
                          className="flex-1 px-6 py-4 bg-[#F97272] hover:bg-[#f85c5c] text-white rounded-lg font-semibold transition-colors"
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Checkout Step */}
          {currentStep === 'checkout' && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Customer Info Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Customer Information</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Full Name *</label>
                        <input
                          type="text"
                          value={customer.name}
                          onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Email *</label>
                        <input
                          type="email"
                          value={customer.email}
                          onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Phone *</label>
                        <input
                          type="tel"
                          value={customer.phone}
                          onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Street Address *</label>
                        <input
                          type="text"
                          value={customer.address.street}
                          onChange={(e) => setCustomer({
                            ...customer,
                            address: { ...customer.address, street: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">City *</label>
                        <input
                          type="text"
                          value={customer.address.city}
                          onChange={(e) => setCustomer({
                            ...customer,
                            address: { ...customer.address, city: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">State *</label>
                        <input
                          type="text"
                          value={customer.address.state}
                          onChange={(e) => setCustomer({
                            ...customer,
                            address: { ...customer.address, state: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                          placeholder="Maharashtra"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">ZIP Code *</label>
                        <input
                          type="text"
                          value={customer.address.zipCode}
                          onChange={(e) => setCustomer({
                            ...customer,
                            address: { ...customer.address, zipCode: e.target.value }
                          })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-[#F97272] focus:outline-none text-gray-900"
                          placeholder="400001"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Options */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Shipping Method</h2>
                    <div className="space-y-4">
                      {SHIPPING_OPTIONS.map(option => (
                        <ShippingOptionComponent
                          key={option.id}
                          option={option}
                          isSelected={selectedShipping?.id === option.id}
                          onSelect={() => setSelectedShipping(option)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Payment Method</h2>
                    <div className="space-y-4">
                      {PAYMENT_METHODS.map(method => (
                        <PaymentMethodComponent
                          key={method.id}
                          method={method}
                          isSelected={selectedPayment?.id === method.id}
                          onSelect={() => setSelectedPayment(method)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:sticky lg:top-24 h-fit">
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 text-gray-900">Order Summary</h3>
                    <div className="space-y-4 mb-6">
                      {cart.slice(0, 3).map(item => (
                        <div key={item.id} className="flex gap-3 text-sm">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{item.name}</div>
                            <div className="text-gray-600">Qty: {item.quantity}</div>
                          </div>
                          <div className="font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                      ))}
                      {cart.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{cart.length - 3} more items
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 mb-6 border-t border-gray-300 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-500">
                          <span>Discount</span>
                          <span>-₹{discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-gray-900">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="text-gray-900">₹{tax.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-300 flex justify-between text-xl font-bold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-[#F97272]">₹{total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handlePlaceOrder}
                        disabled={!customer.name || !customer.email || !selectedShipping || !selectedPayment}
                        className="w-full px-6 py-4 bg-[#F97272] hover:bg-[#f85c5c] text-white disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
                      >
                        Place Order
                      </button>
                      <button
                        onClick={() => setCurrentStep('cart')}
                        className="w-full px-6 py-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold transition-colors text-gray-900"
                      >
                        Back to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center shadow-lg">
                <LoadingSpinner size="lg" className="mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4 text-gray-900">Processing Your Order</h2>
                <p className="text-gray-600 mb-8">
                  Please wait while we process your payment and generate your invoice...
                </p>

                {/* Progress Bar */}
                <ProgressBar progress={processingProgress} className="mb-8" />

                <div className="text-sm text-gray-600 mb-8">
                  {processingProgress}% Complete
                </div>

                {/* Recent Logs */}
                {logs.length > 0 && (
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto text-left">
                    {logs.slice(-5).map(log => (
                      <LogEntryComponent key={log.id} log={log} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && invoice && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center mb-8 shadow-lg">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">Order Confirmed!</h2>
                <p className="text-gray-600 mb-2">
                  Thank you for your purchase, {customer.name}
                </p>
                <p className="text-sm text-gray-600 mb-8">
                  Order confirmation has been sent to {customer.email}
                </p>

                {/* Order Details */}
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8">
                  <div className="grid md:grid-cols-2 gap-6 text-left">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">ORDER NUMBER</div>
                      <div className="font-bold text-lg text-gray-900">{invoice.invoiceNumber}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">ORDER DATE</div>
                      <div className="font-semibold text-gray-900">{invoice.date}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">TOTAL AMOUNT</div>
                      <div className="font-bold text-xl text-[#F97272]">₹{total.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">PAYMENT METHOD</div>
                      <div className="font-semibold text-gray-900">{selectedPayment?.name || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 mb-8 text-left">
                  <h3 className="font-bold mb-4 text-gray-900">Order Items</h3>
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center pb-3 border-b border-gray-300 last:border-0">
                        <div className="flex gap-3">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleDownloadInvoice}
                    className="px-8 py-4 bg-[#F97272] hover:bg-[#f85c5c] text-white rounded-lg font-bold transition-colors flex items-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Invoice
                  </button>
                  <button
                    onClick={resetDemo}
                    className="px-8 py-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg font-semibold transition-colors text-gray-900"
                  >
                    Start New Order
                  </button>
                </div>
              </div>

              {/* Activity Logs */}
              {logs.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Activity Logs</h3>
                    <button
                      onClick={clearLogs}
                      className="text-xs text-gray-600 hover:text-[#F97272] transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {logs.map(log => (
                      <LogEntryComponent key={log.id} log={log} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Additional steps would continue here... */}
        </AnimatePresence>
      </div>
    </div>
  );
}
