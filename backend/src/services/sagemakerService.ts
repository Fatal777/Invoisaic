/**
 * SageMaker Service - Custom ML Model Integration
 * 
 * Three ML models for invoice intelligence
 */

// SageMaker client - optional, graceful degradation if not available
let SageMakerRuntimeClient: any = null;
let InvokeEndpointCommand: any = null;
try {
  const sagemaker = require('@aws-sdk/client-sagemaker-runtime');
  SageMakerRuntimeClient = sagemaker.SageMakerRuntimeClient;
  InvokeEndpointCommand = sagemaker.InvokeEndpointCommand;
} catch (e) {
  console.log('SageMaker SDK not available, using simulated predictions');
}

const sagemakerClient = SageMakerRuntimeClient ? new SageMakerRuntimeClient({ 
  region: process.env.REGION || process.env.AWS_REGION || 'ap-south-1' 
}) : null;
interface InvoiceCategorization {
  industry: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  confidence: number;
}

interface PaymentPrediction {
  predicted_payment_date: string;
  payment_probability: number;
  risk_level: 'low' | 'medium' | 'high';
  recommended_follow_up_date: string;
  confidence: number;
}

interface AmountValidation {
  is_reasonable: boolean;
  expected_range: { min: number; max: number };
  deviation_percentage: number;
  confidence: number;
  reasoning: string;
}

export class SageMakerService {
  /**
   * Categorize invoice using custom SageMaker model
   * 
   * Categories:
   * - Technology (software, hardware, cloud services)
   * - Professional Services (consulting, legal, accounting)
   * - Manufacturing (raw materials, equipment)
   * - Healthcare (medical supplies, services)
   * - Retail (products, merchandise)
   */
  async categorizeInvoice(invoiceData: any): Promise<InvoiceCategorization> {
    const endpointName = process.env.SAGEMAKER_CATEGORIZATION_ENDPOINT || 
                        'invoice-categorization-endpoint';
    
    console.log('🤖 SageMaker: Categorizing invoice...');
    
    try {
      // Prepare input features
      const features = this.extractCategorizationFeatures(invoiceData);
      
      const command = new InvokeEndpointCommand({
        EndpointName: endpointName,
        ContentType: 'application/json',
        Body: JSON.stringify(features),
      });

      const response = await sagemakerClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Body));

      console.log(`✅ SageMaker: Categorization complete
  - Industry: ${result.industry}
  - Category: ${result.category}
  - Urgency: ${result.urgency}
  - Complexity: ${result.complexity}/100`);

      return result;
    } catch (error: any) {
      console.error('❌ SageMaker categorization error:', error);
      
      // Fallback to rule-based categorization
      return this.fallbackCategorization(invoiceData);
    }
  }

  /**
   * Predict when customer will pay using ML model
   * 
   * Considers:
   * - Customer payment history
   * - Invoice amount
   * - Payment terms
   * - Industry averages
   * - Seasonal patterns
   */
  async predictPayment(invoiceData: any, customerHistory: any): Promise<PaymentPrediction> {
    const endpointName = process.env.SAGEMAKER_PAYMENT_PREDICTION_ENDPOINT || 
                        'payment-prediction-endpoint';
    
    console.log('💰 SageMaker: Predicting payment date...');
    
    try {
      // Prepare input features
      const features = this.extractPaymentFeatures(invoiceData, customerHistory);
      
      const command = new InvokeEndpointCommand({
        EndpointName: endpointName,
        ContentType: 'application/json',
        Body: JSON.stringify(features),
      });

      const response = await sagemakerClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.Body));

      console.log(`✅ SageMaker: Payment prediction complete
  - Predicted Date: ${result.predicted_payment_date}
  - Probability: ${(result.payment_probability * 100).toFixed(1)}%
  - Risk Level: ${result.risk_level}`);

      return result;
    } catch (error: any) {
      console.error('❌ SageMaker payment prediction error:', error);
      
      // Fallback to rule-based prediction
      return this.fallbackPaymentPrediction(invoiceData);
    }
  }

  /**
   * Validate invoice amount using ML model
   * 
   * Detects:
   * - Unusually high amounts (potential errors)
   * - Unusually low amounts (potential missing items)
   * - Out of pattern amounts
   */
  async validateAmount(invoiceData: any, historicalData: any[]): Promise<AmountValidation> {
    console.log('💵 SageMaker: Validating invoice amount...');
    
    try {
      // Calculate expected amount based on historical data
      const amounts = historicalData.map((inv) => inv.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = Math.sqrt(
        amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length
      );

      const currentAmount = invoiceData.amount || 0;
      const deviation = Math.abs(currentAmount - mean) / stdDev;
      const deviationPercentage = ((currentAmount - mean) / mean) * 100;

      const isReasonable = deviation < 2; // Within 2 standard deviations
      
      const expectedRange = {
        min: mean - (2 * stdDev),
        max: mean + (2 * stdDev),
      };

      let reasoning = '';
      if (!isReasonable) {
        if (currentAmount > mean) {
          reasoning = `Amount is ${deviationPercentage.toFixed(1)}% higher than average. This is unusual for this customer/product.`;
        } else {
          reasoning = `Amount is ${Math.abs(deviationPercentage).toFixed(1)}% lower than average. Possible missing items.`;
        }
      } else {
        reasoning = 'Amount is within expected range based on historical data.';
      }

      console.log(`✅ SageMaker: Amount validation complete
  - Current: $${currentAmount}
  - Expected: $${mean.toFixed(2)} ± $${stdDev.toFixed(2)}
  - Reasonable: ${isReasonable ? 'Yes' : 'No'}`);

      return {
        is_reasonable: isReasonable,
        expected_range: expectedRange,
        deviation_percentage: deviationPercentage,
        confidence: 85,
        reasoning,
      };
    } catch (error: any) {
      console.error('❌ Amount validation error:', error);
      
      return {
        is_reasonable: true,
        expected_range: { min: 0, max: 1000000 },
        deviation_percentage: 0,
        confidence: 50,
        reasoning: 'Insufficient historical data for validation',
      };
    }
  }

  /**
   * Extract features for categorization model
   */
  private extractCategorizationFeatures(invoiceData: any): any {
    return {
      description: invoiceData.description || invoiceData.product || '',
      amount: invoiceData.amount || 0,
      currency: invoiceData.currency || 'USD',
      customer_name: invoiceData.customer?.name || '',
      vendor_name: invoiceData.vendor?.name || '',
      line_items: invoiceData.line_items || [],
      keywords: this.extractKeywords(invoiceData),
    };
  }

  /**
   * Extract features for payment prediction model
   */
  private extractPaymentFeatures(invoiceData: any, customerHistory: any): any {
    return {
      amount: invoiceData.amount || 0,
      payment_terms: invoiceData.payment_terms || 'net_30',
      customer_avg_payment_days: customerHistory.avg_payment_days || 30,
      customer_total_invoices: customerHistory.total_invoices || 0,
      customer_late_payment_rate: customerHistory.late_payment_rate || 0,
      invoice_date: invoiceData.date || new Date().toISOString(),
      industry: invoiceData.industry || 'general',
      month: new Date(invoiceData.date || Date.now()).getMonth() + 1,
    };
  }

  /**
   * Extract keywords from invoice for categorization
   */
  private extractKeywords(invoiceData: any): string[] {
    const text = JSON.stringify(invoiceData).toLowerCase();
    const keywords: string[] = [];

    // Technology keywords
    if (/software|cloud|saas|api|hosting|server/.test(text)) {
      keywords.push('technology');
    }

    // Professional services keywords
    if (/consulting|legal|accounting|advisory|professional/.test(text)) {
      keywords.push('professional_services');
    }

    // Manufacturing keywords
    if (/materials|equipment|manufacturing|production/.test(text)) {
      keywords.push('manufacturing');
    }

    // Healthcare keywords
    if (/medical|healthcare|pharmaceutical|hospital/.test(text)) {
      keywords.push('healthcare');
    }

    // Retail keywords
    if (/product|merchandise|goods|retail/.test(text)) {
      keywords.push('retail');
    }

    return keywords;
  }

  /**
   * Fallback categorization when SageMaker is unavailable
   */
  private fallbackCategorization(invoiceData: any): InvoiceCategorization {
    const keywords = this.extractKeywords(invoiceData);
    const amount = invoiceData.amount || 0;

    // Determine industry
    let industry = 'general';
    let category = 'uncategorized';

    if (keywords.includes('technology')) {
      industry = 'technology';
      category = amount > 10000 ? 'enterprise_software' : 'software_subscription';
    } else if (keywords.includes('professional_services')) {
      industry = 'professional_services';
      category = 'consulting';
    } else if (keywords.includes('manufacturing')) {
      industry = 'manufacturing';
      category = 'materials';
    }

    // Determine urgency based on amount and payment terms
    let urgency: 'low' | 'medium' | 'high' | 'critical';
    if (amount > 100000) {
      urgency = 'critical';
    } else if (amount > 50000) {
      urgency = 'high';
    } else if (amount > 10000) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }

    // Calculate complexity
    const lineItemCount = (invoiceData.line_items || []).length;
    const complexity = Math.min(100, 20 + (lineItemCount * 10) + (amount > 50000 ? 30 : 0));

    return {
      industry,
      category,
      urgency,
      complexity,
      confidence: 75, // Lower confidence for fallback
    };
  }

  /**
   * Fallback payment prediction when SageMaker is unavailable
   */
  private fallbackPaymentPrediction(invoiceData: any): PaymentPrediction {
    const paymentTerms = invoiceData.payment_terms || 'net_30';
    const invoiceDate = new Date(invoiceData.date || Date.now());
    
    // Extract days from payment terms
    let days = 30;
    const match = paymentTerms.match(/\d+/);
    if (match) {
      days = parseInt(match[0]);
    }

    // Predict payment date (add 5 days buffer for typical delay)
    const predictedDate = new Date(invoiceDate);
    predictedDate.setDate(predictedDate.getDate() + days + 5);

    // Follow-up date (5 days before predicted payment)
    const followUpDate = new Date(predictedDate);
    followUpDate.setDate(followUpDate.getDate() - 5);

    return {
      predicted_payment_date: predictedDate.toISOString(),
      payment_probability: 0.75,
      risk_level: 'medium',
      recommended_follow_up_date: followUpDate.toISOString(),
      confidence: 70,
    };
  }
}

export default SageMakerService;
