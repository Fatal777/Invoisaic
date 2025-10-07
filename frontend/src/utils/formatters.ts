/**
 * Utility functions for formatting data
 */

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format date to localized string
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  return d.toLocaleDateString('en-IN');
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format invoice number
 */
export function formatInvoiceNumber(number: string | number, prefix: string = 'INV'): string {
  if (typeof number === 'string' && number.includes(prefix)) {
    return number;
  }
  
  const paddedNumber = String(number).padStart(6, '0');
  return `${prefix}-${new Date().getFullYear()}-${paddedNumber}`;
}

/**
 * Format phone number (International format)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    // Indian number
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US number
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Format tax ID (GSTIN, VAT, etc.)
 */
export function formatTaxId(taxId: string, country: string): string {
  const cleaned = taxId.replace(/\s/g, '');
  
  switch (country.toUpperCase()) {
    case 'IN':
      // GSTIN format: 29ABCDE1234F1Z5
      if (cleaned.length === 15) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7, 11)} ${cleaned.slice(11)}`;
      }
      break;
    case 'DE':
      // German VAT: DE123456789
      if (cleaned.startsWith('DE') && cleaned.length === 11) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
      }
      break;
    case 'GB':
      // UK VAT: GB123456789
      if (cleaned.startsWith('GB') && cleaned.length === 11) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 9)} ${cleaned.slice(9)}`;
      }
      break;
  }
  
  return taxId;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'gray',
    pending: 'yellow',
    sent: 'blue',
    viewed: 'purple',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
    verified: 'green',
    flagged: 'red',
  };
  
  return colors[status.toLowerCase()] || 'gray';
}

/**
 * Calculate days until date
 */
export function daysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is overdue
 */
export function isOverdue(date: string | Date): boolean {
  return daysUntil(date) < 0;
}

/**
 * Format address (multiline to single line)
 */
export function formatAddress(address: string, maxLines: number = 2): string {
  const lines = address.split(/,|\n/).map(line => line.trim());
  if (lines.length <= maxLines) {
    return lines.join(', ');
  }
  return lines.slice(0, maxLines).join(', ') + '...';
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Parse HSN/SAC code description
 */
export function getHSNDescription(code: string): string {
  const descriptions: Record<string, string> = {
    '8471': 'Computers and Data Processing Equipment',
    '8517': 'Telephone Sets and Telecommunications Equipment',
    '9983': 'Information Technology Services',
    '998314': 'IT Software Services',
    '9992': 'Management Consulting Services',
    '8544': 'Insulated Wire, Cable and Conductors',
  };
  
  return descriptions[code] || 'Other Goods/Services';
}
