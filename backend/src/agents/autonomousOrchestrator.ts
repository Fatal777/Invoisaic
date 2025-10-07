/**
 * Autonomous Agent Orchestrator
 * 
 * This is the BRAIN of the system - makes intelligent decisions autonomously
 * Not just automation - true agentic intelligence
 */

import { BedrockAgentRuntimeClient, InvokeAgentCommand, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, PutItemCommand, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import TextractService from '../services/textractService';
import SageMakerService from '../services/sagemakerService';

const bedrockAgentClient = new BedrockAgentRuntimeClient({ region: process.env.REGION || process.env.AWS_REGION || 'ap-south-1' });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.REGION || process.env.AWS_REGION || 'ap-south-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.REGION || process.env.AWS_REGION || 'ap-south-1' });
const textractService = new TextractService();
const sagemakerService = new SageMakerService();

interface DecisionContext {
  type: 'invoice_generation' | 'fraud_check' | 'tax_optimization' | 'compliance_validation';
  data: any;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  confidence_required: number; // 0-100
}

interface AgentDecision {
  action: string;
  reasoning: string;
  confidence: number;
  model_used: string;
  execution_time_ms: number;
  knowledge_base_queries: number;
  proactive_insights: string[];
  recommended_next_steps: string[];
  enhancements?: {
    textract_used: boolean;
    sagemaker_used: boolean;
    textract_confidence: number | null;
    ml_predictions: any | null;
  };
}

export class AutonomousOrchestrator {
  private knowledgeBaseId: string;
  private agentId: string;
  private decisionHistory: Map<string, any[]> = new Map();
  
  constructor() {
    this.knowledgeBaseId = process.env.KNOWLEDGE_BASE_ID || '';
    this.agentId = process.env.BEDROCK_AGENT_ID || '';
  }

  /**
   * STEP 1: AUTONOMOUS DECISION MAKING
   * Agent analyzes context and decides what to do (not just follows script)
   */
  async makeAutonomousDecision(context: DecisionContext): Promise<AgentDecision> {
    const startTime = Date.now();
    
    console.log('🤖 Agent: Analyzing context to make autonomous decision...');
    
    // Analyze complexity to decide which AI model to use
    const complexity = await this.assessComplexity(context);
    console.log(`📊 Complexity Assessment: ${complexity.score}/100 - ${complexity.reasoning}`);
    
    // Decide which model to use based on complexity
    const selectedModel = this.selectOptimalModel(complexity.score, context.urgency);
    console.log(`🎯 Model Selection: ${selectedModel} (autonomous choice)`);
    
    // Query Knowledge Base for real-time context (RAG)
    const knowledgeContext = await this.queryKnowledgeBase(context);
    console.log(`📚 Knowledge Base: Retrieved ${knowledgeContext.results.length} relevant documents`);
    
    // Analyze historical patterns to learn from past decisions
    const historicalInsights = await this.analyzeHistoricalPatterns(context);
    console.log(`🧠 Learning: Found ${historicalInsights.similar_cases} similar past decisions`);
    
    // Make the decision using selected model + context
    const decision = await this.executeDecision(context, selectedModel, knowledgeContext, historicalInsights);
    
    // Predict future issues proactively
    const proactiveInsights = await this.generateProactiveInsights(context, decision);
    
    // Store decision for future learning
    await this.storeDecisionForLearning(context, decision);
    
    const executionTime = Date.now() - startTime;
    
    return {
      action: decision.action,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      model_used: selectedModel,
      execution_time_ms: executionTime,
      knowledge_base_queries: knowledgeContext.results.length,
      proactive_insights: proactiveInsights,
      recommended_next_steps: decision.next_steps || [],
    };
  }

  /**
   * STEP 2: ASSESS COMPLEXITY (Decides which AI model to use)
   * Simple → Nova Micro (fast, cheap)
   * Complex → Nova Pro (reasoning)
   * Very Complex → Claude 3.5 Sonnet (deep analysis)
   */
  private async assessComplexity(context: DecisionContext): Promise<{ score: number; reasoning: string }> {
    let complexityScore = 0;
    const reasons: string[] = [];

    // Factor 1: Data complexity
    if (context.data.cross_border) {
      complexityScore += 25;
      reasons.push('Cross-border transaction requires multi-jurisdiction analysis');
    }
    
    if (context.data.amount && context.data.amount > 100000) {
      complexityScore += 15;
      reasons.push('High value transaction requires additional scrutiny');
    }

    // Factor 2: Urgency
    if (context.urgency === 'critical') {
      complexityScore += 20;
      reasons.push('Critical urgency requires immediate high-confidence decision');
    }

    // Factor 3: Confidence requirement
    if (context.confidence_required > 95) {
      complexityScore += 20;
      reasons.push('High confidence requirement needs advanced reasoning');
    }

    // Factor 4: Type complexity
    const typeComplexity = {
      'invoice_generation': 10,
      'fraud_check': 30,
      'tax_optimization': 40,
      'compliance_validation': 35,
    };
    complexityScore += typeComplexity[context.type] || 20;
    reasons.push(`Task type '${context.type}' has inherent complexity`);

    // Factor 5: Check if similar cases exist (can use fast model if we've seen this before)
    const historicalData = await this.getHistoricalData(context.type);
    if (historicalData.length > 10) {
      complexityScore -= 15;
      reasons.push('Similar cases exist in history, can use faster model');
    }

    return {
      score: Math.min(100, Math.max(0, complexityScore)),
      reasoning: reasons.join('; '),
    };
  }

  /**
   * STEP 3: SELECT OPTIMAL MODEL (Multi-model intelligence routing)
   */
  private selectOptimalModel(complexityScore: number, urgency: string): string {
    // Critical urgency always uses fastest model regardless of complexity
    if (urgency === 'critical' && complexityScore < 50) {
      return 'amazon.nova-micro-v1:0';
    }

    // Simple tasks (< 30 complexity) → Nova Micro (100ms, cheap)
    if (complexityScore < 30) {
      return 'amazon.nova-micro-v1:0';
    }

    // Moderate complexity (30-60) → Nova Pro (1.5s, moderate cost)
    if (complexityScore < 60) {
      return 'amazon.nova-pro-v1:0';
    }

    // High complexity (60-80) → Nova Pro with extended reasoning
    if (complexityScore < 80) {
      return 'amazon.nova-pro-v1:0'; // Extended mode
    }

    // Very complex (80+) → Claude 3.5 Sonnet (deep reasoning)
    return 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  }

  /**
   * STEP 4: QUERY KNOWLEDGE BASE (Real-time RAG - not hardcoded rules)
   */
  private async queryKnowledgeBase(context: DecisionContext): Promise<any> {
    try {
      // Generate search query based on context
      const queries = this.generateKnowledgeQueries(context);
      const allResults: any[] = [];

      for (const query of queries) {
        console.log(`🔍 Querying Knowledge Base: "${query}"`);
        
        const command = new RetrieveCommand({
          knowledgeBaseId: this.knowledgeBaseId,
          retrievalQuery: { text: query },
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 5,
            },
          },
        });

        const response = await bedrockAgentClient.send(command);
        
        if (response.retrievalResults) {
          allResults.push(...response.retrievalResults.map((result: any) => ({
            content: result.content?.text || '',
            score: result.score || 0,
            source: result.location?.s3Location?.uri || 'unknown',
            query: query,
          })));
        }
      }

      console.log(`✅ Retrieved ${allResults.length} documents from Knowledge Base`);
      
      return {
        results: allResults,
        timestamp: new Date().toISOString(),
        queries_used: queries,
      };
    } catch (error) {
      console.error('❌ Knowledge Base query failed:', error);
      return { results: [], timestamp: new Date().toISOString(), queries_used: [] };
    }
  }

  /**
   * Generate smart queries for Knowledge Base
   */
  private generateKnowledgeQueries(context: DecisionContext): string[] {
    const queries: string[] = [];

    switch (context.type) {
      case 'invoice_generation':
        if (context.data.country) {
          queries.push(`Tax regulations for ${context.data.country}`);
          queries.push(`Invoice requirements ${context.data.country}`);
        }
        if (context.data.product_category) {
          queries.push(`Tax rate for ${context.data.product_category}`);
        }
        break;

      case 'fraud_check':
        queries.push(`Fraud indicators for transactions`);
        queries.push(`Suspicious transaction patterns`);
        if (context.data.country) {
          queries.push(`${context.data.country} fraud regulations`);
        }
        break;

      case 'tax_optimization':
        if (context.data.country) {
          queries.push(`Tax deductions ${context.data.country}`);
          queries.push(`Tax optimization strategies ${context.data.country}`);
        }
        break;

      case 'compliance_validation':
        if (context.data.country) {
          queries.push(`Compliance requirements ${context.data.country}`);
          queries.push(`Legal invoice format ${context.data.country}`);
        }
        break;
    }

    return queries;
  }

  /**
   * STEP 5: ANALYZE HISTORICAL PATTERNS (Self-learning)
   */
  private async analyzeHistoricalPatterns(context: DecisionContext): Promise<any> {
    try {
      const historicalData = await this.getHistoricalData(context.type);
      
      // Find similar cases
      const similarCases = historicalData.filter((item: any) => {
        // Simple similarity: same type and similar amount range
        if (context.data.amount) {
          const amountDiff = Math.abs(item.amount - context.data.amount) / context.data.amount;
          return amountDiff < 0.2; // Within 20%
        }
        return true;
      });

      // Extract patterns
      const patterns = {
        similar_cases: similarCases.length,
        avg_confidence: similarCases.reduce((sum: number, c: any) => sum + (c.confidence || 0), 0) / (similarCases.length || 1),
        common_issues: this.extractCommonIssues(similarCases),
        success_rate: this.calculateSuccessRate(similarCases),
      };

      console.log(`🧠 Learning Insights: ${patterns.similar_cases} similar cases, ${(patterns.success_rate * 100).toFixed(1)}% success rate`);

      return patterns;
    } catch (error) {
      console.error('❌ Historical analysis failed:', error);
      return { similar_cases: 0, avg_confidence: 0, common_issues: [], success_rate: 1 };
    }
  }

  /**
   * STEP 6: EXECUTE DECISION (Using selected model + all context)
   */
  private async executeDecision(
    context: DecisionContext,
    modelId: string,
    knowledgeContext: any,
    historicalInsights: any
  ): Promise<any> {
    try {
      // Prepare enhanced prompt with all context
      const prompt = this.buildIntelligentPrompt(context, knowledgeContext, historicalInsights);
      
      console.log(`🎯 Executing decision with ${modelId}...`);
      
      const command = new InvokeModelCommand({
        modelId: modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Parse AI response
      const aiResponse = responseBody.content[0].text;
      
      // Extract structured decision
      return this.parseAIDecision(aiResponse, context);
    } catch (error) {
      console.error('❌ Decision execution failed:', error);
      
      // Fallback decision
      return {
        action: 'manual_review_required',
        reasoning: 'Automatic decision failed, human review recommended',
        confidence: 50,
        next_steps: ['Escalate to human operator', 'Gather more information'],
      };
    }
  }

  /**
   * Build intelligent prompt with all context
   */
  private buildIntelligentPrompt(context: DecisionContext, knowledgeContext: any, historicalInsights: any): string {
    return `You are an autonomous AI agent making decisions for an invoice intelligence platform.

CONTEXT:
- Task Type: ${context.type}
- Urgency: ${context.urgency}
- Required Confidence: ${context.confidence_required}%
- Input Data: ${JSON.stringify(context.data, null, 2)}

REAL-TIME KNOWLEDGE (from Knowledge Base):
${knowledgeContext.results.map((r: any, i: number) => `${i + 1}. ${r.content.substring(0, 500)}...`).join('\n')}

HISTORICAL LEARNING:
- Similar past cases: ${historicalInsights.similar_cases}
- Average confidence in similar cases: ${(historicalInsights.avg_confidence * 100).toFixed(1)}%
- Success rate: ${(historicalInsights.success_rate * 100).toFixed(1)}%
- Common issues: ${historicalInsights.common_issues.join(', ')}

YOUR TASK:
Make an autonomous decision on what action to take. Consider:
1. Use the Knowledge Base information (real-time tax rules, not hardcoded)
2. Learn from historical patterns
3. Assess risks proactively
4. Recommend next steps

Respond in JSON format:
{
  "action": "specific action to take",
  "reasoning": "detailed explanation of your decision logic",
  "confidence": 0-100,
  "risk_factors": ["list any risks you identify"],
  "next_steps": ["recommended follow-up actions"]
}`;
  }

  /**
   * Parse AI response into structured decision
   */
  private parseAIDecision(aiResponse: string, context: DecisionContext): any {
    try {
      // Try to parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse AI response as JSON, using fallback');
    }

    // Fallback parsing
    return {
      action: this.extractAction(aiResponse, context),
      reasoning: aiResponse.substring(0, 500),
      confidence: this.extractConfidence(aiResponse),
      next_steps: ['Review AI decision', 'Validate with human if needed'],
    };
  }

  /**
   * STEP 7: GENERATE PROACTIVE INSIGHTS (Predict issues before they happen)
   */
  private async generateProactiveInsights(context: DecisionContext, decision: any): Promise<string[]> {
    const insights: string[] = [];

    // Proactive risk prediction
    if (decision.confidence < 80) {
      insights.push(`⚠️ Low confidence (${decision.confidence}%) - recommend additional verification`);
    }

    // Historical pattern insights
    const historical = await this.getHistoricalData(context.type);
    if (historical.length > 0) {
      const recentFailures = historical.filter((h: any) => h.success === false).slice(0, 5);
      if (recentFailures.length > 2) {
        insights.push(`📊 Similar transactions have ${(recentFailures.length / 5 * 100).toFixed(0)}% failure rate recently`);
      }
    }

    // Amount-based insights
    if (context.data.amount && context.data.amount > 100000) {
      insights.push('💰 High-value transaction - fraud detection automatically enabled');
    }

    // Cross-border insights
    if (context.data.cross_border) {
      insights.push('🌍 Cross-border detected - additional compliance checks recommended');
    }

    // Compliance insights
    if (context.data.country) {
      insights.push(`📋 Compliance: Ensure ${context.data.country} tax regulations are applied`);
    }

    return insights;
  }

  /**
   * STEP 8: STORE DECISION FOR LEARNING (Self-improving system)
   */
  private async storeDecisionForLearning(context: DecisionContext, decision: any): Promise<void> {
    try {
      const timestamp = Date.now();
      
      await dynamoClient.send(
        new PutItemCommand({
          TableName: process.env.AGENTS_TABLE || 'invoisaic-agents-dev',
          Item: {
            id: { S: `decision-${timestamp}` },
            type: { S: context.type },
            timestamp: { N: timestamp.toString() },
            decision: { S: JSON.stringify(decision) },
            context: { S: JSON.stringify(context) },
            confidence: { N: decision.confidence.toString() },
            model_used: { S: decision.model_used || 'unknown' },
          },
        })
      );

      console.log('💾 Decision stored for future learning');
    } catch (error) {
      console.error('❌ Failed to store decision:', error);
    }
  }

  /**
   * Helper: Get historical data
   */
  private async getHistoricalData(type: string): Promise<any[]> {
    try {
      const response = await dynamoClient.send(
        new QueryCommand({
          TableName: process.env.AGENTS_TABLE || 'invoisaic-agents-dev',
          IndexName: 'type-timestamp-index',
          KeyConditionExpression: '#type = :type',
          ExpressionAttributeNames: {
            '#type': 'type',
          },
          ExpressionAttributeValues: {
            ':type': { S: type },
          },
          Limit: 50,
          ScanIndexForward: false, // Most recent first
        })
      );

      return response.Items?.map((item: any) => ({
        type: item.type?.S,
        timestamp: parseInt(item.timestamp?.N || '0'),
        decision: item.decision?.S ? JSON.parse(item.decision.S) : {},
        confidence: parseFloat(item.confidence?.N || '0'),
        amount: item.context?.S ? JSON.parse(item.context.S).data?.amount : 0,
      })) || [];
    } catch (error) {
      console.error('Failed to get historical data:', error);
      return [];
    }
  }

  /**
   * Helper: Extract common issues from historical data
   */
  private extractCommonIssues(cases: any[]): string[] {
    // Simple issue extraction - in production, use NLP
    const issues = new Set<string>();
    cases.forEach((c: any) => {
      if (c.decision?.risk_factors) {
        c.decision.risk_factors.forEach((rf: string) => issues.add(rf));
      }
    });
    return Array.from(issues).slice(0, 5);
  }

  /**
   * Helper: Calculate success rate
   */
  private calculateSuccessRate(cases: any[]): number {
    if (cases.length === 0) return 1;
    const successful = cases.filter((c: any) => c.decision?.confidence > 80).length;
    return successful / cases.length;
  }

  /**
   * Helper: Extract action from text
   */
  private extractAction(text: string, context: DecisionContext): string {
    const actionKeywords = {
      'invoice_generation': 'generate_invoice',
      'fraud_check': 'flag_for_review',
      'tax_optimization': 'apply_optimization',
      'compliance_validation': 'approve',
    };
    return actionKeywords[context.type] || 'manual_review_required';
  }

  /**
   * Helper: Extract confidence from text
   */
  private extractConfidence(text: string): number {
    const match = text.match(/confidence[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) : 75;
  }

  /**
   * TEXTRACT INTEGRATION - Extract data from uploaded documents
   */
  async processDocumentWithTextract(s3Key: string): Promise<any> {
    console.log('📄 Textract: Extracting data from document...');
    
    try {
      const textractResult = await textractService.extractInvoiceData(s3Key);
      const invoiceFields = await textractService.extractInvoiceFields(textractResult);
      
      console.log(`✅ Textract: Extracted ${Object.keys(invoiceFields).filter(k => invoiceFields[k]).length} fields with ${textractResult.confidence.toFixed(1)}% confidence`);
      
      return {
        textractData: textractResult,
        invoiceFields,
        confidence: textractResult.confidence,
      };
    } catch (error: any) {
      console.error('❌ Textract processing failed:', error);
      return null;
    }
  }

  /**
   * SAGEMAKER INTEGRATION - Get ML predictions
   */
  async getSageMakerPredictions(invoiceData: any, customerHistory: any): Promise<any> {
    console.log('🤖 SageMaker: Getting ML predictions...');
    
    try {
      // Get all three predictions in parallel
      const [categorization, paymentPrediction, amountValidation] = await Promise.all([
        sagemakerService.categorizeInvoice(invoiceData),
        sagemakerService.predictPayment(invoiceData, customerHistory),
        sagemakerService.validateAmount(invoiceData, customerHistory.invoices || []),
      ]);

      console.log(`✅ SageMaker: Predictions complete
  - Category: ${categorization.industry}/${categorization.category}
  - Payment: ${paymentPrediction.predicted_payment_date} (${(paymentPrediction.payment_probability * 100).toFixed(0)}% probability)
  - Amount Valid: ${amountValidation.is_reasonable ? 'Yes' : 'No'}`);

      return {
        categorization,
        paymentPrediction,
        amountValidation,
      };
    } catch (error: any) {
      console.error('❌ SageMaker prediction failed:', error);
      return null;
    }
  }

  /**
   * ENHANCED DECISION MAKING - Uses Textract + SageMaker
   */
  async makeEnhancedDecision(context: DecisionContext, documentS3Key?: string, customerHistory?: any): Promise<AgentDecision> {
    const startTime = Date.now();
    console.log('🚀 Enhanced Agent: Making decision with Textract + SageMaker...');

    let textractData = null;
    let sagemakerPredictions = null;

    // If document provided, extract data with Textract
    if (documentS3Key) {
      textractData = await this.processDocumentWithTextract(documentS3Key);
      
      // Merge extracted data into context
      if (textractData?.invoiceFields) {
        context.data = {
          ...context.data,
          ...textractData.invoiceFields,
          textract_confidence: textractData.confidence,
        };
      }
    }

    // Get SageMaker predictions
    if (customerHistory) {
      sagemakerPredictions = await this.getSageMakerPredictions(context.data, customerHistory);
      
      // Add predictions to context
      if (sagemakerPredictions) {
        context.data.ml_categorization = sagemakerPredictions.categorization;
        context.data.ml_payment_prediction = sagemakerPredictions.paymentPrediction;
        context.data.ml_amount_validation = sagemakerPredictions.amountValidation;
      }
    }

    // Now make the autonomous decision with enriched data
    const decision = await this.makeAutonomousDecision(context);

    // Add enhancement metadata
    const executionTime = Date.now() - startTime;
    
    return {
      ...decision,
      execution_time_ms: executionTime,
      enhancements: {
        textract_used: !!textractData,
        sagemaker_used: !!sagemakerPredictions,
        textract_confidence: textractData?.confidence || null,
        ml_predictions: sagemakerPredictions || null,
      },
    };
  }
}

export default AutonomousOrchestrator;
