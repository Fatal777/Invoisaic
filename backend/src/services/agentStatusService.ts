/**
 * Agent Status Service
 * 
 * Tracks real-time status of all 4 AI agents
 * Used for Agent Theater and Navbar live indicators
 */

import { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.REGION || process.env.AWS_REGION || 'ap-south-1' });
const AGENTS_TABLE = process.env.DYNAMODB_AGENTS_TABLE || 'invoisaic-agents-dev';

export interface AgentStatus {
  agentId: string;
  agentName: string;
  status: 'idle' | 'active' | 'processing' | 'complete' | 'error';
  confidence: number;
  currentTask?: string;
  processingTime?: number;
  lastUpdated: string;
  metadata?: {
    model?: string;
    tokenCount?: number;
    cost?: number;
    fieldsExtracted?: number;
    pagesProcessed?: number;
    complexityScore?: number;
    predictedDate?: string;
    probability?: number;
    country?: string;
    checksCompleted?: number;
    [key: string]: any; // Allow additional metadata
  };
}

export interface AgentDecisionLog {
  timestamp: string;
  agentId: string;
  agentName: string;
  message: string;
  type: 'info' | 'decision' | 'communication' | 'complete' | 'error';
  confidence?: number;
  metadata?: any;
}

export class AgentStatusService {
  private agentConfigs = {
    textract: { name: 'Document Analysis Agent', color: '#3b82f6' },
    bedrock: { name: 'Business Logic Agent', color: '#8b5cf6' },
    sagemaker: { name: 'Payment Prediction Agent', color: '#ff8000' },
    compliance: { name: 'Tax Compliance Agent', color: '#00ff00' },
  };

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: Partial<AgentStatus>): Promise<void> {
    const config = this.agentConfigs[agentId as keyof typeof this.agentConfigs];
    
    if (!config) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const agentStatus: AgentStatus = {
      agentId,
      agentName: config.name,
      status: status.status || 'idle',
      confidence: status.confidence || 0,
      currentTask: status.currentTask,
      processingTime: status.processingTime,
      lastUpdated: new Date().toISOString(),
      metadata: status.metadata,
    };

    await dynamoClient.send(
      new PutItemCommand({
        TableName: AGENTS_TABLE,
        Item: {
          agentId: { S: agentStatus.agentId },
          agentName: { S: agentStatus.agentName },
          status: { S: agentStatus.status },
          confidence: { N: agentStatus.confidence.toString() },
          currentTask: { S: agentStatus.currentTask || '' },
          processingTime: { N: (agentStatus.processingTime || 0).toString() },
          lastUpdated: { S: agentStatus.lastUpdated },
          metadata: { S: JSON.stringify(agentStatus.metadata || {}) },
        },
      })
    );

    console.log(`✅ Agent ${agentId} status updated: ${agentStatus.status}`);
  }

  /**
   * Get current status of all agents
   */
  async getAllAgentStatuses(): Promise<AgentStatus[]> {
    const result = await dynamoClient.send(
      new ScanCommand({
        TableName: AGENTS_TABLE,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      // Return default statuses if table is empty
      return Object.entries(this.agentConfigs).map(([id, config]) => ({
        agentId: id,
        agentName: config.name,
        status: 'idle' as const,
        confidence: 0,
        lastUpdated: new Date().toISOString(),
      }));
    }

    return result.Items.map((item: any) => ({
      agentId: item.agentId.S || '',
      agentName: item.agentName.S || '',
      status: (item.status.S as AgentStatus['status']) || 'idle',
      confidence: parseFloat(item.confidence.N || '0'),
      currentTask: item.currentTask?.S,
      processingTime: parseFloat(item.processingTime?.N || '0'),
      lastUpdated: item.lastUpdated.S || '',
      metadata: item.metadata?.S ? JSON.parse(item.metadata.S) : undefined,
    }));
  }

  /**
   * Get status of a specific agent
   */
  async getAgentStatus(agentId: string): Promise<AgentStatus | null> {
    const result = await dynamoClient.send(
      new GetItemCommand({
        TableName: AGENTS_TABLE,
        Key: {
          agentId: { S: agentId },
        },
      })
    );

    if (!result.Item) {
      const config = this.agentConfigs[agentId as keyof typeof this.agentConfigs];
      if (!config) return null;

      // Return default status
      return {
        agentId,
        agentName: config.name,
        status: 'idle',
        confidence: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    return {
      agentId: result.Item.agentId.S || '',
      agentName: result.Item.agentName.S || '',
      status: (result.Item.status.S as AgentStatus['status']) || 'idle',
      confidence: parseFloat(result.Item.confidence.N || '0'),
      currentTask: result.Item.currentTask?.S,
      processingTime: parseFloat(result.Item.processingTime?.N || '0'),
      lastUpdated: result.Item.lastUpdated.S || '',
      metadata: result.Item.metadata?.S ? JSON.parse(result.Item.metadata.S) : undefined,
    };
  }

  /**
   * Reset all agents to idle
   */
  async resetAllAgents(): Promise<void> {
    for (const agentId of Object.keys(this.agentConfigs)) {
      await this.updateAgentStatus(agentId, {
        status: 'idle',
        confidence: 0,
        currentTask: undefined,
        processingTime: 0,
      });
    }
    console.log('✅ All agents reset to idle');
  }

  /**
   * Simulate agent processing workflow (for demos)
   */
  async simulateWorkflow(
    onStatusUpdate?: (agentId: string, status: AgentStatus) => void,
    onDecision?: (decision: AgentDecisionLog) => void
  ): Promise<{
    decisions: AgentDecisionLog[];
    totalTime: number;
    totalCost: number;
  }> {
    const decisions: AgentDecisionLog[] = [];
    const startTime = Date.now();

    const addDecision = (decision: AgentDecisionLog) => {
      decisions.push(decision);
      if (onDecision) onDecision(decision);
    };

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Reset all agents
    await this.resetAllAgents();

    // Step 1: Start
    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'system',
      agentName: 'System',
      message: '📄 New invoice received - Starting autonomous processing...',
      type: 'info',
    });

    await delay(500);

    // Step 2: Textract Agent
    await this.updateAgentStatus('textract', {
      status: 'processing',
      currentTask: 'Analyzing document with Amazon Textract',
      confidence: 0,
    });

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'textract',
      agentName: 'Document Analysis Agent',
      message: '🔍 Analyzing document with Amazon Textract...',
      type: 'info',
    });

    await delay(1500);

    await this.updateAgentStatus('textract', {
      status: 'complete',
      confidence: 99.8,
      processingTime: 1.5,
      metadata: { fieldsExtracted: 12, pagesProcessed: 1 },
    });

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'textract',
      agentName: 'Document Analysis Agent',
      message: '✅ Extracted 12 fields with 99.8% confidence',
      type: 'decision',
      confidence: 99.8,
    });

    await delay(300);

    // Step 3: Parallel Processing (Bedrock + SageMaker + Compliance)
    await Promise.all([
      this.updateAgentStatus('bedrock', { status: 'processing', currentTask: 'Analyzing complexity' }),
      this.updateAgentStatus('sagemaker', { status: 'processing', currentTask: 'Predicting payment' }),
      this.updateAgentStatus('compliance', { status: 'processing', currentTask: 'Validating compliance' }),
    ]);

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'system',
      agentName: 'System',
      message: '⚡ Parallel processing started - 3 agents working simultaneously',
      type: 'info',
    });

    await delay(1000);

    // Bedrock Agent
    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'bedrock',
      agentName: 'Business Logic Agent',
      message: '🧠 Analyzing transaction complexity: 45/100 - Medium complexity',
      type: 'info',
    });

    await delay(700);

    await this.updateAgentStatus('bedrock', {
      status: 'complete',
      confidence: 92,
      processingTime: 1.7,
      metadata: { model: 'Nova Pro', complexityScore: 45 },
    });

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'bedrock',
      agentName: 'Business Logic Agent',
      message: '🎯 Selected AI Model: Nova Pro (optimal for this complexity)',
      type: 'decision',
      confidence: 92,
    });

    // SageMaker Agent
    await delay(500);

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'sagemaker',
      agentName: 'Payment Prediction Agent',
      message: '💰 Analyzing payment history and patterns...',
      type: 'info',
    });

    await delay(1200);

    await this.updateAgentStatus('sagemaker', {
      status: 'complete',
      confidence: 85,
      processingTime: 1.7,
      metadata: { predictedDate: '2025-02-15', probability: 0.85 },
    });

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'sagemaker',
      agentName: 'Payment Prediction Agent',
      message: '📊 Prediction: Payment expected Feb 15, 2025 (85% probability)',
      type: 'decision',
      confidence: 85,
    });

    // Compliance Agent
    await delay(300);

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'compliance',
      agentName: 'Tax Compliance Agent',
      message: '⚖️ Querying Knowledge Base for tax regulations...',
      type: 'info',
    });

    await delay(1000);

    await this.updateAgentStatus('compliance', {
      status: 'complete',
      confidence: 100,
      processingTime: 1.3,
      metadata: { country: 'US', checksCompleted: 15 },
    });

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'compliance',
      agentName: 'Tax Compliance Agent',
      message: '✅ Compliance validated: All checks passed (Federal + State)',
      type: 'decision',
      confidence: 100,
    });

    await delay(500);

    // Final Decision
    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'system',
      agentName: 'Orchestrator',
      message: '🎯 All agents complete - Making autonomous decision...',
      type: 'info',
    });

    await delay(800);

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'system',
      agentName: 'Orchestrator',
      message: '✅ DECISION: Generate invoice (95% confidence)',
      type: 'complete',
      confidence: 95,
    });

    await delay(500);

    addDecision({
      timestamp: new Date().toISOString(),
      agentId: 'system',
      agentName: 'System',
      message: '🎉 Invoice INV-2025-001234 generated and sent in 4.2 seconds!',
      type: 'complete',
    });

    const totalTime = (Date.now() - startTime) / 1000;
    const totalCost = 0.004; // $0.004 per invoice

    return {
      decisions,
      totalTime,
      totalCost,
    };
  }

  /**
   * Get agent activity summary
   */
  async getActivitySummary(): Promise<{
    totalProcessing: number;
    totalCompleted: number;
    averageConfidence: number;
    agentStats: Record<string, any>;
  }> {
    const statuses = await this.getAllAgentStatuses();
    
    const processing = statuses.filter((s) => s.status === 'processing').length;
    const completed = statuses.filter((s) => s.status === 'complete').length;
    const avgConfidence =
      statuses.reduce((sum, s) => sum + s.confidence, 0) / statuses.length;

    const agentStats: Record<string, any> = {};
    statuses.forEach((status) => {
      agentStats[status.agentId] = {
        status: status.status,
        confidence: status.confidence,
        currentTask: status.currentTask,
      };
    });

    return {
      totalProcessing: processing,
      totalCompleted: completed,
      averageConfidence: Math.round(avgConfidence * 10) / 10,
      agentStats,
    };
  }
}

export default AgentStatusService;
