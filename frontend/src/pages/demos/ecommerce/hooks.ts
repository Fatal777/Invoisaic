/**
 * E-commerce Demo Hooks
 * Custom React hooks for cart management, API calls, and state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Product, CartItem, Customer, Order, LogEntry, Coupon, InvoiceData, APIResponse, WebhookPayload } from './types';
import { DEMO_COUPONS } from './data';

// Cart Management Hook
export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = useCallback((product: Omit<Product, 'quantity'>, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, {
          ...product,
          quantity,
          addedAt: new Date()
        }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const getCartItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const isInCart = useCallback((productId: string) => {
    return cart.some(item => item.id === productId);
  }, [cart]);

  const getCartItem = useCallback((productId: string) => {
    return cart.find(item => item.id === productId);
  }, [cart]);

  return {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    isInCart,
    getCartItem
  };
};

// Coupon Management Hook
export const useCoupons = () => {
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateCoupon = useCallback(async (code: string, orderValue: number) => {
    setIsValidating(true);
    setCouponError(null);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const coupon = DEMO_COUPONS.find(c => 
      c.code.toLowerCase() === code.toLowerCase() && 
      c.isActive &&
      new Date() >= c.validFrom &&
      new Date() <= c.validUntil
    );

    if (!coupon) {
      setCouponError('Invalid or expired coupon code');
      setIsValidating(false);
      return false;
    }

    if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
      setCouponError(`Minimum order value of ₹${coupon.minOrderValue} required`);
      setIsValidating(false);
      return false;
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      setCouponError('Coupon usage limit exceeded');
      setIsValidating(false);
      return false;
    }

    setAppliedCoupon(coupon);
    setIsValidating(false);
    return true;
  }, []);

  const applyCoupon = useCallback(async (code: string, orderValue: number) => {
    const isValid = await validateCoupon(code, orderValue);
    if (isValid) {
      setCouponCode(code);
    }
    return isValid;
  }, [validateCoupon]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  }, []);

  const calculateDiscount = useCallback((orderValue: number) => {
    if (!appliedCoupon) return 0;

    let discount = 0;
    
    if (appliedCoupon.type === 'percentage') {
      discount = (orderValue * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount) {
        discount = Math.min(discount, appliedCoupon.maxDiscount);
      }
    } else if (appliedCoupon.type === 'fixed') {
      discount = appliedCoupon.value;
    }

    return Math.min(discount, orderValue);
  }, [appliedCoupon]);

  return {
    appliedCoupon,
    couponCode,
    couponError,
    isValidating,
    applyCoupon,
    removeCoupon,
    calculateDiscount
  };
};

// Logging Hook
export const useLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);

  const addLog = useCallback((
    type: LogEntry['type'],
    category: LogEntry['category'],
    message: string,
    details?: string,
    metadata?: Record<string, any>
  ) => {
    const newLog: LogEntry = {
      id: `log-${++logIdCounter.current}`,
      timestamp: new Date(),
      type,
      category,
      message,
      details,
      metadata,
      sessionId: 'demo-session'
    };

    setLogs(prevLogs => [...prevLogs, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const getLogsByCategory = useCallback((category: LogEntry['category']) => {
    return logs.filter(log => log.category === category);
  }, [logs]);

  const getLogsByType = useCallback((type: LogEntry['type']) => {
    return logs.filter(log => log.type === type);
  }, [logs]);

  return {
    logs,
    addLog,
    clearLogs,
    getLogsByCategory,
    getLogsByType
  };
};

// API Hook
export const useAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callAPI = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      setIsLoading(false);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  const processOrder = useCallback(async (order: Partial<Order>): Promise<APIResponse<InvoiceData>> => {
    const webhookPayload: WebhookPayload = {
      event: 'order.created',
      platform: 'demo-ecommerce',
      data: {
        order_id: order.id || `ORD-${Date.now()}`,
        customer: order.customer!,
        items: order.items!,
        total: order.pricing?.total || 0,
        metadata: {
          source: 'ecommerce-demo',
          timestamp: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    };

    return callAPI<InvoiceData>('/autonomous-agent', {
      method: 'POST',
      body: JSON.stringify(webhookPayload)
    });
  }, [callAPI]);

  return {
    isLoading,
    error,
    callAPI,
    processOrder
  };
};

// Local Storage Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

// Analytics Hook
export const useAnalytics = () => {
  const trackEvent = useCallback((
    event: string,
    category: string,
    properties: Record<string, any> = {}
  ) => {
    // In a real app, this would send to analytics service
    console.log('Analytics Event:', {
      event,
      category,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: 'demo-session'
    });
  }, []);

  const trackPageView = useCallback((page: string) => {
    trackEvent('page_view', 'navigation', { page });
  }, [trackEvent]);

  const trackPurchase = useCallback((order: Order) => {
    trackEvent('purchase', 'ecommerce', {
      order_id: order.id,
      value: order.pricing.total,
      currency: 'INR',
      items: order.items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price
      }))
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackPurchase
  };
};

// Timer Hook
export const useTimer = (initialTime: number = 0) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }
  }, [isRunning]);

  const stop = useCallback(() => {
    if (isRunning && intervalRef.current) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning]);

  const reset = useCallback(() => {
    stop();
    setTime(initialTime);
  }, [stop, initialTime]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    time,
    isRunning,
    start,
    stop,
    reset,
    formattedTime: formatTime(time)
  };
};
