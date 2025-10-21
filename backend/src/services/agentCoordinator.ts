import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { TextractClient, AnalyzeDocumentCommand, Block } from '@aws-sdk/client-textract';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);
const textractClient = new TextractClient({ region: process.env.AWS_REGION || 'ap-south-1' });

interface ExtractedField {
  fieldName: string;
  value: string;
  confidence: number;
  boundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  page: number;
}

/**
 * Agent Coordinator - Orchestrates multiple AI agents for invoice processing
 * Sends real-time updates via WebSocket
 */
export class AgentCoordinator {
  private connectionId: string;
  private domainName: string;
  private stage: string;
  private apiGateway: ApiGatewayManagementApiClient;

  constructor(connectionId: string, domainName: string, stage: string) {
    this.connectionId = connectionId;
    this.domainName = domainName;
    this.stage = stage;

    const endpoint = `https://${domainName}/${stage}`;
    this.apiGateway = new ApiGatewayManagementApiClient({ endpoint });
  }

  /**
   * Main orchestration method - runs all agents in sequence
   */
  async orchestrateInvoiceProcessing(s3Bucket: string, s3Key: string): Promise<void> {
    try {
      // Step 1: OCR Agent
      await this.sendAgentActivity('OCR Agent', 'running', 'Starting document text extraction...');

      let extractedFields: ExtractedField[] = [];
      try {
        extractedFields = await this.runOCRAgent(s3Bucket, s3Key);
        await this.sendAgentActivity('OCR Agent', 'completed', `Extracted ${extractedFields.length} fields successfully`);
      } catch (ocrError) {
        console.error('OCR failed:', ocrError);
        await this.sendAgentActivity('OCR Agent', 'completed', 'OCR completed with limited data');
        // Continue with empty fields rather than failing completely
      }

      // Step 2: Validation Agent
      await this.sendAgentActivity('Validation Agent', 'running', 'Validating extracted data...');
      await this.delay(2000);
      const validationResult = await this.runValidationAgent(extractedFields);
      await this.sendAgentActivity('Validation Agent', 'completed',
        validationResult.isValid ? 'All fields validated successfully' : 'Validation found issues');

      // STOP if validation failed
      if (!validationResult.isValid) {
        await this.sendProcessingComplete('REJECTED', {
          fieldsExtracted: extractedFields.length,
          validationPassed: false,
          taxCompliant: null,
          fraudRisk: null,
          glEntriesCreated: 0,
          reason: 'Validation failed: ' + validationResult.errors.join(', ')
        });
        return;
      }

      // Step 3: Tax Compliance Agent
      await this.sendAgentActivity('Tax Compliance Agent', 'running', 'Checking tax compliance...');
      await this.delay(2000);
      const taxResult = await this.runTaxComplianceAgent(extractedFields);
      await this.sendAgentActivity('Tax Compliance Agent', 'completed',
        taxResult.isCompliant ? 'Invoice is tax compliant' : 'Tax compliance issues detected');

      // Send tax breakdown data for UI panel
      await this.sendTaxAnalysis(taxResult, extractedFields);

      // STOP if tax compliance failed
      if (!taxResult.isCompliant) {
        await this.sendProcessingComplete('REJECTED', {
          fieldsExtracted: extractedFields.length,
          validationPassed: true,
          taxCompliant: false,
          fraudRisk: null,
          glEntriesCreated: 0,
          reason: 'Tax compliance failed: ' + taxResult.violations.join(', ')
        });
        return;
      }

      // Step 4: Fraud Detection Agent
      await this.sendAgentActivity('Fraud Detection Agent', 'running', 'Analyzing for fraud patterns...');
      await this.delay(2000);
      const fraudResult = await this.runFraudDetectionAgent(extractedFields);
      await this.sendAgentActivity('Fraud Detection Agent', 'completed',
        `Fraud risk score: ${fraudResult.riskScore}% (${fraudResult.riskLevel})`);

      // Send fraud analysis data for heat map
      await this.sendFraudAnalysis(fraudResult, extractedFields);

      // STOP if high fraud risk
      if (fraudResult.riskScore > 50) {
        await this.sendProcessingComplete('REJECTED', {
          fieldsExtracted: extractedFields.length,
          validationPassed: true,
          taxCompliant: true,
          fraudRisk: fraudResult.riskScore,
          glEntriesCreated: 0,
          reason: `High fraud risk: ${fraudResult.flags.join(', ')}`
        });
        return;
      }

      // Step 5: GL Coding Agent (only runs if everything passed)
      await this.sendAgentActivity('GL Coding Agent', 'running', 'Assigning general ledger codes...');
      await this.delay(2000);
      const glResult = await this.runGLCodingAgent(extractedFields);
      await this.sendAgentActivity('GL Coding Agent', 'completed',
        `Created ${glResult.entries.length} GL entries`);

      // Send GL entries data for preview panel
      await this.sendGLEntries(glResult);

      // All checks passed - APPROVED
      await this.sendProcessingComplete('APPROVED', {
        fieldsExtracted: extractedFields.length,
        validationPassed: true,
        taxCompliant: true,
        fraudRisk: fraudResult.riskScore,
        glEntriesCreated: glResult.entries.length
      });

    } catch (error) {
      console.error('Agent orchestration error:', error);
      await this.sendMessage({
        type: 'error',
        data: {
          message: 'Processing failed',
          error: String(error)
        }
      });
    }
  }

  /**
   * OCR Agent - Extracts fields with coordinates using Textract
   */
  private async runOCRAgent(s3Bucket: string, s3Key: string): Promise<ExtractedField[]> {
    const response = await textractClient.send(new AnalyzeDocumentCommand({
      Document: {
        S3Object: { Bucket: s3Bucket, Name: s3Key }
      },
      FeatureTypes: ['FORMS', 'TABLES']
    }));

    const blocks = response.Blocks || [];
    const fields: ExtractedField[] = [];

    // Find KEY_VALUE_SET blocks
    const keyValueBlocks = blocks.filter(block => block.BlockType === 'KEY_VALUE_SET');

    for (const kvBlock of keyValueBlocks) {
      if (kvBlock.EntityTypes?.includes('KEY')) {
        const valueBlock = this.findValueBlock(kvBlock, blocks);

        if (valueBlock && valueBlock.Geometry?.BoundingBox) {
          const fieldName = this.getBlockText(kvBlock, blocks);
          const value = this.getBlockText(valueBlock, blocks);

          const field: ExtractedField = {
            fieldName,
            value,
            confidence: valueBlock.Confidence || 0,
            boundingBox: {
              left: valueBlock.Geometry.BoundingBox.Left || 0,
              top: valueBlock.Geometry.BoundingBox.Top || 0,
              width: valueBlock.Geometry.BoundingBox.Width || 0,
              height: valueBlock.Geometry.BoundingBox.Height || 0
            },
            page: valueBlock.Page || 1
          };

          fields.push(field);

          // Send field extraction event with coordinates
          await this.sendMessage({
            type: 'field_extracted',
            data: field
          });

          await this.delay(500); // Small delay for visual effect
        }
      }
    }

    return fields;
  }

  /**
   * Validation Agent - Validates extracted data
   */
  private async runValidationAgent(fields: ExtractedField[]): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for required fields
    const requiredFields = ['Invoice Number', 'Date', 'Total', 'Amount'];
    for (const required of requiredFields) {
      const found = fields.some(f => f.fieldName.toLowerCase().includes(required.toLowerCase()));
      if (!found) {
        errors.push(`Missing required field: ${required}`);
      }
    }

    // Check confidence scores
    const lowConfidenceFields = fields.filter(f => f.confidence < 0.85);
    if (lowConfidenceFields.length > 0) {
      errors.push(`${lowConfidenceFields.length} fields have low confidence (<85%)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Tax Compliance Agent - Checks tax compliance
   */
  private async runTaxComplianceAgent(fields: ExtractedField[]): Promise<{ isCompliant: boolean; violations: string[] }> {
    const violations: string[] = [];

    // Extract tax-related fields
    const totalField = fields.find(f => f.fieldName.toLowerCase().includes('total'));
    const taxField = fields.find(f => f.fieldName.toLowerCase().includes('tax') || f.fieldName.toLowerCase().includes('gst'));

    if (!taxField) {
      violations.push('Tax/GST field not found on invoice');
    }

    // Simple tax rate validation (assuming 18% GST for India)
    if (totalField && taxField) {
      const total = parseFloat(totalField.value.replace(/[^\d.]/g, ''));
      const tax = parseFloat(taxField.value.replace(/[^\d.]/g, ''));

      if (!isNaN(total) && !isNaN(tax)) {
        const expectedTax = total * 0.18 / 1.18;
        const difference = Math.abs(tax - expectedTax);

        if (difference > total * 0.02) { // 2% tolerance
          violations.push(`Tax calculation may be incorrect (Expected: ~${expectedTax.toFixed(2)}, Found: ${tax})`);
        }
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations
    };
  }

  /**
   * Fraud Detection Agent - Detects anomalies
   */
  private async runFraudDetectionAgent(fields: ExtractedField[]): Promise<{ riskScore: number; riskLevel: string; flags: string[] }> {
    const flags: string[] = [];
    let riskScore = 0;

    // Check for duplicate invoice numbers (simplified - would check DB in production)
    const invoiceNumber = fields.find(f => f.fieldName.toLowerCase().includes('invoice'));
    if (!invoiceNumber) {
      flags.push('Missing invoice number');
      riskScore += 20;
    }

    // Check for unusual amounts
    const totalField = fields.find(f => f.fieldName.toLowerCase().includes('total'));
    if (totalField) {
      const amount = parseFloat(totalField.value.replace(/[^\d.]/g, ''));
      if (amount > 1000000) {
        flags.push('Unusually high amount');
        riskScore += 15;
      }
    }

    // Check for low confidence fields
    const lowConfidence = fields.filter(f => f.confidence < 0.70);
    if (lowConfidence.length > 2) {
      flags.push(`${lowConfidence.length} fields with very low confidence`);
      riskScore += 10;
    }

    const riskLevel = riskScore > 50 ? 'HIGH' : riskScore > 25 ? 'MEDIUM' : 'LOW';

    return { riskScore, riskLevel, flags };
  }

  /**
   * GL Coding Agent - Assigns GL codes
   */
  private async runGLCodingAgent(fields: ExtractedField[]): Promise<{ entries: any[] }> {
    const entries = [];

    const totalField = fields.find(f => f.fieldName.toLowerCase().includes('total'));
    const taxField = fields.find(f => f.fieldName.toLowerCase().includes('tax'));

    if (totalField) {
      const total = parseFloat(totalField.value.replace(/[^\d.]/g, ''));
      const tax = taxField ? parseFloat(taxField.value.replace(/[^\d.]/g, '')) : 0;
      const subtotal = total - tax;

      // Debit: Expense Account
      entries.push({
        account: 'Office Expenses',
        accountCode: '6100',
        debit: subtotal,
        credit: 0,
        description: 'Invoice expense'
      });

      // Debit: Input Tax
      if (tax > 0) {
        entries.push({
          account: 'Input GST',
          accountCode: '1530',
          debit: tax,
          credit: 0,
          description: 'GST on purchases'
        });
      }

      // Credit: Accounts Payable
      entries.push({
        account: 'Accounts Payable',
        accountCode: '2100',
        debit: 0,
        credit: total,
        description: 'Vendor invoice payable'
      });
    }

    return { entries };
  }

  /**
   * Make final decision based on all agent results
   */
  private makeFinalDecision(validation: any, tax: any, fraud: any): 'APPROVED' | 'REJECTED' {
    if (!validation.isValid) return 'REJECTED';
    if (!tax.isCompliant) return 'REJECTED';
    if (fraud.riskScore > 50) return 'REJECTED';

    return 'APPROVED';
  }

  /**
   * Helper methods
   */
  private findValueBlock(keyBlock: Block, allBlocks: Block[]): Block | undefined {
    const valueId = keyBlock.Relationships?.find(rel => rel.Type === 'VALUE')?.Ids?.[0];
    return allBlocks.find(block => block.Id === valueId);
  }

  private getBlockText(block: Block, allBlocks: Block[]): string {
    const childIds = block.Relationships?.find(rel => rel.Type === 'CHILD')?.Ids || [];
    const childBlocks = allBlocks.filter(b => childIds.includes(b.Id || ''));
    return childBlocks.map(b => b.Text || '').join(' ').trim();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * WebSocket messaging methods
   */
  private async sendAgentActivity(agentName: string, status: string, message: string): Promise<void> {
    await this.sendMessage({
      type: 'agent_activity',
      data: {
        agentName,
        status,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  private async sendProcessingComplete(decision: string, summary: any): Promise<void> {
    await this.sendMessage({
      type: 'processing_complete',
      data: {
        message: 'All agents completed successfully',
        decision,
        timestamp: new Date().toISOString(),
        summary
      }
    });
  }

  /**
   * Send tax analysis data for Tax Breakdown Panel
   */
  private async sendTaxAnalysis(taxResult: any, fields: ExtractedField[]): Promise<void> {
    const totalField = fields.find(f => f.fieldName.toLowerCase().includes('total'));
    const taxField = fields.find(f => f.fieldName.toLowerCase().includes('tax') || f.fieldName.toLowerCase().includes('gst'));

    const total = totalField ? parseFloat(totalField.value.replace(/[^\d.]/g, '')) : 0;
    const tax = taxField ? parseFloat(taxField.value.replace(/[^\d.]/g, '')) : 0;
    const subtotal = total - tax;

    // For Indian GST, split into CGST and SGST (9% each for 18% total)
    const cgst = tax / 2;
    const sgst = tax / 2;

    await this.sendMessage({
      type: 'tax_analysis',
      data: {
        taxBreakdown: {
          subtotal,
          cgst,
          sgst,
          total,
          currency: 'INR',
          isCompliant: taxResult.isCompliant,
          violations: taxResult.violations,
          taxRate: 18
        }
      }
    });
  }

  /**
   * Send fraud analysis data for Fraud Heat Map
   */
  private async sendFraudAnalysis(fraudResult: any, fields: ExtractedField[]): Promise<void> {
    const riskAreas = [];

    // Create risk areas for fields with issues
    const lowConfidenceFields = fields.filter(f => f.confidence < 0.70);

    for (const field of lowConfidenceFields) {
      riskAreas.push({
        id: `risk-${Date.now()}-${Math.random()}`,
        x: field.boundingBox.left,
        y: field.boundingBox.top,
        width: field.boundingBox.width,
        height: field.boundingBox.height,
        riskLevel: 'MEDIUM',
        reason: `Low confidence field: ${field.fieldName} (${Math.round(field.confidence * 100)}%)`,
        score: Math.round((1 - field.confidence) * 100),
        page: field.page
      });
    }

    // Add risk area for unusually high amounts
    const totalField = fields.find(f => f.fieldName.toLowerCase().includes('total'));
    if (totalField) {
      const amount = parseFloat(totalField.value.replace(/[^\d.]/g, ''));
      if (amount > 1000000) {
        riskAreas.push({
          id: `risk-amount-${Date.now()}`,
          x: totalField.boundingBox.left,
          y: totalField.boundingBox.top,
          width: totalField.boundingBox.width,
          height: totalField.boundingBox.height,
          riskLevel: 'HIGH',
          reason: 'Unusually high invoice amount detected',
          score: 15,
          page: totalField.page
        });
      }
    }

    await this.sendMessage({
      type: 'fraud_analysis',
      data: {
        riskScore: fraudResult.riskScore,
        riskLevel: fraudResult.riskLevel,
        flags: fraudResult.flags,
        riskAreas
      }
    });
  }

  /**
   * Send GL entries data for GL Entry Preview
   */
  private async sendGLEntries(glResult: any): Promise<void> {
    await this.sendMessage({
      type: 'gl_entries',
      data: {
        entries: glResult.entries
      }
    });
  }

  private async sendMessage(message: any): Promise<void> {
    try {
      await this.apiGateway.send(new PostToConnectionCommand({
        ConnectionId: this.connectionId,
        Data: Buffer.from(JSON.stringify(message))
      }));

      console.log(`Message sent to ${this.connectionId}:`, message.type);
    } catch (error: any) {
      if (error.statusCode === 410) {
        console.log(`Connection ${this.connectionId} is stale, removing...`);
        await dynamoDB.send(new DeleteCommand({
          TableName: process.env.CONNECTIONS_TABLE || '',
          Key: { connectionId: this.connectionId }
        }));
      } else {
        console.error(`Error sending message to ${this.connectionId}:`, error);
      }
    }
  }
}
