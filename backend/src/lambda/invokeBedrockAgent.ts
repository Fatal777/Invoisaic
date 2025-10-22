// Main Lambda for invoking Bedrock Agents from frontend
import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand,
  InvokeAgentCommandInput 
} from '@aws-sdk/client-bedrock-agent-runtime';

const bedrockAgentRuntime = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });

// Agent IDs from environment
const AGENT_IDS = {
  orchestrator: process.env.ORCHESTRATOR_AGENT_ID || '',
  extraction: process.env.EXTRACTION_AGENT_ID || '',
  compliance: process.env.COMPLIANCE_AGENT_ID || '',
  validation: process.env.VALIDATION_AGENT_ID || '',
};

const AGENT_ALIASES = {
  orchestrator: process.env.ORCHESTRATOR_ALIAS_ID || 'TSTALIASID',
  extraction: process.env.EXTRACTION_ALIAS_ID || 'TSTALIASID',
  compliance: process.env.COMPLIANCE_ALIAS_ID || 'TSTALIASID',
  validation: process.env.VALIDATION_ALIAS_ID || 'TSTALIASID',
};

interface InvokeAgentRequest {
  inputText: string;
  sessionId?: string;
  agentType?: 'orchestrator' | 'extraction' | 'compliance' | 'validation';
  enableTrace?: boolean;
  sessionAttributes?: Record<string, string>;
  invoiceData?: any;
}

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
  console.log('Invoke Bedrock Agent Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: '',
    };
  }

  try {
    const body: InvokeAgentRequest = JSON.parse(event.body || '{}');

    const {
      inputText,
      sessionId = generateSessionId(),
      agentType = 'orchestrator',
      enableTrace = true,
      sessionAttributes = {},
      invoiceData,
    } = body;

    if (!inputText) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'inputText is required',
        }),
      };
    }

    // Get agent ID and alias based on type
    const agentId = AGENT_IDS[agentType];
    const agentAliasId = AGENT_ALIASES[agentType];
    
    if (!agentId) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: `Invalid agent type: ${agentType}. Agent not configured.`,
          availableAgents: Object.keys(AGENT_IDS).filter(key => !!(AGENT_IDS as any)[key]),
        }),
      };
    }

    // Add invoice data to session attributes if provided
    if (invoiceData) {
      sessionAttributes.invoiceData = JSON.stringify(invoiceData);
    }

    // Invoke agent
    const input: InvokeAgentCommandInput = {
      agentId,
      agentAliasId,
      sessionId,
      inputText,
      enableTrace,
    };

    if (Object.keys(sessionAttributes).length > 0) {
      input.sessionState = {
        sessionAttributes,
      };
    }

    const command = new InvokeAgentCommand(input);
    const response = await bedrockAgentRuntime.send(command);

    // Process streaming response
    const agentResponse = await processAgentResponse(response);

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        response: agentResponse.text,
        trace: agentResponse.trace,
        sessionId,
        agentId,
        agentType,
        metadata: {
          processingTime: agentResponse.processingTime,
          traceEventsCount: agentResponse.trace.length,
        },
      }),
    };
  } catch (error) {
    console.error('Error invoking Bedrock agent:', error);

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        error: 'Failed to invoke agent',
        details: error instanceof Error ? error.message : String(error),
        message: 'The agent invocation failed. Please check agent configuration and try again.',
      }),
    };
  }
};

async function processAgentResponse(response: any): Promise<{
  text: string;
  trace: any[];
  processingTime: number;
}> {
  const startTime = Date.now();
  let agentText = '';
  const trace: any[] = [];

  try {
    const completion = response.completion;

    if (completion) {
      for await (const event of completion) {
        // Process chunk events (agent response text)
        if (event.chunk) {
          const chunk = event.chunk;
          if (chunk.bytes) {
            const chunkText = new TextDecoder().decode(chunk.bytes);
            agentText += chunkText;
          }
        }

        // Process trace events (agent reasoning)
        if (event.trace) {
          const traceEvent = processTraceEvent(event.trace);
          if (traceEvent) {
            trace.push(traceEvent);
          }
        }

        // Handle return control events
        if (event.returnControl) {
          console.log('Return control event:', event.returnControl);
        }

        // Handle file events (if any)
        if (event.files) {
          console.log('File event:', event.files);
        }
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      text: agentText || 'Agent processing complete',
      trace,
      processingTime,
    };
  } catch (error) {
    console.error('Error processing agent response:', error);
    return {
      text: 'Error processing agent response',
      trace: [],
      processingTime: Date.now() - startTime,
    };
  }
}

function processTraceEvent(trace: any): any {
  const traceEvent: any = {
    timestamp: new Date().toISOString(),
    type: 'unknown',
  };

  // Pre-processing trace
  if (trace.preProcessingTrace) {
    traceEvent.type = 'preprocessing';
    traceEvent.modelInvocationInput = trace.preProcessingTrace.modelInvocationInput;
    traceEvent.modelInvocationOutput = trace.preProcessingTrace.modelInvocationOutput;
  }

  // Orchestration trace
  else if (trace.orchestrationTrace) {
    const orchTrace = trace.orchestrationTrace;

    if (orchTrace.invocationInput) {
      traceEvent.type = 'orchestration_input';
      traceEvent.invocationInput = orchTrace.invocationInput;
    } else if (orchTrace.observation) {
      traceEvent.type = 'orchestration_observation';
      traceEvent.observation = orchTrace.observation;
    } else if (orchTrace.rationale) {
      traceEvent.type = 'orchestration_rationale';
      traceEvent.rationale = orchTrace.rationale;
      traceEvent.content = { text: orchTrace.rationale.text };
    } else if (orchTrace.modelInvocationInput) {
      traceEvent.type = 'orchestration_model_input';
      traceEvent.modelInvocationInput = orchTrace.modelInvocationInput;
    }
  }

  // Post-processing trace
  else if (trace.postProcessingTrace) {
    traceEvent.type = 'postprocessing';
    traceEvent.modelInvocationInput = trace.postProcessingTrace.modelInvocationInput;
    traceEvent.modelInvocationOutput = trace.postProcessingTrace.modelInvocationOutput;
  }

  // Failure trace
  else if (trace.failureTrace) {
    traceEvent.type = 'failure';
    traceEvent.failureReason = trace.failureTrace.failureReason;
    traceEvent.traceId = trace.failureTrace.traceId;
  }

  return traceEvent;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
