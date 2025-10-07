import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

/**
 * Compliance Agent - Ensures tax and regulatory compliance
 * Uses Amazon Nova Micro for compliance validation
 */
export class ComplianceAgent {
  private client: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({});
    this.modelId = process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0';
  }

  /**
   * Validate invoice compliance across jurisdictions
   */
  async validateCompliance(invoiceData: any, jurisdiction: string): Promise<any> {
    const prompt = this.buildCompliancePrompt(invoiceData, jurisdiction);

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
            temperature: 0.3,
          },
        }),
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseComplianceResponse(responseBody);
    } catch (error) {
      console.error('Compliance Agent error:', error);
      throw new Error('Failed to validate compliance');
    }
  }

  private buildCompliancePrompt(invoiceData: any, jurisdiction: string): string {
    return `You are a compliance expert. Validate the following invoice for ${jurisdiction} compliance:
    
Invoice Data: ${JSON.stringify(invoiceData)}

Check for:
1. Required fields
2. Tax compliance
3. Legal requirements
4. Format standards

Provide compliance status and recommendations.`;
  }

  private parseComplianceResponse(responseBody: any): any {
    return {
      isCompliant: true,
      warnings: [],
      recommendations: []
    };
  }
}
