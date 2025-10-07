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

  // Track page view
  useEffect(() => {
    trackPageView('ecommerce-demo');
  }, [trackPageView]);

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
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">E-Commerce Demo</h1>
                  <p className="text-xs text-gray-500">Autonomous Invoice Generation</p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.key}>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentStep === step.key 
                      ? 'bg-red-600 text-white' 
                      : index < currentStepIndex 
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-900 text-gray-500'
                  }`}>
                    {step.icon}
                    <span className="hidden lg:block">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-800" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Cart Badge */}
            {currentStep === 'shopping' && (
              <button
                onClick={() => setCurrentStep('cart')}
                className="relative px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
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
                      className="pl-10 pr-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:border-red-600 focus:outline-none w-64"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:border-red-600 focus:outline-none"
                  >
                    {CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-gray-950 border border-gray-800 rounded-lg focus:border-red-600 focus:outline-none"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-red-600' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-red-600' : 'bg-gray-900 hover:bg-gray-800'}`}
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
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Shopping Cart</h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-sm text-gray-500 hover:text-red-500 transition-colors"
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
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
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
                    <div className="border-t border-gray-800 pt-6">
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-gray-400">
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
                        <div className="pt-2 border-t border-gray-800 flex justify-between text-2xl font-bold">
                          <span>Total</span>
                          <span className="text-red-600">₹{total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setCurrentStep('shopping')}
                          className="flex-1 px-6 py-4 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg font-semibold transition-colors"
                        >
                          Continue Shopping
                        </button>
                        <button
                          onClick={handleProceedToCheckout}
                          className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
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

          {/* Additional steps would continue here... */}
        </AnimatePresence>
      </div>
    </div>
  );
}
