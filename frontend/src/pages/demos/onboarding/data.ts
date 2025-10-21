/**
 * Onboarding Demo Data
 * Static data, product catalog, HSN codes, and configuration
 */

import { Product, HSNCode, InvoiceTemplate, StateCode, InvoiceSettings } from './types';

export const INDIAN_STATES: StateCode[] = [
  { code: '01', name: 'Jammu and Kashmir', tin: '01' },
  { code: '02', name: 'Himachal Pradesh', tin: '02' },
  { code: '03', name: 'Punjab', tin: '03' },
  { code: '04', name: 'Chandigarh', tin: '04' },
  { code: '05', name: 'Uttarakhand', tin: '05' },
  { code: '06', name: 'Haryana', tin: '06' },
  { code: '07', name: 'Delhi', tin: '07' },
  { code: '08', name: 'Rajasthan', tin: '08' },
  { code: '09', name: 'Uttar Pradesh', tin: '09' },
  { code: '10', name: 'Bihar', tin: '10' },
  { code: '11', name: 'Sikkim', tin: '11' },
  { code: '12', name: 'Arunachal Pradesh', tin: '12' },
  { code: '13', name: 'Nagaland', tin: '13' },
  { code: '14', name: 'Manipur', tin: '14' },
  { code: '15', name: 'Mizoram', tin: '15' },
  { code: '16', name: 'Tripura', tin: '16' },
  { code: '17', name: 'Meghalaya', tin: '17' },
  { code: '18', name: 'Assam', tin: '18' },
  { code: '19', name: 'West Bengal', tin: '19' },
  { code: '20', name: 'Jharkhand', tin: '20' },
  { code: '21', name: 'Odisha', tin: '21' },
  { code: '22', name: 'Chhattisgarh', tin: '22' },
  { code: '23', name: 'Madhya Pradesh', tin: '23' },
  { code: '24', name: 'Gujarat', tin: '24' },
  { code: '27', name: 'Maharashtra', tin: '27' },
  { code: '29', name: 'Karnataka', tin: '29' },
  { code: '30', name: 'Goa', tin: '30' },
  { code: '32', name: 'Kerala', tin: '32' },
  { code: '33', name: 'Tamil Nadu', tin: '33' },
  { code: '34', name: 'Puducherry', tin: '34' },
  { code: '35', name: 'Andaman and Nicobar Islands', tin: '35' },
  { code: '36', name: 'Telangana', tin: '36' },
  { code: '37', name: 'Andhra Pradesh', tin: '37' }
];

export const BUSINESS_TYPES = [
  { value: 'proprietorship', label: 'Proprietorship', description: 'Single owner business' },
  { value: 'partnership', label: 'Partnership', description: 'Multiple partners' },
  { value: 'private_limited', label: 'Private Limited', description: 'Pvt Ltd company' },
  { value: 'public_limited', label: 'Public Limited', description: 'Public company' },
  { value: 'llp', label: 'LLP', description: 'Limited Liability Partnership' }
];

export const INDUSTRIES = [
  'Technology & Software',
  'Manufacturing',
  'Retail & E-commerce',
  'Healthcare',
  'Education',
  'Construction',
  'Real Estate',
  'Finance & Banking',
  'Food & Beverage',
  'Consulting Services',
  'Transportation & Logistics',
  'Agriculture',
  'Hospitality',
  'Media & Entertainment',
  'Other'
];

export const PRODUCT_CATEGORIES = [
  'Software & IT Services',
  'Hardware & Electronics',
  'Office Supplies',
  'Consulting Services',
  'Marketing Services',
  'Raw Materials',
  'Finished Goods',
  'Professional Services',
  'Training & Education',
  'Maintenance & Support',
  'Other'
];

export const UNITS = [
  { value: 'pcs', label: 'Pieces', abbr: 'Pcs' },
  { value: 'kg', label: 'Kilograms', abbr: 'Kg' },
  { value: 'ltr', label: 'Liters', abbr: 'Ltr' },
  { value: 'mtr', label: 'Meters', abbr: 'Mtr' },
  { value: 'box', label: 'Box', abbr: 'Box' },
  { value: 'set', label: 'Set', abbr: 'Set' },
  { value: 'hrs', label: 'Hours', abbr: 'Hrs' },
  { value: 'days', label: 'Days', abbr: 'Days' }
];

export const GST_RATES = [0, 5, 12, 18, 28];

export const HSN_CODES: HSNCode[] = [
  { code: '998314', description: 'Software Development Services', gstRate: 18, category: 'IT Services', isService: true },
  { code: '998313', description: 'Cloud Computing Services', gstRate: 18, category: 'IT Services', isService: true },
  { code: '998315', description: 'IT Consulting Services', gstRate: 18, category: 'IT Services', isService: true },
  { code: '998316', description: 'Technical Support Services', gstRate: 18, category: 'IT Services', isService: true },
  { code: '998312', description: 'Data Processing Services', gstRate: 18, category: 'IT Services', isService: true },
  { code: '8471', description: 'Computers and Laptops', gstRate: 18, category: 'Electronics', isService: false },
  { code: '8517', description: 'Mobile Phones', gstRate: 18, category: 'Electronics', isService: false },
  { code: '8528', description: 'Monitors and Displays', gstRate: 18, category: 'Electronics', isService: false },
  { code: '8443', description: 'Printers', gstRate: 18, category: 'Electronics', isService: false },
  { code: '9983', description: 'Professional Services', gstRate: 18, category: 'Services', isService: true }
];

export const DEMO_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Enterprise Software License - Annual',
    description: 'Full-featured enterprise software with 24/7 support',
    hsn: '998314',
    category: 'Software & IT Services',
    unit: 'pcs',
    price: 50000,
    mrp: 60000,
    gst: 18,
    stock: 100,
    sku: 'SW-ENT-001',
    isService: true,
    isActive: true,
    tags: ['software', 'enterprise', 'annual']
  },
  {
    name: 'Cloud Hosting - Pro Plan',
    description: 'Premium cloud hosting with 500GB storage and unlimited bandwidth',
    hsn: '998313',
    category: 'Software & IT Services',
    unit: 'days',
    price: 15000,
    gst: 18,
    sku: 'CLOUD-PRO-001',
    isService: true,
    isActive: true,
    tags: ['cloud', 'hosting', 'monthly']
  },
  {
    name: 'IT Consulting Services',
    description: 'Expert IT consulting and advisory services',
    hsn: '998315',
    category: 'Consulting Services',
    unit: 'hrs',
    price: 8000,
    gst: 18,
    sku: 'CONS-IT-001',
    isService: true,
    isActive: true,
    tags: ['consulting', 'advisory', 'hourly']
  },
  {
    name: 'Custom Software Development',
    description: 'Bespoke software development tailored to your needs',
    hsn: '998314',
    category: 'Software & IT Services',
    unit: 'hrs',
    price: 12000,
    gst: 18,
    sku: 'DEV-CUSTOM-001',
    isService: true,
    isActive: true,
    tags: ['development', 'custom', 'hourly']
  },
  {
    name: 'Technical Support - Premium',
    description: '24/7 premium technical support with SLA',
    hsn: '998316',
    category: 'Professional Services',
    unit: 'days',
    price: 5000,
    gst: 18,
    sku: 'SUP-PREM-001',
    isService: true,
    isActive: true,
    tags: ['support', 'premium', 'monthly']
  },
  {
    name: 'Business Laptop - Dell Latitude',
    description: 'Dell Latitude 5420, i7, 16GB RAM, 512GB SSD',
    hsn: '8471',
    category: 'Hardware & Electronics',
    unit: 'pcs',
    price: 75000,
    mrp: 85000,
    gst: 18,
    stock: 25,
    sku: 'LAP-DELL-001',
    isService: false,
    isActive: true,
    tags: ['laptop', 'dell', 'business']
  },
  {
    name: 'Professional Monitor - 27" 4K',
    description: 'Dell UltraSharp 27" 4K USB-C Monitor',
    hsn: '8528',
    category: 'Hardware & Electronics',
    unit: 'pcs',
    price: 45000,
    mrp: 50000,
    gst: 18,
    stock: 15,
    sku: 'MON-DELL-001',
    isService: false,
    isActive: true,
    tags: ['monitor', '4k', 'professional']
  },
  {
    name: 'Wireless Keyboard & Mouse Combo',
    description: 'Logitech MX Keys & MX Master 3 Combo',
    hsn: '8471',
    category: 'Hardware & Electronics',
    unit: 'set',
    price: 18000,
    gst: 18,
    stock: 50,
    sku: 'KB-LOGI-001',
    isService: false,
    isActive: true,
    tags: ['keyboard', 'mouse', 'wireless']
  }
];

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'standard',
    name: 'Standard GST Invoice',
    description: 'Professional GST-compliant invoice template',
    layout: 'standard',
    colorScheme: '#000000',
    includeCompanyLogo: true,
    includeTerms: true,
    includeNotes: true,
    includeQRCode: false,
    includeSignature: true
  },
  {
    id: 'modern',
    name: 'Modern Invoice',
    description: 'Clean and modern invoice design',
    layout: 'modern',
    colorScheme: '#DC2626',
    includeCompanyLogo: true,
    includeTerms: true,
    includeNotes: true,
    includeQRCode: true,
    includeSignature: true
  },
  {
    id: 'minimal',
    name: 'Minimal Invoice',
    description: 'Simple and minimal invoice layout',
    layout: 'minimal',
    colorScheme: '#6B7280',
    includeCompanyLogo: false,
    includeTerms: false,
    includeNotes: false,
    includeQRCode: false,
    includeSignature: false
  }
];

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  prefix: 'INV',
  startingNumber: 1,
  numberFormat: 'yearly',
  defaultDueDays: 30,
  defaultTerms: [
    'Payment is due within 30 days of invoice date',
    'Late payments may incur additional charges',
    'All prices are inclusive of applicable GST',
    'Please quote invoice number in all correspondence'
  ],
  defaultNotes: 'Thank you for your business!',
  autoRoundOff: true,
  includeHSN: true,
  includeGSTIN: true,
  includePAN: true,
  reverseCharge: false,
  placeOfSupply: 'Karnataka'
};

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'cheque', label: 'Cheque', icon: '📝' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'neft', label: 'NEFT/RTGS', icon: '🏦' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'other', label: 'Other', icon: '💰' }
];

export const MOCK_GSTIN_DATA = {
  '29ABCDE1234F1Z5': {
    businessName: 'Tech Solutions Private Limited',
    tradeName: 'Tech Solutions',
    address: '123 MG Road, Bangalore, Karnataka - 560001',
    state: 'Karnataka',
    status: 'active' as const,
    registrationDate: '2020-01-15',
    taxpayerType: 'Regular'
  },
  '27XYZAB5678G2H3': {
    businessName: 'Innovation Labs LLP',
    tradeName: 'Innovation Labs',
    address: '456 Andheri East, Mumbai, Maharashtra - 400069',
    state: 'Maharashtra',
    status: 'active' as const,
    registrationDate: '2019-06-20',
    taxpayerType: 'Regular'
  }
};

export const DEMO_CUSTOMERS = [
  {
    name: 'Acme Corporation',
    gstin: '29ABCDE5678F1Z9',
    email: 'accounts@acmecorp.com',
    phone: '+91 80 9876 5432',
    address: {
      street: '789 Corporate Avenue',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560100',
      country: 'India'
    },
    type: 'b2b' as const
  },
  {
    name: 'Global Enterprises Ltd',
    gstin: '27XYZAB1234G2H5',
    email: 'billing@globalent.com',
    phone: '+91 22 8765 4321',
    address: {
      street: '321 Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    },
    type: 'b2b' as const
  },
  {
    name: 'Retail Customer',
    email: 'customer@example.com',
    phone: '+91 98765 43210',
    address: {
      street: '123 Main Street',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India'
    },
    type: 'b2c' as const
  }
];

export const ONBOARDING_STEPS = [
  {
    id: 'company',
    title: 'Company Details',
    description: 'Register your company information and GSTIN',
    order: 1,
    required: true
  },
  {
    id: 'products',
    title: 'Product Catalog',
    description: 'Add products and services to your catalog',
    order: 2,
    required: true
  },
  {
    id: 'customers',
    title: 'Customer Information',
    description: 'Add customer details (optional)',
    order: 3,
    required: false
  },
  {
    id: 'invoice',
    title: 'Generate Invoice',
    description: 'Create your first GST invoice',
    order: 4,
    required: true
  },
  {
    id: 'settings',
    title: 'Invoice Settings',
    description: 'Configure invoice preferences',
    order: 5,
    required: false
  }
];

export const TAX_SLABS = [
  { rate: 0, description: 'Nil rated / Exempted' },
  { rate: 5, description: 'Essential goods and services' },
  { rate: 12, description: 'Standard goods and services' },
  { rate: 18, description: 'Most goods and services' },
  { rate: 28, description: 'Luxury goods and services' }
];

export const NUMBER_TO_WORDS_MAP = {
  0: 'Zero', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four',
  5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine',
  10: 'Ten', 11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen',
  15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen',
  20: 'Twenty', 30: 'Thirty', 40: 'Forty', 50: 'Fifty',
  60: 'Sixty', 70: 'Seventy', 80: 'Eighty', 90: 'Ninety'
};

export const ERROR_MESSAGES = {
  INVALID_GSTIN: 'Invalid GSTIN format. Please enter a valid 15-character GSTIN',
  INVALID_PAN: 'Invalid PAN format. Please enter a valid 10-character PAN',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  REQUIRED_FIELD: 'This field is required',
  DUPLICATE_PRODUCT: 'Product with this SKU already exists',
  NO_PRODUCTS: 'Please add at least one product',
  NO_ITEMS: 'Please add at least one item to the invoice',
  GENERATION_FAILED: 'Failed to generate invoice. Please try again'
};

export const SUCCESS_MESSAGES = {
  COMPANY_SAVED: 'Company details saved successfully',
  PRODUCT_ADDED: 'Product added to catalog',
  PRODUCT_UPDATED: 'Product updated successfully',
  INVOICE_GENERATED: 'Invoice generated successfully',
  SETTINGS_SAVED: 'Settings saved successfully'
};
