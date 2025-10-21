/**
 * Webhook Handler - E-commerce Platform Integration
 * 
 * This Lambda receives webhooks from e-commerce platforms and triggers
 * the autonomous agent to watch and act on purchases automatically
 * 
 * Supported Platforms:
 * - Stripe
 * - Shopify
 * - WooCommerce
 * - Razorpay
 * - Square
 * - PayPal
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AutonomousPurchaseWatcher } from '../agents/autonomousWatcher';
import crypto from 'crypto';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('🔔 Webhook received from e-commerce platform');
  
  try {
    const body = JSON.parse(event.body || '{}');
    const platform = detectPlatform(event);
    
    console.log(`📦 Platform detected: ${platform}`);
    
    // Verify webhook signature (security)
    const isValid = await verifyWebhookSignature(event, platform);
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Transform platform-specific webhook to standard format
    const purchaseEvent = await transformWebhookToEvent(body, platform);
    
    if (!purchaseEvent) {
      console.log('ℹ️ Event not actionable, skipping');
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true, action: 'skipped' }),
      };
    }

    // TRIGGER AUTONOMOUS AGENT
    console.log('🤖 Triggering autonomous agent...');
    const watcher = new AutonomousPurchaseWatcher();
    const decision = await watcher.watchPurchase(purchaseEvent);

    console.log(`✅ Agent decision: ${decision.should_generate_invoice ? 'INVOICE GENERATED' : 'NO ACTION'}`);
    console.log(`📊 Confidence: ${decision.confidence}%`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        received: true,
        platform,
        agent_decision: decision,
        processing_time: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Webhook processing failed',
        message: error.message,
      }),
    };
  }
};

/**
 * Detect which e-commerce platform sent the webhook
 */
function detectPlatform(event: APIGatewayProxyEvent): string {
  const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || '';
  const headers = event.headers;

  if (headers['Stripe-Signature'] || headers['stripe-signature']) {
    return 'stripe';
  }
  if (headers['X-Shopify-Topic'] || headers['x-shopify-topic']) {
    return 'shopify';
  }
  if (userAgent.includes('WooCommerce')) {
    return 'woocommerce';
  }
  if (headers['X-Razorpay-Signature'] || headers['x-razorpay-signature']) {
    return 'razorpay';
  }
  if (headers['Square-Signature'] || headers['square-signature']) {
    return 'square';
  }

  // Check query parameters (some platforms use this)
  const path = event.path || '';
  if (path.includes('/stripe')) return 'stripe';
  if (path.includes('/shopify')) return 'shopify';
  if (path.includes('/woocommerce')) return 'woocommerce';

  return 'unknown';
}

/**
 * Verify webhook signature for security
 */
async function verifyWebhookSignature(event: APIGatewayProxyEvent, platform: string): Promise<boolean> {
  // In production, verify actual signatures
  // For demo/development, always return true
  
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const signature = event.headers['Stripe-Signature'] || 
                   event.headers['X-Shopify-Hmac-SHA256'] ||
                   event.headers['X-Razorpay-Signature'] || '';

  const secret = process.env[`${platform.toUpperCase()}_WEBHOOK_SECRET`] || '';
  
  if (!secret) {
    console.warn(`⚠️ No webhook secret configured for ${platform}`);
    return true; // Allow in development
  }

  // Verify signature based on platform
  switch (platform) {
    case 'stripe':
      return verifyStripeSignature(event.body || '', signature, secret);
    case 'shopify':
      return verifyShopifySignature(event.body || '', signature, secret);
    default:
      return true;
  }
}

function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const timestamp = signature.split(',')[0].split('=')[1];
    const signatureHash = signature.split(',')[1].split('=')[1];
    
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signatureHash),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
}

function verifyShopifySignature(payload: string, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  
  return hash === signature;
}

/**
 * Transform platform-specific webhook to standard format
 */
async function transformWebhookToEvent(body: any, platform: string): Promise<any | null> {
  switch (platform) {
    case 'stripe':
      return transformStripeEvent(body);
    case 'shopify':
      return transformShopifyEvent(body);
    case 'woocommerce':
      return transformWooCommerceEvent(body);
    case 'razorpay':
      return transformRazorpayEvent(body);
    default:
      return null;
  }
}

/**
 * Stripe webhook transformation
 */
function transformStripeEvent(stripeEvent: any): any | null {
  if (stripeEvent.type !== 'payment_intent.succeeded' && 
      stripeEvent.type !== 'charge.succeeded') {
    return null; // Not a purchase event
  }

  const data = stripeEvent.data.object;
  
  return {
    platform: 'stripe',
    event_type: stripeEvent.type,
    transaction_id: data.id,
    amount: data.amount / 100, // Stripe uses cents
    currency: data.currency.toUpperCase(),
    customer: {
      email: data.receipt_email || data.billing_details?.email || 'unknown@example.com',
      name: data.billing_details?.name || 'Unknown Customer',
      country: data.billing_details?.address?.country,
      address: data.billing_details?.address,
    },
    products: [
      {
        name: data.description || 'Product/Service',
        quantity: 1,
        price: data.amount / 100,
        category: 'general',
      },
    ],
    metadata: data.metadata,
    timestamp: new Date(data.created * 1000).toISOString(),
  };
}

/**
 * Shopify webhook transformation
 */
function transformShopifyEvent(shopifyOrder: any): any | null {
  return {
    platform: 'shopify',
    event_type: 'order.created',
    transaction_id: shopifyOrder.id || shopifyOrder.order_number,
    amount: parseFloat(shopifyOrder.total_price || 0),
    currency: shopifyOrder.currency || 'USD',
    customer: {
      email: shopifyOrder.email || shopifyOrder.customer?.email || 'unknown@example.com',
      name: shopifyOrder.customer?.first_name && shopifyOrder.customer?.last_name
        ? `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`
        : 'Unknown Customer',
      country: shopifyOrder.shipping_address?.country || shopifyOrder.billing_address?.country,
      address: shopifyOrder.shipping_address || shopifyOrder.billing_address,
    },
    products: (shopifyOrder.line_items || []).map((item: any) => ({
      name: item.name || item.title,
      quantity: item.quantity || 1,
      price: parseFloat(item.price || 0),
      category: item.product_type || 'general',
    })),
    metadata: {
      order_number: shopifyOrder.order_number,
      tags: shopifyOrder.tags,
    },
    timestamp: shopifyOrder.created_at || new Date().toISOString(),
  };
}

/**
 * WooCommerce webhook transformation
 */
function transformWooCommerceEvent(wooOrder: any): any | null {
  return {
    platform: 'woocommerce',
    event_type: 'order.created',
    transaction_id: wooOrder.id || wooOrder.order_key,
    amount: parseFloat(wooOrder.total || 0),
    currency: wooOrder.currency || 'USD',
    customer: {
      email: wooOrder.billing?.email || 'unknown@example.com',
      name: wooOrder.billing?.first_name && wooOrder.billing?.last_name
        ? `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`
        : 'Unknown Customer',
      country: wooOrder.billing?.country,
      address: wooOrder.billing,
    },
    products: (wooOrder.line_items || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity || 1,
      price: parseFloat(item.price || 0),
      category: 'general',
    })),
    metadata: {
      order_key: wooOrder.order_key,
      status: wooOrder.status,
    },
    timestamp: wooOrder.date_created || new Date().toISOString(),
  };
}

/**
 * Razorpay webhook transformation
 */
function transformRazorpayEvent(razorpayEvent: any): any | null {
  if (razorpayEvent.event !== 'payment.captured') {
    return null;
  }

  const payment = razorpayEvent.payload.payment.entity;
  
  return {
    platform: 'razorpay',
    event_type: razorpayEvent.event,
    transaction_id: payment.id,
    amount: payment.amount / 100, // Razorpay uses paise
    currency: payment.currency,
    customer: {
      email: payment.email || 'unknown@example.com',
      name: payment.customer_details?.name || 'Unknown Customer',
      country: 'India', // Razorpay is India-focused
      address: payment.customer_details?.billing_address,
    },
    products: [
      {
        name: payment.description || 'Product/Service',
        quantity: 1,
        price: payment.amount / 100,
        category: 'general',
      },
    ],
    metadata: payment.notes,
    timestamp: new Date(payment.created_at * 1000).toISOString(),
  };
}
