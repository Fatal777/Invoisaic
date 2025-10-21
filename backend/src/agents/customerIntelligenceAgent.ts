import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

/**
 * Customer Intelligence Agent - Analyzes payment patterns and behavior
 * Uses Amazon Nova Micro for predictive analytics
 */
export class CustomerIntelligenceAgent {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({});
    this.modelId = process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0';
  }

  /**
   * Analyze customer payment behavior and predict payment likelihood
   */
  async analyzeCustomerBehavior(customerId: string, customerHistory: any): Promise<any> {
    const prompt = this.buildBehaviorAnalysisPrompt(customerId, customerHistory);

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
      
      return this.parseBehaviorResponse(responseBody);
    } catch (error) {
      console.error('Customer Intelligence Agent error:', error);
      throw new Error('Failed to analyze customer behavior');
    }
  }

  /**
   * Predict payment probability and optimal timing
   */
  async predictPaymentBehavior(
    customerId: string,
    invoiceAmount: number,
    customerHistory: any
  ): Promise<any> {
    const prompt = `
You are a Customer Intelligence Agent specializing in payment prediction.

CUSTOMER ID: ${customerId}
INVOICE AMOUNT: $${invoiceAmount}

CUSTOMER HISTORY:
${JSON.stringify(customerHistory, null, 2)}

Analyze and predict:
1. Payment probability (0-100%)
2. Expected payment date
3. Risk of late payment
4. Optimal invoice send time (day of week, time of day)
5. Recommended payment terms
6. Communication strategy

Consider:
- Historical payment patterns
- Payment delays or early payments
- Seasonal trends
- Invoice amount relative to history
- Current economic conditions

Provide:
- payment_probability (0-100)
- expected_payment_days
- risk_score (0-100, higher = more risk)
- optimal_send_time (day and time)
- recommended_terms
- communication_strategy
- confidence_score (0-100)
- reasoning

Respond in JSON format.
`;

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.6,
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parsePaymentPredictionResponse(responseBody);
    } catch (error) {
      console.error('Payment prediction error:', error);
      return {
        paymentProbability: 75,
        expectedPaymentDays: 30,
        riskScore: 25,
        reasoning: 'Error predicting payment behavior',
      };
    }
  }

  /**
   * Calculate customer lifetime value and relationship health
   */
  async assessCustomerValue(customerId: string, customerData: any): Promise<any> {
    const prompt = `
You are a Customer Intelligence Agent assessing customer value.

CUSTOMER ID: ${customerId}

CUSTOMER DATA:
${JSON.stringify(customerData, null, 2)}

Assess:
1. Customer Lifetime Value (CLV)
2. Relationship health score (0-100)
3. Churn risk (0-100)
4. Growth potential
5. Loyalty indicators
6. Engagement level

Provide:
- lifetime_value (estimated total revenue)
- relationship_health (0-100)
- churn_risk (0-100)
- growth_potential (low/medium/high)
- loyalty_score (0-100)
- recommendations (array)
- reasoning

Respond in JSON format.
`;

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.6,
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseCustomerValueResponse(responseBody);
    } catch (error) {
      console.error('Customer value assessment error:', error);
      return {
        lifetimeValue: 0,
        relationshipHealth: 50,
        churnRisk: 50,
        reasoning: 'Error assessing customer value',
      };
    }
  }

  /**
   * Recommend optimal invoice timing based on customer behavior
   */
  async recommendInvoiceTiming(customerId: string, customerHistory: any): Promise<any> {
    const prompt = `
You are a Customer Intelligence Agent optimizing invoice timing.

CUSTOMER ID: ${customerId}

CUSTOMER HISTORY:
${JSON.stringify(customerHistory, null, 2)}

Analyze historical data to recommend:
1. Best day of week to send invoice
2. Best time of day
3. Best day of month (if pattern exists)
4. Avoid periods (holidays, known busy times)
5. Follow-up timing strategy

Consider:
- When customer typically opens emails
- When they make payments
- Industry patterns
- Seasonal variations

Provide:
- optimal_day_of_week
- optimal_time_of_day
- optimal_day_of_month (if applicable)
- avoid_periods (array)
- follow_up_schedule (array)
- expected_improvement (percentage)
- reasoning

Respond in JSON format.
`;

    try {
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.6,
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseTimingResponse(responseBody);
    } catch (error) {
      console.error('Invoice timing recommendation error:', error);
      return {
        optimalDayOfWeek: 'Tuesday',
        optimalTimeOfDay: '10:00 AM',
        reasoning: 'Default recommendation based on industry standards',
      };
    }
  }

  private buildBehaviorAnalysisPrompt(customerId: string, customerHistory: any): string {
    return `
You are an expert Customer Intelligence Agent analyzing payment behavior.

CUSTOMER ID: ${customerId}

CUSTOMER HISTORY:
${JSON.stringify(customerHistory, null, 2)}

Perform comprehensive behavioral analysis:
1. Payment reliability score (0-100)
2. Average payment delay (days)
3. Payment method preferences
4. Communication preferences
5. Seasonal payment patterns
6. Invoice amount sensitivity
7. Relationship trends (improving/declining)
8. Risk indicators

Provide:
- payment_reliability (0-100)
- average_payment_delay (days)
- preferred_payment_method
- communication_preference
- seasonal_patterns (array)
- amount_sensitivity (low/medium/high)
- relationship_trend (improving/stable/declining)
- risk_indicators (array)
- confidence_score (0-100)
- reasoning (detailed explanation)

Respond in JSON format.
`;
  }

  private parseBehaviorResponse(responseBody: any): any {
    const content = responseBody.content?.[0]?.text || responseBody.completion || '';
    
    try {
      const parsed = JSON.parse(content);
      return {
        paymentReliability: parsed.payment_reliability || 75,
        averagePaymentDelay: parsed.average_payment_delay || 0,
        preferredPaymentMethod: parsed.preferred_payment_method || 'bank_transfer',
        communicationPreference: parsed.communication_preference || 'email',
        seasonalPatterns: parsed.seasonal_patterns || [],
        amountSensitivity: parsed.amount_sensitivity || 'medium',
        relationshipTrend: parsed.relationship_trend || 'stable',
        riskIndicators: parsed.risk_indicators || [],
        confidence: parsed.confidence_score || 80,
        reasoning: parsed.reasoning || 'Behavior analysis completed',
      };
    } catch {
      return {
        paymentReliability: 75,
        averagePaymentDelay: 0,
        confidence: 50,
        reasoning: content,
      };
    }
  }

  private parsePaymentPredictionResponse(responseBody: any): any {
    const content = responseBody.content?.[0]?.text || responseBody.completion || '';
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        paymentProbability: 75,
        expectedPaymentDays: 30,
        riskScore: 25,
        reasoning: content,
      };
    }
  }

  private parseCustomerValueResponse(responseBody: any): any {
    const content = responseBody.content?.[0]?.text || responseBody.completion || '';
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        lifetimeValue: 0,
        relationshipHealth: 50,
        churnRisk: 50,
        reasoning: content,
      };
    }
  }

  private parseTimingResponse(responseBody: any): any {
    const content = responseBody.content?.[0]?.text || responseBody.completion || '';
    
    try {
      return JSON.parse(content);
    } catch {
      return {
        optimalDayOfWeek: 'Tuesday',
        optimalTimeOfDay: '10:00 AM',
        reasoning: content,
      };
    }
  }
}
