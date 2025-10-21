/**
 * E-commerce Demo Components
 * Reusable UI components for the e-commerce demo
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Plus, Minus, Trash2, ShoppingCart, Check, X, 
  AlertCircle, Info, CheckCircle, Loader2, Package,
  CreditCard, Truck, Clock, Award, Shield, Tag
} from 'lucide-react';
import { Product, CartItem, LogEntry, ShippingOption, PaymentMethod } from './types';

// Product Card Component
interface ProductCardProps {
  product: Omit<Product, 'quantity'>;
  onAddToCart: (product: Omit<Product, 'quantity'>) => void;
  isInCart: boolean;
  cartQuantity?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  isInCart, 
  cartQuantity = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden hover:border-[#F97272] transition-all duration-300 group"
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
          {product.image}
        </div>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.originalPrice && (
            <span className="px-2 py-1 bg-[#F97272] text-white text-xs font-bold rounded">
              SALE
            </span>
          )}
          {!product.inStock && (
            <span className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded">
              OUT OF STOCK
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 bg-black/80 hover:bg-[#F97272] rounded-lg transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        {/* Brand & Category */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
            {product.brand}
          </span>
          <span className="text-xs text-gray-600 px-2 py-1 bg-gray-900 rounded">
            {product.category}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-lg mb-2 group-hover:text-[#F97272] transition-colors line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating) 
                    ? 'text-yellow-500 fill-yellow-500' 
                    : 'text-gray-700'
                }`} 
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {product.rating} ({product.reviews.toLocaleString()})
          </span>
        </div>

        {/* Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {product.features.slice(0, 3).map((feature, i) => (
              <span 
                key={i}
                className="text-xs text-gray-600 bg-gray-900 px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
            {product.features.length > 3 && (
              <span className="text-xs text-gray-500">
                +{product.features.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex items-end gap-2 mb-4">
          <div className="text-2xl font-bold text-white">
            ₹{product.price.toLocaleString()}
          </div>
          {product.originalPrice && (
            <div className="text-sm text-gray-500 line-through mb-1">
              ₹{product.originalPrice.toLocaleString()}
            </div>
          )}
          {product.originalPrice && (
            <div className="text-sm text-green-500 font-semibold mb-1">
              {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
            </div>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product)}
          disabled={!product.inStock}
          className={`w-full px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            product.inStock
              ? 'bg-[#F97272] hover:bg-[#f85c5c] text-white'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isInCart ? (
            <>
              <Check className="w-5 h-5" />
              In Cart ({cartQuantity})
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// Cart Item Component
interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export const CartItemComponent: React.FC<CartItemProps> = ({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 bg-black border border-gray-800 rounded-lg"
    >
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center text-2xl">
          {item.image}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1 truncate">{item.name}</h4>
          <p className="text-xs text-gray-500 mb-2">₹{item.price.toLocaleString()}</p>
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 bg-gray-900 hover:bg-gray-800 rounded flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold text-sm">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 bg-gray-900 hover:bg-gray-800 rounded flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemove(item.id)}
              className="ml-auto p-2 hover:bg-[#F97272] rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Item Total */}
          <div className="mt-2 text-right">
            <span className="font-bold text-white">
              ₹{(item.price * item.quantity).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Log Entry Component
interface LogEntryProps {
  log: LogEntry;
}

export const LogEntryComponent: React.FC<LogEntryProps> = ({ log }) => {
  const getIcon = () => {
    switch (log.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <X className="w-4 h-4 text-[#EFA498]" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTextColor = () => {
    switch (log.type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-[#F76B5E]';
      case 'warning':
        return 'text-yellow-400';
      case 'processing':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 hover:bg-gray-900/50 rounded transition-colors"
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-600">
            {log.timestamp.toLocaleTimeString()}
          </span>
          <span className="text-xs text-gray-700 uppercase tracking-wide">
            {log.category}
          </span>
        </div>
        <div className={`text-sm font-medium ${getTextColor()}`}>
          {log.message}
        </div>
        {log.details && (
          <div className="text-xs text-gray-600 mt-1">
            {log.details}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Shipping Option Component
interface ShippingOptionProps {
  option: ShippingOption;
  isSelected: boolean;
  onSelect: (option: ShippingOption) => void;
}

export const ShippingOptionComponent: React.FC<ShippingOptionProps> = ({
  option,
  isSelected,
  onSelect
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(option)}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-[#F97272] bg-[#F97272]/10'
          : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{option.icon}</div>
          <div>
            <div className="font-semibold text-sm">{option.name}</div>
            <div className="text-xs text-gray-500">{option.description}</div>
            <div className="text-xs text-gray-600 mt-1">
              {option.estimatedDays} business days
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">
            {option.cost === 0 ? 'FREE' : `₹${option.cost}`}
          </div>
          {option.trackingAvailable && (
            <div className="text-xs text-green-500 flex items-center gap-1 mt-1">
              <Package className="w-3 h-3" />
              Tracking
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Payment Method Component
interface PaymentMethodProps {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: (method: PaymentMethod) => void;
}

export const PaymentMethodComponent: React.FC<PaymentMethodProps> = ({
  method,
  isSelected,
  onSelect
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(method)}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-[#F97272] bg-[#F97272]/10'
          : 'border-gray-800 hover:border-gray-700'
      } ${!method.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{method.icon}</div>
          <div>
            <div className="font-semibold text-sm">{method.name}</div>
            {method.description && (
              <div className="text-xs text-gray-500">{method.description}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          {method.processingFee && method.processingFee > 0 && (
            <div className="text-xs text-gray-500">
              +₹{method.processingFee} fee
            </div>
          )}
          {!method.isAvailable && (
            <div className="text-xs text-[#EFA498]">Unavailable</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => {
  return (
    <div className={`w-full bg-gray-800 rounded-full h-2 ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-[#F97272] h-2 rounded-full"
      />
    </div>
  );
};

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <Loader2 className={`animate-spin text-[#F97272] ${sizeClasses[size]} ${className}`} />
  );
};

// Badge Component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md' 
}) => {
  const variantClasses = {
    default: 'bg-gray-800 text-gray-300',
    success: 'bg-green-600/20 text-green-400 border border-green-600/30',
    error: 'bg-[#F97272]/20 text-[#F76B5E] border border-[#F97272]/30',
    warning: 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30',
    info: 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action 
}) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};
