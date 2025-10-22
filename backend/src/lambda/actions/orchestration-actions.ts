/**
 * Orchestration Agent Action Group Handler
 * Enables agent-to-agent invocation and parallel processing
 */

import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand
} from '@aws-sdk/client-bedrock-agent-runtime';

const bedrockAgentClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

// Agent IDs from environment variables - 4 existing agents only
const AGENT_IDS = {
  extraction: process.env.EXTRACTION_AGENT_ID || 'K93HN5QKPX',
  compliance: process.env.COMPLIANCE_AGENT_ID || 'K2GYUI5YOK',
  validation: process.env.VALIDATION_AGENT_ID || 'GTNAFH8LWX'
};

const AGENT_ALIASES = {
  extraction: process.env.EXTRACTION_ALIAS_ID || '73C03KQA7J',
  compliance: process.env.COMPLIANCE_ALIAS_ID || '3FWUQIYHUN',
  validation: process.env.VALIDATION_ALIAS_ID || 'ZSN4XIISJG'
};

interface ActionEvent {
  actionGroup: string;
  function: string;
  parameters: Array<{ name: string; type: string; value: string }>;
  sessionId?: string;
  sessionAttributes?: Record<string, string>;
}

interface ActionResponse {
  response: {
    actionGroup: string;
    function: string;
    functionResponse: {
      responseBody: {
        'application/json': {
          body: string;
        };
      };
    };
  };
}

/**
 * Main Lambda handler for Orchestration actions
 */
export const handler = async (event: ActionEvent): Promise<ActionResponse> => {
  console.log('Orchestration action event:', JSON.stringify(event, null, 2));

  const { actionGroup, function: functionName, parameters, sessionId } = event;

  try {
    let result: any;

    switch (functionName) {
      case 'invoke_extraction_agent':
        result = await invokeExtractionAgent(parameters, sessionId);
        break;
      case 'invoke_compliance_agent':
        result = await invokeComplianceAgent(parameters, sessionId);
        break;
      case 'invoke_validation_agent':
        result = await invokeValidationAgent(parameters, sessionId);
        break;
      case 'invoke_agents_parallel':
        result = await invokeAgentsParallel(parameters, sessionId);
        break;
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    return formatResponse(actionGroup, functionName, result);
  } catch (error: any) {
    console.error('Error in orchestration action:', error);
    return formatResponse(actionGroup, functionName, {
      error: error.message,
      status: 'failed'
    });
  }
};

/**
 * Invoke Extraction Agent
 */
async function invokeExtractionAgent(parameters: any[], sessionId?: string): Promise<any> {
  const s3Uri = getParameter(parameters, 's3_uri');
  const invoiceId = getParameter(parameters, 'invoice_id');

  if (!s3Uri || !invoiceId) {
    throw new Error('s3_uri and invoice_id are required');
  }

  console.log(`Invoking Extraction Agent for invoice ${invoiceId}`);

  const inputText = `Extract data from invoice at ${s3Uri}. Use the extract_with_textract function with these parameters: s3_uri=${s3Uri}, invoice_id=${invoiceId}`;

  const result = await invokeAgent(
    AGENT_IDS.extraction,
    AGENT_ALIASES.extraction,
    inputText,
    sessionId || `extraction-${Date.now()}`,
    { s3Uri, invoiceId }
  );

  return {
    agent: 'extraction',
    status: 'completed',
    invoice_id: invoiceId,
    extraction_result: result,
    session_id: sessionId
  };
}


/**
 * Invoke Compliance Agent
 */
async function invokeComplianceAgent(parameters: any[], sessionId?: string): Promise<any> {
  const invoiceData = getParameter(parameters, 'invoice_data');
  const jurisdiction = getParameter(parameters, 'jurisdiction') || 'US';

  if (!invoiceData) {
    throw new Error('invoice_data is required');
  }

  console.log(`Invoking Compliance Agent for ${jurisdiction}`);

  const inputText = `Validate tax compliance for this invoice in ${jurisdiction} jurisdiction:
  Invoice Data: ${invoiceData}
  
  Use the validate_tax_compliance function and query the knowledge base for ${jurisdiction} regulations.`;

  const result = await invokeAgent(
    AGENT_IDS.compliance,
    AGENT_ALIASES.compliance,
    inputText,
    sessionId || `compliance-${Date.now()}`,
    { invoiceData, jurisdiction }
  );

  return {
    agent: 'compliance',
    status: 'completed',
    jurisdiction: jurisdiction,
    compliance_result: result,
    session_id: sessionId
  };
}

/**
 * Invoke Validation Agent
 */
async function invokeValidationAgent(parameters: any[], sessionId?: string): Promise<any> {
  const invoiceData = getParameter(parameters, 'invoice_data');
  const fraudResults = getParameter(parameters, 'fraud_results');
  const complianceResults = getParameter(parameters, 'compliance_results');

  if (!invoiceData) {
    throw new Error('invoice_data is required');
  }

  console.log('Invoking Validation Agent for final checks');

  const inputText = `Perform final validation on this invoice:
  Invoice Data: ${invoiceData}
  ${fraudResults ? `Fraud Analysis Results: ${fraudResults}` : ''}
  ${complianceResults ? `Compliance Results: ${complianceResults}` : ''}
  
  Validate all data quality, completeness, and provide final recommendation.`;

  const sessionAttributes: Record<string, string> = { invoiceData };
  if (fraudResults) sessionAttributes.fraudResults = fraudResults;
  if (complianceResults) sessionAttributes.complianceResults = complianceResults;

  const result = await invokeAgent(
    AGENT_IDS.validation,
    AGENT_ALIASES.validation,
    inputText,
    sessionId || `validation-${Date.now()}`,
    sessionAttributes
  );

  return {
    agent: 'validation',
    status: 'completed',
    validation_result: result,
    session_id: sessionId
  };
}

/**
 * Invoke multiple agents in parallel
 */
async function invokeAgentsParallel(parameters: any[], sessionId?: string): Promise<any> {
  const agentsStr = getParameter(parameters, 'agents');
  const invoiceData = getParameter(parameters, 'invoice_data');

  if (!agentsStr || !invoiceData) {
    throw new Error('agents and invoice_data are required');
  }

  let agentsList: string[];
  try {
    agentsList = JSON.parse(agentsStr);
  } catch (error) {
    agentsList = agentsStr.split(',').map(a => a.trim());
  }

  console.log(`Invoking agents in parallel: ${agentsList.join(', ')}`);

  // Create promises for parallel execution
  const agentPromises: Promise<any>[] = [];
  const baseSessionId = sessionId || `parallel-${Date.now()}`;

  for (const agentName of agentsList) {
    const agentSessionId = `${baseSessionId}-${agentName}`;
    
    switch (agentName.toLowerCase()) {
      case 'extraction':
        // Skip extraction in parallel mode (needs S3 URI)
        break;
      case 'fraud':
        // Fraud agent not yet implemented - skip
        console.log('Skipping fraud agent (not implemented)');
        break;
      case 'compliance':
        agentPromises.push(
          invokeComplianceAgent(
            [
              { name: 'invoice_data', type: 'string', value: invoiceData },
              { name: 'jurisdiction', type: 'string', value: 'US' }
            ],
            agentSessionId
          )
        );
        break;
      case 'validation':
        agentPromises.push(
          invokeValidationAgent(
            [{ name: 'invoice_data', type: 'string', value: invoiceData }],
            agentSessionId
          )
        );
        break;
    }
  }

  // Execute all agents in parallel
  const startTime = Date.now();
  const results = await Promise.allSettled(agentPromises);
  const endTime = Date.now();

  const parallelResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        agent: agentsList[index],
        status: 'success',
        result: result.value
      };
    } else {
      return {
        agent: agentsList[index],
        status: 'failed',
        error: result.reason?.message || 'Unknown error'
      };
    }
  });

  const successCount = parallelResults.filter(r => r.status === 'success').length;
  const failureCount = parallelResults.filter(r => r.status === 'failed').length;

  return {
    parallel_execution: true,
    agents_invoked: agentsList,
    total_agents: agentsList.length,
    successful: successCount,
    failed: failureCount,
    execution_time_ms: endTime - startTime,
    results: parallelResults,
    session_id: baseSessionId,
    summary: {
      all_succeeded: failureCount === 0,
      completion_rate: successCount / agentsList.length,
      average_time_per_agent: (endTime - startTime) / agentsList.length
    }
  };
}

// ============================================================================
// Core Agent Invocation Function
// ============================================================================

/**
 * Invoke a Bedrock agent and collect the full response
 */
async function invokeAgent(
  agentId: string,
  agentAliasId: string,
  inputText: string,
  sessionId: string,
  sessionAttributes?: Record<string, string>
): Promise<any> {
  if (!agentId) {
    throw new Error('Agent ID not configured');
  }

  console.log(`Invoking agent ${agentId} (${agentAliasId}) with session ${sessionId}`);

  try {
    const command = new InvokeAgentCommand({
      agentId,
      agentAliasId,
      sessionId,
      inputText,
      enableTrace: true,
      sessionState: sessionAttributes ? {
        sessionAttributes
      } : undefined
    });

    const response = await bedrockAgentClient.send(command);

    // Collect all chunks from the response stream
    let fullResponse = '';
    let traces: any[] = [];

    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk) {
          const chunk = new TextDecoder().decode(event.chunk.bytes);
          fullResponse += chunk;
        }

        if (event.trace) {
          traces.push(event.trace);
        }
      }
    }

    // Try to parse response as JSON
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(fullResponse);
    } catch (error) {
      parsedResponse = { text: fullResponse };
    }

    return {
      response: parsedResponse,
      raw_response: fullResponse,
      session_id: sessionId,
      agent_id: agentId,
      traces: traces.length > 0 ? traces : undefined,
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error(`Error invoking agent ${agentId}:`, error);
    throw new Error(`Agent invocation failed: ${error.message}`);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getParameter(parameters: any[], name: string): string | undefined {
  const param = parameters.find(p => p.name === name);
  return param?.value;
}

function formatResponse(actionGroup: string, functionName: string, result: any): ActionResponse {
  return {
    response: {
      actionGroup,
      function: functionName,
      functionResponse: {
        responseBody: {
          'application/json': {
            body: JSON.stringify(result)
          }
        }
      }
    }
  };
}
