/**
 * E-commerce Demo Data
 * Product catalog, shipping options, payment methods, and other static data
 */

import { Product, ShippingOption, PaymentMethod, Coupon } from './types';

export const DEMO_PRODUCTS: Omit<Product, 'quantity' | 'addedAt'>[] = [
  {
    id: 'prod-001',
    name: 'MacBook Pro 16" M3 Max',
    description: 'The most powerful MacBook Pro ever built. Featuring the revolutionary M3 Max chip with up to 40-core GPU, 128GB unified memory, and all-day battery life.',
    price: 349900,
    originalPrice: 399900,
    category: 'Laptops',
    rating: 4.9,
    reviews: 2847,
    inStock: true,
    image: '💻',
    features: [
      'Apple M3 Max chip with 16-core CPU',
      '40-core GPU for extreme performance',
      '128GB unified memory',
      '2TB SSD storage',
      '16.2-inch Liquid Retina XDR display',
      'Three Thunderbolt 4 ports',
      '1080p FaceTime HD camera',
      'Six-speaker sound system',
      'Up to 22 hours battery life',
      'macOS Sonoma'
    ],
    tags: ['professional', 'creative', 'performance', 'apple'],
    brand: 'Apple',
    sku: 'MBP-M3MAX-16-2TB',
    weight: 2.15,
    dimensions: { length: 35.57, width: 24.81, height: 1.68 },
    warranty: '1 year limited warranty',
    returnPolicy: '14-day return policy'
  },
  {
    id: 'prod-002',
    name: 'iPhone 15 Pro Max',
    description: 'The ultimate iPhone experience with titanium design, A17 Pro chip, and the most advanced camera system ever in an iPhone.',
    price: 159900,
    originalPrice: 179900,
    category: 'Smartphones',
    rating: 4.8,
    reviews: 5421,
    inStock: true,
    image: '📱',
    features: [
      'A17 Pro chip with 6-core GPU',
      'Titanium design with textured matte glass',
      'Pro camera system with 5x Telephoto',
      '6.7-inch Super Retina XDR display',
      'Dynamic Island',
      'Face ID',
      '256GB storage',
      'USB-C connector',
      'MagSafe and Qi wireless charging',
      'iOS 17'
    ],
    tags: ['flagship', 'camera', 'premium', 'apple'],
    brand: 'Apple',
    sku: 'IPH-15PM-256-TI',
    weight: 0.221,
    dimensions: { length: 15.99, width: 7.69, height: 0.83 },
    warranty: '1 year limited warranty',
    returnPolicy: '14-day return policy'
  },
  {
    id: 'prod-003',
    name: 'AirPods Pro (2nd Generation)',
    description: 'Immersive sound experience with Active Noise Cancellation, Transparency mode, and Spatial Audio with dynamic head tracking.',
    price: 24900,
    category: 'Audio',
    rating: 4.7,
    reviews: 1923,
    inStock: true,
    image: '🎧',
    features: [
      'Active Noise Cancellation',
      'Transparency mode',
      'Spatial Audio with dynamic head tracking',
      'H2 chip for advanced audio processing',
      'Up to 6 hours listening time',
      '30 hours total with charging case',
      'MagSafe charging case',
      'IPX4 sweat and water resistant',
      'Touch control',
      'Find My support'
    ],
    tags: ['wireless', 'noise-cancelling', 'premium', 'apple'],
    brand: 'Apple',
    sku: 'APP-2ND-GEN',
    weight: 0.056,
    warranty: '1 year limited warranty',
    returnPolicy: '14-day return policy'
  },
  {
    id: 'prod-004',
    name: 'iPad Pro 12.9" M2',
    description: 'The ultimate iPad experience with M2 chip, Liquid Retina XDR display, and support for Apple Pencil and Magic Keyboard.',
    price: 109900,
    category: 'Tablets',
    rating: 4.8,
    reviews: 1456,
    inStock: true,
    image: '📲',
    features: [
      'Apple M2 chip with 10-core GPU',
      '12.9-inch Liquid Retina XDR display',
      'ProMotion technology with 120Hz',
      '128GB storage',
      'Pro camera system with LiDAR',
      '12MP Ultra Wide front camera',
      'USB-C with Thunderbolt support',
      'Apple Pencil (2nd gen) support',
      'Magic Keyboard support',
      'iPadOS 17'
    ],
    tags: ['professional', 'creative', 'portable', 'apple'],
    brand: 'Apple',
    sku: 'IPD-PRO-129-M2-128',
    weight: 0.682,
    dimensions: { length: 28.06, width: 21.49, height: 0.64 },
    warranty: '1 year limited warranty',
    returnPolicy: '14-day return policy'
  },
  {
    id: 'prod-005',
    name: 'Apple Watch Ultra 2',
    description: 'The most rugged and capable Apple Watch. Built for adventure with precision GPS, cellular connectivity, and up to 36 hours of battery life.',
    price: 89900,
    category: 'Wearables',
    rating: 4.9,
    reviews: 982,
    inStock: true,
    image: '⌚',
    features: [
      'Titanium case with sapphire crystal',
      '49mm case size',
      'Always-On Retina display',
      'GPS + Cellular connectivity',
      'S9 SiP with double tap gesture',
      'Water resistant to 100 meters',
      'Temperature sensing',
      'ECG and blood oxygen monitoring',
      'Up to 36 hours battery life',
      'watchOS 10'
    ],
    tags: ['rugged', 'fitness', 'adventure', 'apple'],
    brand: 'Apple',
    sku: 'AW-ULTRA2-49-TI',
    weight: 0.061,
    warranty: '1 year limited warranty',
    returnPolicy: '14-day return policy'
  },
  {
    id: 'prod-006',
    name: 'Magic Keyboard with Touch ID',
    description: 'Wireless keyboard with Touch ID for secure authentication and convenient Apple Pay transactions.',
    price: 18900,
    category: 'Accessories',
    rating: 4.6,
    reviews: 745,
    inStock: true,
    image: '⌨️',
    features: [
      'Touch ID for secure authentication',
      'Wireless connectivity',
      'Rechargeable battery',
      'Full-size function keys',
      'Numeric keypad',
      'Scissor mechanism keys',
      'Low profile design',
      'Compatible with Mac and iPad',
      'Lightning to USB-C cable included',
      'Multi-device support'
    ],
    tags: ['wireless', 'productivity', 'security', 'apple'],
    brand: 'Apple',
    sku: 'MK-TOUCHID-NUM',
    weight: 0.369,
    dimensions: { length: 41.87, width: 11.49, height: 1.09 },
    warranty: '1 year limited warranty',
    returnPolicy: '14-day return policy'
  },
  {
    id: 'prod-007',
    name: 'Studio Display',
    description: '27-inch 5K Retina display with 12MP Ultra Wide camera, three-microphone array, and six-speaker sound system.',
    price: 159900,
    category: 'Displays',
    rating: 4.7,
    reviews: 634,
    inStock: true,
    image: '🖥️',
    features: [
      '27-inch 5K Retina display',
      '14.7 million pixels',
      '600 nits brightness',
      'P3 wide color gamut',
      'True Tone technology',
      '12MP Ultra Wide camera',
      'Center Stage support',
      'Three-microphone array',
      'Six-speaker sound system',
      'Thunderbolt 3 connectivity'
    ],
    tags: ['display', 'professional', 'creative', 'apple'],
    brand: 'Apple',
    sku: 'SD-27-5K',
    weight: 6.3,
    dimensions: { length: 62.3, width: 18.8, height: 47.8 },
    warranty: '1 year limited warranty',
    returnPolicy: '14-day return policy'
  },
  {
    id: 'prod-008',
    name: 'Mac Studio M2 Ultra',
    description: 'Extraordinary performance and connectivity in an incredibly compact design. Perfect for creative professionals.',
    price: 399900,
    originalPrice: 449900,
    category: 'Desktops',
    rating: 4.9,
    reviews: 423,
    inStock: true,
    image: '🖥️',
    features: [
      'Apple M2 Ultra chip',
      '24-core CPU and 76-core GPU',
      '192GB unified memory',
      '2TB SSD storage',
      'Four Thunderbolt 4 ports',
      'Two USB-A ports',
      'HDMI port',
      '10Gb Ethernet',
      'SDXC card slot',
      'Supports up to 8 displays'
    ],
    tags: ['professional', 'performance', 'creative', 'apple'],
    brand: 'Apple',
    sku: 'MS-M2U-192-2TB',
    weight: 2.7,
    dimensions: { length: 19.7, width: 19.7, height: 9.5 },
    warranty: '1 year limited warranty',
    returnPolicy: '14-day return policy'
  }
];

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Free delivery on orders above ₹1000',
    cost: 0,
    estimatedDays: 5,
    trackingAvailable: true,
    icon: '📦'
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Get your order in 2-3 business days',
    cost: 199,
    estimatedDays: 3,
    trackingAvailable: true,
    icon: '🚚'
  },
  {
    id: 'overnight',
    name: 'Overnight Delivery',
    description: 'Next business day delivery',
    cost: 499,
    estimatedDays: 1,
    trackingAvailable: true,
    icon: '⚡'
  }
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    type: 'card',
    icon: '💳',
    processingFee: 0,
    isAvailable: true,
    description: 'Visa, Mastercard, RuPay accepted'
  },
  {
    id: 'upi',
    name: 'UPI',
    type: 'upi',
    icon: '📱',
    processingFee: 0,
    isAvailable: true,
    description: 'Pay using any UPI app'
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    type: 'netbanking',
    icon: '🏦',
    processingFee: 0,
    isAvailable: true,
    description: 'All major banks supported'
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    type: 'wallet',
    icon: '💰',
    processingFee: 0,
    isAvailable: true,
    description: 'Paytm, PhonePe, Google Pay'
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    type: 'cod',
    icon: '💵',
    processingFee: 49,
    isAvailable: true,
    description: 'Pay when you receive'
  }
];

export const DEMO_COUPONS: Coupon[] = [
  {
    code: 'DEMO10',
    type: 'percentage',
    value: 10,
    minOrderValue: 1000,
    maxDiscount: 5000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usageLimit: 1000,
    usedCount: 234,
    isActive: true,
    description: '10% off on orders above ₹1000'
  },
  {
    code: 'WELCOME20',
    type: 'percentage',
    value: 20,
    minOrderValue: 2000,
    maxDiscount: 10000,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usageLimit: 500,
    usedCount: 89,
    isActive: true,
    description: '20% off for new customers'
  },
  {
    code: 'FREESHIP',
    type: 'freeShipping',
    value: 0,
    minOrderValue: 500,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usageLimit: 2000,
    usedCount: 567,
    isActive: true,
    description: 'Free shipping on orders above ₹500'
  }
];

export const CATEGORIES = [
  'All Products',
  'Laptops',
  'Smartphones',
  'Tablets',
  'Wearables',
  'Audio',
  'Accessories',
  'Displays',
  'Desktops'
];

export const BRANDS = [
  'Apple',
  'Samsung',
  'Google',
  'Microsoft',
  'Dell',
  'HP',
  'Lenovo',
  'Asus'
];

export const SORT_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popularity', label: 'Most Popular' }
];

export const COMPANY_INFO = {
  name: 'TechStore Pro',
  address: '123 Tech Street, Innovation District, Bangalore 560001',
  gstin: '29ABCDE1234F1Z5',
  pan: 'ABCDE1234F',
  email: 'orders@techstore.com',
  phone: '+91 80 1234 5678',
  website: 'https://techstore.com',
  supportEmail: 'support@techstore.com',
  supportPhone: '+91 80 1234 5679'
};

export const INVOICE_TERMS = [
  'Payment is due within 30 days of invoice date',
  'Late payments may incur additional charges',
  'All prices are inclusive of applicable taxes',
  'Returns accepted within 14 days of delivery',
  'Warranty terms apply as per manufacturer guidelines',
  'For support, contact us at support@techstore.com'
];

export const DEMO_ANALYTICS_EVENTS = [
  'product_view',
  'add_to_cart',
  'remove_from_cart',
  'begin_checkout',
  'add_payment_info',
  'purchase',
  'coupon_applied',
  'shipping_selected'
];
