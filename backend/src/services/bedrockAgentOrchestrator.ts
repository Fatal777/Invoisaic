/**
 * Bedrock Agent Orchestrator
 * Coordinates multiple Bedrock agents for end-to-end invoice processing
 */

import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

const bedrockClient = new BedrockAgentRuntimeClient({ 
  region: process.env.AWS_REGION || 'ap-south-1' 
});

interface AgentConfig {
  id: string;
  aliasId: string;
  name: string;
}

const AGENTS: Record<string, AgentConfig> = {
  orchestrator: {
    id: process.env.ORCHESTRATOR_AGENT_ID || '',
    aliasId: process.env.ORCHESTRATOR_ALIAS_ID || '',
    name: 'Orchestrator Agent',
  },
  extraction: {
    id: process.env.EXTRACTION_AGENT_ID || '',
    aliasId: process.env.EXTRACTION_ALIAS_ID || '',
    name: 'Extraction Agent',
  },
  compliance: {
    id: process.env.COMPLIANCE_AGENT_ID || '',
    aliasId: process.env.COMPLIANCE_ALIAS_ID || '',
    name: 'Compliance Agent',
  },
  validation: {
    id: process.env.VALIDATION_AGENT_ID || '',
    aliasId: process.env.VALIDATION_ALIAS_ID || '',
    name: 'Validation Agent',
  },
};

export interface InvoiceProcessingResult {
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  extractedData?: any;
  complianceResults?: any;
  validationResults?: any;
  errors?: string[];
  processingTime: number;
  agentLogs: AgentLog[];
}

interface AgentLog {
  agentName: string;
  timestamp: string;
  status: 'started' | 'completed' | 'failed';
  message: string;
  data?: any;
}

export class BedrockAgentOrchestrator {
  private connectionId?: string;
  private apiGateway?: ApiGatewayManagementApiClient;
  private sessionId: string;
  private logs: AgentLog[] = [];

  constructor(connectionId?: string, domainName?: string, stage?: string) {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    if (connectionId && domainName && stage) {
      this.connectionId = connectionId;
      const endpoint = `https://${domainName}/${stage}`;
      this.apiGateway = new ApiGatewayManagementApiClient({ endpoint });
    }
  }

  /**
   * Main orchestration method - processes invoice through all agents
   */
  async processInvoice(invoiceData: any): Promise<InvoiceProcessingResult> {
    const startTime = Date.now();
    
    try {
      await this.logAndNotify('orchestrator', 'started', 'Starting invoice processing workflow...');

      // Step 1: Extract data from invoice
      await this.logAndNotify('extraction', 'started', 'Extracting data from invoice...');
      const extractionResult = await this.invokeAgent('extraction', 
        `Extract all relevant data from this invoice: ${JSON.stringify(invoiceData)}`, 
        { invoiceData: JSON.stringify(invoiceData) }
      );
      
      if (!extractionResult.success) {
        return this.buildFailureResult('REJECTED', 'Extraction failed', startTime);
      }
      
      await this.logAndNotify('extraction', 'completed', 
        'Data extraction completed successfully', extractionResult.data);

      // Step 2: Validate against compliance regulations
      await this.logAndNotify('compliance', 'started', 
        'Validating invoice against tax and compliance regulations...');
      
      const complianceResult = await this.invokeAgent('compliance',
        `Validate this invoice data against compliance regulations: ${extractionResult.response}`,
        { 
          invoiceData: extractionResult.response,
          country: extractionResult.data?.country || 'US'
        }
      );

      if (!complianceResult.success) {
        return this.buildFailureResult('REJECTED', 'Compliance check failed', startTime);
      }

      await this.logAndNotify('compliance', 'completed',
        complianceResult.data?.compliant ? 'Invoice is compliant' : 'Compliance issues detected',
        complianceResult.data);

      // If not compliant, reject
      if (complianceResult.data && !complianceResult.data.compliant) {
        return {
          status: 'REJECTED',
          extractedData: extractionResult.data,
          complianceResults: complianceResult.data,
          errors: complianceResult.data.issues || ['Compliance check failed'],
          processingTime: Date.now() - startTime,
          agentLogs: this.logs,
        };
      }

      // Step 3: Final validation
      await this.logAndNotify('validation', 'started', 
        'Performing final validation checks...');
      
      const validationResult = await this.invokeAgent('validation',
        `Perform final validation on this invoice data: ${extractionResult.response}. Compliance results: ${JSON.stringify(complianceResult.data)}`,
        {
          invoiceData: extractionResult.response,
          complianceResults: JSON.stringify(complianceResult.data)
        }
      );

      if (!validationResult.success) {
        return this.buildFailureResult('REJECTED', 'Validation failed', startTime);
      }

      await this.logAndNotify('validation', 'completed',
        'Validation completed', validationResult.data);

      // Determine final status
      const finalStatus = this.determineFinalStatus(
        extractionResult.data,
        complianceResult.data,
        validationResult.data
      );

      await this.logAndNotify('orchestrator', 'completed',
        `Invoice processing complete: ${finalStatus}`, {
          status: finalStatus,
          processingTime: Date.now() - startTime
        });

      return {
        status: finalStatus,
        extractedData: extractionResult.data,
        complianceResults: complianceResult.data,
        validationResults: validationResult.data,
        processingTime: Date.now() - startTime,
        agentLogs: this.logs,
      };

    } catch (error) {
      console.error('Orchestration error:', error);
      await this.logAndNotify('orchestrator', 'failed', 
        `Processing failed: ${error instanceof Error ? error.message : String(error)}`);
      
      return this.buildFailureResult('REJECTED', 
        error instanceof Error ? error.message : 'Unknown error', 
        startTime);
    }
  }

  /**
   * Invoke a specific Bedrock agent
   */
  private async invokeAgent(
    agentType: string,
    inputText: string,
    sessionAttributes: Record<string, string> = {}
  ): Promise<{ success: boolean; response: string; data?: any; trace?: any[] }> {
    const agent = AGENTS[agentType];
    
    if (!agent || !agent.id) {
      console.error(`Agent not configured: ${agentType}`);
      return { success: false, response: `Agent ${agentType} not configured` };
    }

    try {
      const input: InvokeAgentCommandInput = {
        agentId: agent.id,
        agentAliasId: agent.aliasId,
        sessionId: this.sessionId,
        inputText,
        enableTrace: true,
      };

      if (Object.keys(sessionAttributes).length > 0) {
        input.sessionState = { sessionAttributes };
      }

      const command = new InvokeAgentCommand(input);
      const response = await bedrockClient.send(command);

      // Process streaming response
      const result = await this.processAgentResponse(response);
      
      return {
        success: true,
        response: result.text,
        data: this.parseAgentData(result.text),
        trace: result.trace,
      };

    } catch (error) {
      console.error(`Error invoking ${agentType} agent:`, error);
      return {
        success: false,
        response: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Process streaming agent response
   */
  private async processAgentResponse(response: any): Promise<{
    text: string;
    trace: any[];
  }> {
    let agentText = '';
    const trace: any[] = [];

    try {
      const completion = response.completion;

      if (completion) {
        for await (const event of completion) {
          if (event.chunk?.bytes) {
            const chunkText = new TextDecoder().decode(event.chunk.bytes);
            agentText += chunkText;
          }

          if (event.trace) {
            trace.push(event.trace);
          }
        }
      }

      return { text: agentText || 'No response', trace };
    } catch (error) {
      console.error('Error processing agent response:', error);
      return { text: 'Error processing response', trace: [] };
    }
  }

  /**
   * Parse structured data from agent response
   */
  private parseAgentData(text: string): any {
    try {
      // Look for JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: text };
    } catch {
      return { raw: text };
    }
  }

  /**
   * Determine final processing status
   */
  private determineFinalStatus(
    extractionData: any,
    complianceData: any,
    validationData: any
  ): 'APPROVED' | 'REJECTED' {
    // Check compliance
    if (complianceData && complianceData.compliant === false) {
      return 'REJECTED';
    }

    // Check validation
    if (validationData && validationData.validation_status === 'failed') {
      return 'REJECTED';
    }

    if (validationData && validationData.ready_for_processing === false) {
      return 'REJECTED';
    }

    // All checks passed
    return 'APPROVED';
  }

  /**
   * Log activity and send WebSocket notification if available
   */
  private async logAndNotify(
    agentName: string,
    status: 'started' | 'completed' | 'failed',
    message: string,
    data?: any
  ): Promise<void> {
    const log: AgentLog = {
      agentName,
      timestamp: new Date().toISOString(),
      status,
      message,
      data,
    };

    this.logs.push(log);
    console.log(`[${agentName}] ${status}: ${message}`);

    // Send WebSocket notification if connected
    if (this.connectionId && this.apiGateway) {
      try {
        await this.apiGateway.send(new PostToConnectionCommand({
          ConnectionId: this.connectionId,
          Data: Buffer.from(JSON.stringify({
            type: 'agent_activity',
            data: log,
          })),
        }));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  }

  /**
   * Build failure result
   */
  private buildFailureResult(
    status: 'REJECTED',
    error: string,
    startTime: number
  ): InvoiceProcessingResult {
    return {
      status,
      errors: [error],
      processingTime: Date.now() - startTime,
      agentLogs: this.logs,
    };
  }
}
