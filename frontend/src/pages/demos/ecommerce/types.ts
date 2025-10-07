/**
 * E-commerce Demo Types
 * All TypeScript interfaces and types for the e-commerce demo
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  category: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  image: string;
  features: string[];
  tags: string[];
  brand: string;
  sku: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  warranty?: string;
  returnPolicy?: string;
}

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences?: {
    newsletter: boolean;
    smsUpdates: boolean;
    emailUpdates: boolean;
  };
  loyaltyPoints?: number;
  membershipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface CartItem extends Product {
  addedAt: Date;
  selectedVariant?: string;
  giftWrap?: boolean;
  specialInstructions?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: CartItem[];
  pricing: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  payment: {
    method: 'card' | 'upi' | 'netbanking' | 'wallet';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionId?: string;
    gateway?: string;
  };
  shipping: {
    method: 'standard' | 'express' | 'overnight';
    cost: number;
    estimatedDelivery: Date;
    trackingNumber?: string;
  };
  status: 'cart' | 'checkout' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  timestamps: {
    created: Date;
    updated: Date;
    confirmed?: Date;
    shipped?: Date;
    delivered?: Date;
  };
  notes?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  orderId: string;
  customer: Customer;
  items: CartItem[];
  pricing: Order['pricing'];
  company: {
    name: string;
    address: string;
    gstin?: string;
    pan?: string;
    email: string;
    phone: string;
    website?: string;
  };
  terms?: string[];
  notes?: string;
  pdfUrl?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning' | 'processing';
  category: 'order' | 'payment' | 'shipping' | 'system' | 'ai' | 'webhook';
  message: string;
  details?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'freeShipping';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  applicableCategories?: string[];
  excludedProducts?: string[];
  isActive: boolean;
  description: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: number;
  trackingAvailable: boolean;
  icon: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod';
  icon: string;
  processingFee?: number;
  isAvailable: boolean;
  description?: string;
}

export interface NotificationSettings {
  orderConfirmation: boolean;
  paymentUpdates: boolean;
  shippingUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export interface AnalyticsEvent {
  event: string;
  category: string;
  properties: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export type DemoStep = 'shopping' | 'cart' | 'checkout' | 'payment' | 'processing' | 'confirmation' | 'complete';

export type SortOption = 'name' | 'price-low' | 'price-high' | 'rating' | 'newest' | 'popularity';

export type FilterOptions = {
  categories: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  brands: string[];
  features: string[];
};

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface WebhookPayload {
  event: 'order.created' | 'order.updated' | 'payment.completed' | 'invoice.generated';
  platform: string;
  data: {
    order_id: string;
    customer: Customer;
    items: CartItem[];
    total: number;
    metadata?: Record<string, any>;
  };
  timestamp: string;
  signature?: string;
}
