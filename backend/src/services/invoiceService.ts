import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { SupervisorAgent } from '../agents/supervisorAgent';
import { PricingAgent } from '../agents/pricingAgent';
import { ComplianceAgent } from '../agents/complianceAgent';
import { CustomerIntelligenceAgent } from '../agents/customerIntelligenceAgent';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_INVOICES_TABLE || 'invoisaic-invoices';

export class InvoiceService {
  private supervisorAgent: SupervisorAgent | null = null;
  private pricingAgent: PricingAgent | null = null;
  private complianceAgent: ComplianceAgent | null = null;
  private customerAgent: CustomerIntelligenceAgent | null = null;

  constructor() {
    // Initialize agents lazily to avoid constructor errors
  }

  private initializeAgents() {
    if (!this.supervisorAgent) {
      this.supervisorAgent = new SupervisorAgent();
      this.pricingAgent = new PricingAgent();
      this.complianceAgent = new ComplianceAgent();
      this.customerAgent = new CustomerIntelligenceAgent();
    }
  }

  /**
   * Create invoice with AI agent processing
   */
  async createInvoice(invoiceData: any): Promise<any> {
    this.initializeAgents();
    
    const invoiceId = uuidv4();
    const timestamp = new Date().toISOString();

    // Step 1: Get customer history for context
    const customerHistory = await this.getCustomerHistory(invoiceData.customerId);

    // Step 2: Run AI agents in parallel for efficiency
    const [pricingAnalysis, complianceCheck, customerInsights] = await Promise.all([
      this.pricingAgent!.calculatePricing(invoiceData, customerHistory),
      this.complianceAgent!.validateCompliance(invoiceData, invoiceData.jurisdiction || 'US'),
      this.customerAgent!.analyzeCustomerBehavior(invoiceData.customerId, customerHistory),
    ]);

    // Step 3: Supervisor agent makes final decision
    const supervisorDecision = await this.supervisorAgent!.makeCoordinationDecision(
      pricingAnalysis,
      complianceCheck,
      customerInsights
    );

    // Step 4: Create invoice with AI recommendations
    const invoice = {
      id: invoiceId,
      invoiceNumber: this.generateInvoiceNumber(),
      ...invoiceData,
      status: 'draft',
      agentProcessing: {
        supervisorDecision: supervisorDecision.decision,
        pricingAnalysis,
        complianceCheck,
        customerInsights,
        processingTime: Date.now(),
        confidence: supervisorDecision.confidence,
      },
      aiRecommendations: this.buildRecommendations(
        pricingAnalysis,
        complianceCheck,
        customerInsights
      ),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Step 5: Save to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: invoice,
      })
    );

    return invoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<any> {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id: invoiceId },
      })
    );

    return result.Item;
  }

  /**
   * List invoices with pagination
   */
  async listInvoices(params: any): Promise<any> {
    const { page = 1, pageSize = 20, status, customerId } = params;

    // Build scan parameters
    const scanParams: any = {
      TableName: tableName,
      Limit: pageSize,
    };

    if (status) {
      scanParams.FilterExpression = '#status = :status';
      scanParams.ExpressionAttributeNames = { '#status': 'status' };
      scanParams.ExpressionAttributeValues = { ':status': status };
    }

    const result = await docClient.send(new ScanCommand(scanParams));

    return {
      items: result.Items || [],
      total: result.Count || 0,
      page,
      pageSize,
      hasMore: !!result.LastEvaluatedKey,
    };
  }

  /**
   * Update invoice
   */
  async updateInvoice(invoiceId: string, updates: any): Promise<any> {
    const timestamp = new Date().toISOString();

    const result = await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id: invoiceId },
        UpdateExpression: 'set #data = :data, updatedAt = :timestamp',
        ExpressionAttributeNames: {
          '#data': 'data',
        },
        ExpressionAttributeValues: {
          ':data': updates,
          ':timestamp': timestamp,
        },
        ReturnValues: 'ALL_NEW',
      })
    );

    return result.Attributes;
  }

  /**
   * Delete invoice
   */
  async deleteInvoice(invoiceId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id: invoiceId },
      })
    );
  }

  /**
   * Send invoice (update status and trigger notifications)
   */
  async sendInvoice(invoiceId: string): Promise<any> {
    this.initializeAgents();
    
    const invoice = await this.getInvoice(invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get optimal timing from Customer Intelligence Agent
    const customerHistory = await this.getCustomerHistory(invoice.customerId);
    const timingRecommendation = await this.customerAgent!.recommendInvoiceTiming(
      invoice.customerId,
      customerHistory
    );

    // Update invoice status
    const updatedInvoice = await this.updateInvoice(invoiceId, {
      ...invoice,
      status: 'sent',
      sentAt: new Date().toISOString(),
      timingRecommendation,
    });

    // TODO: Trigger email notification via SES

    return updatedInvoice;
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string): Promise<any> {
    return this.updateInvoice(invoiceId, {
      status: 'paid',
      paidAt: new Date().toISOString(),
    });
  }

  /**
   * Get AI recommendations for an invoice
   */
  async getAIRecommendations(invoiceId: string): Promise<any> {
    const invoice = await this.getInvoice(invoiceId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return invoice.aiRecommendations || [];
  }

  // Helper methods

  private generateInvoiceNumber(): string {
    const prefix = 'INV';
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${year}-${timestamp}`;
  }

  private async getCustomerHistory(customerId: string): Promise<any> {
    // TODO: Implement actual customer history retrieval
    return {
      totalInvoices: 0,
      totalRevenue: 0,
      averagePaymentDays: 30,
      paymentHistory: [],
    };
  }

  private buildRecommendations(
    pricingAnalysis: any,
    complianceCheck: any,
    customerInsights: any
  ): any[] {
    const recommendations = [];

    // Pricing recommendations
    if (pricingAnalysis.volumeDiscount?.percentage > 0) {
      recommendations.push({
        type: 'pricing',
        title: 'Volume Discount Available',
        description: `Apply ${pricingAnalysis.volumeDiscount.percentage}% volume discount`,
        impact: 'high',
        confidence: pricingAnalysis.confidence,
        agentSource: 'pricing',
      });
    }

    // Compliance warnings
    if (complianceCheck.warnings?.length > 0) {
      recommendations.push({
        type: 'risk',
        title: 'Compliance Warnings',
        description: complianceCheck.warnings.join(', '),
        impact: 'high',
        confidence: complianceCheck.confidence,
        agentSource: 'compliance',
      });
    }

    // Customer insights
    if (customerInsights.paymentReliability < 70) {
      recommendations.push({
        type: 'risk',
        title: 'Payment Risk Alert',
        description: 'Customer has lower payment reliability score',
        impact: 'medium',
        confidence: customerInsights.confidence,
        agentSource: 'customer_intelligence',
      });
    }

    return recommendations;
  }
}
