import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

/**
 * Pricing Agent - Handles complex pricing calculations
 * Uses Amazon Nova Micro for pricing intelligence
 */
export class PricingAgent {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({});
    // Use inference profile instead of direct model ID
    this.modelId = process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0';
  }

  /**
   * Calculate optimal pricing with AI reasoning
   */
  async calculatePricing(invoiceData: any, customerHistory: any): Promise<any> {
    const prompt = this.buildPricingPrompt(invoiceData, customerHistory);

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [{ text: prompt }],
            },
          ],
          inferenceConfig: {
            maxTokens: 2000,
            temperature: 0.7,
          },
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parsePricingResponse(responseBody);
    } catch (error: any) {
      console.error('Pricing Agent error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Model ID:', this.modelId);
      throw new Error(`Failed to calculate pricing: ${error.message || error}`);
    }
  }

  /**
   * Calculate volume discounts using LLM reasoning
   */
  async calculateVolumeDiscount(
    baseAmount: number,
    quantity: number,
    customerTier: string
  ): Promise<any> {
    const prompt = `
You are a Pricing Agent specializing in volume discount calculations.

BASE AMOUNT: $${baseAmount}
QUANTITY: ${quantity}
CUSTOMER TIER: ${customerTier}

Calculate the optimal volume discount considering:
1. Industry standard volume discount tiers
2. Customer loyalty tier
3. Competitive pricing strategies
4. Profit margin optimization

Provide:
- Recommended discount percentage
- Final amount after discount
- Reasoning for the discount
- Impact on profit margin

Respond in JSON format.
`;

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.5,
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseDiscountResponse(responseBody);
    } catch (error) {
      console.error('Volume discount calculation error:', error);
      return {
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: baseAmount,
        reasoning: 'Error calculating discount',
      };
    }
  }

  /**
   * Calculate early payment discount
   */
  async calculateEarlyPaymentDiscount(
    amount: number,
    paymentTerms: string,
    customerReliability: number
  ): Promise<any> {
    const prompt = `
You are a Pricing Agent optimizing cash flow through early payment incentives.

INVOICE AMOUNT: $${amount}
PAYMENT TERMS: ${paymentTerms}
CUSTOMER RELIABILITY SCORE: ${customerReliability}/100

Calculate an optimal early payment discount that:
1. Incentivizes faster payment
2. Improves cash flow
3. Maintains profitability
4. Considers customer reliability

Provide:
- Early payment discount percentage (if paid within 10 days)
- Standard payment terms
- Expected cash flow improvement
- Reasoning

Respond in JSON format.
`;

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.6,
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseEarlyPaymentResponse(responseBody);
    } catch (error) {
      console.error('Early payment discount error:', error);
      return {
        earlyPaymentDiscount: 0,
        reasoning: 'Error calculating early payment discount',
      };
    }
  }

  private buildPricingPrompt(invoiceData: any, customerHistory: any): string {
    return `
You are an expert Pricing Agent using AI to optimize invoice pricing.

INVOICE DATA:
${JSON.stringify(invoiceData, null, 2)}

CUSTOMER HISTORY:
${JSON.stringify(customerHistory, null, 2)}

Analyze and provide:
1. Recommended pricing for each line item
2. Volume discount recommendations
3. Loyalty adjustments based on customer history
4. Currency conversion if needed
5. Early payment discount suggestions
6. Competitive pricing analysis
7. Overall pricing strategy

Respond in JSON format with:
- recommended_prices (array)
- volume_discount (percentage and amount)
- loyalty_adjustment (percentage and amount)
- early_payment_discount (percentage)
- total_recommended_amount
- confidence_score (0-100)
- reasoning (detailed explanation)
`;
  }

  private parsePricingResponse(responseBody: any): any {
    const content = responseBody.content?.[0]?.text || responseBody.completion || '';
    
    try {
      const parsed = JSON.parse(content);
      return {
        recommendedPrice: parsed.total_recommended_amount || 0,
        volumeDiscount: parsed.volume_discount || { percentage: 0, amount: 0 },
        loyaltyAdjustment: parsed.loyalty_adjustment || { percentage: 0, amount: 0 },
        earlyPaymentDiscount: parsed.early_payment_discount || 0,
        confidence: parsed.confidence_score || 85,
        reasoning: parsed.reasoning || 'Pricing calculated based on market analysis',
      };
    } catch {
      return {
        recommendedPrice: 0,
        confidence: 0,
        reasoning: content,
      };
    }
  }

  private parseDiscountResponse(responseBody: any): any {
    const content = responseBody.content?.[0]?.text || responseBody.completion || '';
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        discountPercentage: 0,
        discountAmount: 0,
        reasoning: content,
      };
    }
  }

  private parseEarlyPaymentResponse(responseBody: any): any {
    const content = responseBody.content?.[0]?.text || responseBody.completion || '';
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        earlyPaymentDiscount: 0,
        reasoning: content,
      };
    }
  }
}
