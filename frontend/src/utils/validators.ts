/**
 * Validation utilities for forms and data
 */

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Indian GSTIN
 */
export function isValidGSTIN(gstin: string): boolean {
  // GSTIN format: 29ABCDE1234F1Z5 (15 characters)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

/**
 * Validate German VAT number
 */
export function isValidGermanVAT(vat: string): boolean {
  // Format: DE123456789 (9 digits after DE)
  const vatRegex = /^DE[0-9]{9}$/;
  return vatRegex.test(vat);
}

/**
 * Validate UK VAT number
 */
export function isValidUKVAT(vat: string): boolean {
  // Format: GB123456789 or GB123456789012 (9 or 12 digits)
  const vatRegex = /^GB([0-9]{9}|[0-9]{12})$/;
  return vatRegex.test(vat);
}

/**
 * Validate US EIN (Employer Identification Number)
 */
export function isValidEIN(ein: string): boolean {
  // Format: 12-3456789
  const einRegex = /^[0-9]{2}-?[0-9]{7}$/;
  return einRegex.test(ein);
}

/**
 * Validate phone number (international format)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Should be between 10 and 15 digits
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validate amount (positive number)
 */
export function isValidAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num > 0;
}

/**
 * Validate date (not in past for due dates)
 */
export function isValidFutureDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d >= now;
}

/**
 * Validate invoice number format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  // Format: INV-2024-000123 or similar
  const regex = /^[A-Z]{3}-[0-9]{4}-[0-9]+$/;
  return regex.test(invoiceNumber);
}

/**
 * Validate HSN/SAC code (India)
 */
export function isValidHSNCode(code: string): boolean {
  // HSN: 4, 6, or 8 digits
  // SAC: 6 digits
  const regex = /^[0-9]{4,8}$/;
  return regex.test(code);
}

/**
 * Validate percentage (0-100)
 */
export function isValidPercentage(value: number): boolean {
  return value >= 0 && value <= 100;
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxBytes;
}

/**
 * Validate file type
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

/**
 * Validate required fields in object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(String(field));
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate invoice data before submission
 */
export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateInvoice(invoice: any): InvoiceValidationResult {
  const errors: string[] = [];
  
  // Check required fields
  if (!invoice.customerName || invoice.customerName.trim() === '') {
    errors.push('Customer name is required');
  }
  
  if (!invoice.customerEmail || !isValidEmail(invoice.customerEmail)) {
    errors.push('Valid customer email is required');
  }
  
  if (!invoice.amount || !isValidAmount(invoice.amount)) {
    errors.push('Valid amount is required');
  }
  
  if (!invoice.dueDate) {
    errors.push('Due date is required');
  } else if (!isValidFutureDate(invoice.dueDate)) {
    errors.push('Due date must be in the future');
  }
  
  if (invoice.taxId && invoice.country) {
    const taxIdValid = validateTaxId(invoice.taxId, invoice.country);
    if (!taxIdValid) {
      errors.push(`Invalid tax ID format for ${invoice.country}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate tax ID based on country
 */
export function validateTaxId(taxId: string, country: string): boolean {
  switch (country.toUpperCase()) {
    case 'IN':
    case 'INDIA':
      return isValidGSTIN(taxId);
    case 'DE':
    case 'GERMANY':
      return isValidGermanVAT(taxId);
    case 'GB':
    case 'UK':
    case 'UNITED KINGDOM':
      return isValidUKVAT(taxId);
    case 'US':
    case 'USA':
    case 'UNITED STATES':
      return isValidEIN(taxId);
    default:
      return true; // Skip validation for unknown countries
  }
}

/**
 * Sanitize input string (remove dangerous characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): { isValid: boolean; sanitized: string } {
  const sanitized = sanitizeInput(query);
  const isValid = sanitized.length >= 2 && sanitized.length <= 100;
  
  return { isValid, sanitized };
}

/**
 * Check if amount matches invoice total (with tax)
 */
export function validateInvoiceTotal(subtotal: number, taxRate: number, expectedTotal: number): boolean {
  const calculatedTotal = subtotal + (subtotal * taxRate);
  const tolerance = 0.01; // Allow 1 cent difference for rounding
  return Math.abs(calculatedTotal - expectedTotal) <= tolerance;
}

/**
 * Validate password strength
 */
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-5
  feedback: string[];
}

export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }
  
  // Complexity checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Use both uppercase and lowercase letters');
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one number');
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Include at least one special character');
  }
  
  return {
    isValid: score >= 3 && password.length >= 8,
    score,
    feedback,
  };
}
