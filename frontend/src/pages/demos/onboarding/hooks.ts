/**
 * Onboarding Demo Hooks
 * Custom React hooks for company onboarding, product management, and invoice generation
 */

import { useState, useCallback, useRef } from 'react';
import { 
  Company, 
  Product, 
  Customer, 
  InvoiceItem, 
  Invoice, 
  TaxCalculation,
  GSTINValidation,
  LogEntry,
  ValidationError,
  APIResponse
} from './types';
import { MOCK_GSTIN_DATA, ERROR_MESSAGES, SUCCESS_MESSAGES } from './data';

// Company Management Hook
export const useCompany = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const validateGSTIN = useCallback(async (gstin: string): Promise<GSTINValidation> => {
    setIsValidating(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // GSTIN format validation
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    if (!gstinRegex.test(gstin)) {
      setIsValidating(false);
      return {
        gstin,
        isValid: false,
        errors: [ERROR_MESSAGES.INVALID_GSTIN]
      };
    }

    // Mock GSTIN lookup
    const mockData = MOCK_GSTIN_DATA[gstin as keyof typeof MOCK_GSTIN_DATA];
    
    setIsValidating(false);

    if (mockData) {
      return {
        gstin,
        isValid: true,
        businessName: mockData.businessName,
        tradeName: mockData.tradeName,
        address: mockData.address,
        state: mockData.state,
        status: mockData.status,
        registrationDate: mockData.registrationDate,
        taxpayerType: mockData.taxpayerType
      };
    }

    return {
      gstin,
      isValid: true,
      businessName: 'Demo Company Pvt Ltd',
      state: 'Karnataka',
      status: 'active'
    };
  }, []);

  const validatePAN = useCallback((pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }, []);

  const saveCompany = useCallback((companyData: Company) => {
    const errors: ValidationError[] = [];

    if (!companyData.name) {
      errors.push({ field: 'name', message: 'Company name is required', type: 'error' });
    }

    if (!companyData.tax.gstin) {
      errors.push({ field: 'gstin', message: 'GSTIN is required', type: 'error' });
    }

    if (!companyData.contact.email) {
      errors.push({ field: 'email', message: 'Email is required', type: 'error' });
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return false;
    }

    setCompany(companyData);
    setValidationErrors([]);
    return true;
  }, []);

  const updateCompany = useCallback((updates: Partial<Company>) => {
    if (company) {
      setCompany({ ...company, ...updates });
    }
  }, [company]);

  const clearCompany = useCallback(() => {
    setCompany(null);
    setValidationErrors([]);
  }, []);

  return {
    company,
    isValidating,
    validationErrors,
    validateGSTIN,
    validatePAN,
    saveCompany,
    updateCompany,
    clearCompany
  };
};

// Product Catalog Hook
export const useProductCatalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const productIdCounter = useRef(0);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; error?: string; product?: Product } => {
    // Check for duplicate SKU
    if (products.some(p => p.sku === productData.sku)) {
      return { success: false, error: ERROR_MESSAGES.DUPLICATE_PRODUCT };
    }

    const newProduct: Product = {
      ...productData,
      id: `prod-${++productIdCounter.current}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setProducts(prev => [...prev, newProduct]);
    return { success: true, product: newProduct };
  }, [products]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
  }, []);

  const removeProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const getProduct = useCallback((id: string) => {
    return products.find(p => p.id === id);
  }, [products]);

  const clearProducts = useCallback(() => {
    setProducts([]);
  }, []);

  const importProducts = useCallback((productList: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    const imported = productList.map((p, index) => ({
      ...p,
      id: `prod-${++productIdCounter.current}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    setProducts(prev => [...prev, ...imported]);
    return imported.length;
  }, []);

  return {
    products,
    addProduct,
    updateProduct,
    removeProduct,
    getProduct,
    clearProducts,
    importProducts,
    productCount: products.length
  };
};

// Invoice Builder Hook
export const useInvoiceBuilder = () => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const itemIdCounter = useRef(0);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    const existingItem = items.find(item => item.product.id === product.id);

    if (existingItem) {
      updateItemQuantity(existingItem.id, existingItem.quantity + quantity);
      return;
    }

    const rate = product.price;
    const discount = 0;
    const taxableAmount = (rate * quantity) - discount;
    const gstRate = product.gst;
    
    // Calculate CGST/SGST or IGST based on state
    const cgst = (taxableAmount * gstRate) / 200; // Half of GST
    const sgst = (taxableAmount * gstRate) / 200; // Half of GST
    const igst = 0; // For inter-state, would be full GST rate
    const cess = product.cess ? (taxableAmount * product.cess) / 100 : 0;
    const total = taxableAmount + cgst + sgst + igst + cess;

    const newItem: InvoiceItem = {
      id: `item-${++itemIdCounter.current}`,
      product,
      quantity,
      rate,
      discount,
      discountType: 'fixed',
      taxableAmount,
      gstRate,
      cgst,
      sgst,
      igst,
      cess,
      total
    };

    setItems(prev => [...prev, newItem]);
  }, [items]);

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const taxableAmount = (item.rate * quantity) - item.discount;
        const cgst = (taxableAmount * item.gstRate) / 200;
        const sgst = (taxableAmount * item.gstRate) / 200;
        const total = taxableAmount + cgst + sgst + item.igst + item.cess;

        return {
          ...item,
          quantity,
          taxableAmount,
          cgst,
          sgst,
          total
        };
      }
      return item;
    }));
  }, []);

  const updateItemDiscount = useCallback((itemId: string, discount: number, discountType: 'percentage' | 'fixed') => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const discountAmount = discountType === 'percentage' 
          ? (item.rate * item.quantity * discount) / 100
          : discount;
        
        const taxableAmount = (item.rate * item.quantity) - discountAmount;
        const cgst = (taxableAmount * item.gstRate) / 200;
        const sgst = (taxableAmount * item.gstRate) / 200;
        const total = taxableAmount + cgst + sgst + item.igst + item.cess;

        return {
          ...item,
          discount: discountAmount,
          discountType,
          taxableAmount,
          cgst,
          sgst,
          total
        };
      }
      return item;
    }));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  const calculateTax = useCallback((): TaxCalculation => {
    const subtotal = items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
    const discount = items.reduce((sum, item) => sum + item.discount, 0);
    const taxableAmount = subtotal - discount;
    const cgst = items.reduce((sum, item) => sum + item.cgst, 0);
    const sgst = items.reduce((sum, item) => sum + item.sgst, 0);
    const igst = items.reduce((sum, item) => sum + item.igst, 0);
    const cess = items.reduce((sum, item) => sum + item.cess, 0);
    const total = taxableAmount + cgst + sgst + igst + cess;
    const roundOff = Math.round(total) - total;

    // Group by tax rate
    const taxBreakdown = items.reduce((acc, item) => {
      const existing = acc.find(t => t.rate === item.gstRate);
      if (existing) {
        existing.taxableAmount += item.taxableAmount;
        existing.cgst += item.cgst;
        existing.sgst += item.sgst;
        existing.igst += item.igst;
      } else {
        acc.push({
          rate: item.gstRate,
          taxableAmount: item.taxableAmount,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst
        });
      }
      return acc;
    }, [] as TaxCalculation['taxBreakdown']);

    return {
      subtotal,
      discount,
      taxableAmount,
      cgst,
      sgst,
      igst,
      cess,
      roundOff,
      total: Math.round(total),
      taxBreakdown
    };
  }, [items]);

  return {
    items,
    customer,
    addItem,
    updateItemQuantity,
    updateItemDiscount,
    removeItem,
    clearItems,
    setCustomer,
    calculateTax,
    itemCount: items.length
  };
};

// Invoice Generation Hook
export const useInvoiceGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);

  const generateInvoice = useCallback(async (
    company: Company,
    customer: Customer,
    items: InvoiceItem[],
    taxCalculation: TaxCalculation
  ): Promise<APIResponse<Invoice>> => {
    setIsGenerating(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

      const response = await fetch(`${apiUrl}/features/generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: {
            name: company.name,
            country: company.address.state.substring(0, 2), // Use state code as country for now
            address: company.address.street,
            city: company.address.city,
            email: company.contact.email,
            phone: company.contact.phone,
            taxId: company.tax.gstin,
            vatNumber: company.tax.gstin,
            currency: 'INR'
          },
          customer: {
            name: customer.name,
            email: customer.contact.email || '',
            address: customer.address.street,
            city: customer.address.city,
            country: customer.address.state.substring(0, 2)
          },
          items: items.map(item => ({
            name: item.product.name,
            description: item.product.description,
            quantity: item.quantity,
            price: item.rate
          })),
          settings: {
            currency: 'INR',
            notes: '',
            terms: 'Payment due within 30 days'
          }
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      const backendInvoice = data.invoice;

      const invoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: backendInvoice.invoiceNumber || `INV-${Date.now()}`,
        invoiceDate: backendInvoice.invoiceDate || new Date().toISOString().split('T')[0],
        company,
        customer,
        items,
        subtotal: backendInvoice.subtotal || taxCalculation.subtotal,
        discount: 0,
        taxableAmount: backendInvoice.subtotal || taxCalculation.taxableAmount,
        cgst: taxCalculation.cgst,
        sgst: taxCalculation.sgst,
        igst: taxCalculation.igst,
        cess: taxCalculation.cess,
        roundOff: taxCalculation.roundOff,
        total: backendInvoice.totalAmount || taxCalculation.total,
        amountInWords: convertToWords(backendInvoice.totalAmount || taxCalculation.total),
        status: 'draft',
        paymentStatus: 'unpaid',
        pdfUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setGeneratedInvoice(invoice);
      setIsGenerating(false);

      return {
        success: true,
        data: invoice,
        message: SUCCESS_MESSAGES.INVOICE_GENERATED,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      setIsGenerating(false);
      return {
        success: false,
        error: ERROR_MESSAGES.GENERATION_FAILED,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  const clearInvoice = useCallback(() => {
    setGeneratedInvoice(null);
  }, []);

  return {
    isGenerating,
    generatedInvoice,
    generateInvoice,
    clearInvoice
  };
};

// Logging Hook
export const useOnboardingLogger = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdCounter = useRef(0);

  const addLog = useCallback((
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    details?: string,
    metadata?: Record<string, any>
  ) => {
    const newLog: LogEntry = {
      id: `log-${++logIdCounter.current}`,
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      metadata
    };

    setLogs(prev => [...prev, newLog]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs
  };
};

// Utility function to convert number to words
function convertToWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const crores = Math.floor(amount / 10000000);
  const lakhs = Math.floor((amount % 10000000) / 100000);
  const thousands = Math.floor((amount % 100000) / 1000);
  const remainder = Math.floor(amount % 1000);

  let words = '';
  
  if (crores > 0) words += convertLessThanThousand(crores) + ' Crore ';
  if (lakhs > 0) words += convertLessThanThousand(lakhs) + ' Lakh ';
  if (thousands > 0) words += convertLessThanThousand(thousands) + ' Thousand ';
  if (remainder > 0) words += convertLessThanThousand(remainder);

  return words.trim() + ' Rupees Only';
}
