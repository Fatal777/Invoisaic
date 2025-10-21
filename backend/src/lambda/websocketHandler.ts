import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AgentCoordinator } from '../services/agentCoordinator';

const dynamoDBClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE || 'invoisaic-websocket-connections';

/**
 * WebSocket Handler for real-time invoice processing updates
 * Handles connection lifecycle and message routing
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('WebSocket event:', JSON.stringify(event, null, 2));

  const { requestContext } = event;
  const { connectionId, routeKey } = requestContext;

  if (!connectionId) {
    return { statusCode: 400, body: 'No connection ID' };
  }

  try {
    switch (routeKey) {
      case '$connect':
        return await handleConnect(connectionId);

      case '$disconnect':
        return await handleDisconnect(connectionId);

      case 'processInvoice':
        return await handleProcessInvoice(connectionId, event);

      case '$default':
        return await handleDefault(connectionId, event);

      default:
        console.log(`Unknown route: ${routeKey}`);
        return { statusCode: 400, body: `Unknown route: ${routeKey}` };
    }
  } catch (error) {
    console.error('WebSocket handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

/**
 * Handle new WebSocket connection
 */
async function handleConnect(connectionId: string): Promise<APIGatewayProxyResult> {
  console.log(`New connection: ${connectionId}`);

  try {
    await dynamoDB.send(new PutCommand({
      TableName: CONNECTIONS_TABLE,
      Item: {
        connectionId,
        timestamp: Date.now(),
        connectedAt: new Date().toISOString()
      }
    }));

    console.log(`Connection ${connectionId} stored in DynamoDB`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Connected successfully' })
    };
  } catch (error) {
    console.error('Error storing connection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to establish connection' })
    };
  }
}

/**
 * Handle WebSocket disconnection
 */
async function handleDisconnect(connectionId: string): Promise<APIGatewayProxyResult> {
  console.log(`Disconnecting: ${connectionId}`);

  try {
    await dynamoDB.send(new DeleteCommand({
      TableName: CONNECTIONS_TABLE,
      Key: { connectionId }
    }));

    console.log(`Connection ${connectionId} removed from DynamoDB`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Disconnected successfully' })
    };
  } catch (error) {
    console.error('Error removing connection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to disconnect' })
    };
  }
}

/**
 * Handle invoice processing request
 */
async function handleProcessInvoice(
  connectionId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log(`Processing invoice for connection: ${connectionId}`);

  try {
    const body = JSON.parse(event.body || '{}');
    const { invoiceId, s3Bucket, s3Key } = body;

    if (!s3Key) {
      await sendMessageToClient(connectionId, event.requestContext.domainName!, event.requestContext.stage!, {
        type: 'error',
        data: { message: 'Missing s3Key in request' }
      });
      return { statusCode: 400, body: 'Missing s3Key' };
    }

    // Send acknowledgment
    await sendMessageToClient(connectionId, event.requestContext.domainName!, event.requestContext.stage!, {
      type: 'processing_started',
      data: {
        invoiceId: invoiceId || s3Key,
        message: 'Invoice processing started',
        timestamp: new Date().toISOString()
      }
    });

    // Run real agent orchestration - await it to keep Lambda alive
    const bucketName = s3Bucket || process.env.S3_DOCUMENTS_BUCKET;

    const coordinator = new AgentCoordinator(
      connectionId,
      event.requestContext.domainName!,
      event.requestContext.stage!
    );

    // Execute orchestration - this will send real-time updates via WebSocket
    try {
      await coordinator.orchestrateInvoiceProcessing(bucketName, s3Key);
    } catch (error) {
      console.error('Orchestration failed:', error);
      await sendMessageToClient(connectionId, event.requestContext.domainName!, event.requestContext.stage!, {
        type: 'error',
        data: { message: 'Processing failed', error: String(error) }
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Processing started' })
    };
  } catch (error) {
    console.error('Error processing invoice:', error);
    await sendMessageToClient(connectionId, event.requestContext.domainName!, event.requestContext.stage!, {
      type: 'error',
      data: { message: 'Failed to process invoice', error: String(error) }
    });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Processing failed' })
    };
  }
}

/**
 * Handle default route (catch-all)
 */
async function handleDefault(
  connectionId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log(`Default route for connection: ${connectionId}`);
  console.log('Message body:', event.body);

  await sendMessageToClient(connectionId, event.requestContext.domainName!, event.requestContext.stage!, {
    type: 'echo',
    data: { message: 'Message received', body: event.body }
  });

  return { statusCode: 200, body: 'Message received' };
}

/**
 * Send message to a specific WebSocket client
 */
export async function sendMessageToClient(
  connectionId: string,
  domainName: string,
  stage: string,
  message: any
): Promise<void> {
  const endpoint = `https://${domainName}/${stage}`;
  const apiGateway = new ApiGatewayManagementApiClient({ endpoint });

  try {
    await apiGateway.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(message))
    }));

    console.log(`Message sent to ${connectionId}:`, message.type);
  } catch (error: any) {
    if (error.statusCode === 410) {
      console.log(`Connection ${connectionId} is stale, removing...`);
      await dynamoDB.send(new DeleteCommand({
        TableName: CONNECTIONS_TABLE,
        Key: { connectionId }
      }));
    } else {
      console.error(`Error sending message to ${connectionId}:`, error);
      throw error;
    }
  }
}

/**
 * Broadcast message to all connected clients
 */
export async function broadcastMessage(
  domainName: string,
  stage: string,
  message: any
): Promise<void> {
  console.log('Broadcasting message to all clients');

  try {
    const result = await dynamoDB.send(new ScanCommand({
      TableName: CONNECTIONS_TABLE,
      ProjectionExpression: 'connectionId'
    }));

    const connections = result.Items || [];
    console.log(`Found ${connections.length} active connections`);

    await Promise.all(
      connections.map(({ connectionId }) =>
        sendMessageToClient(connectionId, domainName, stage, message)
      )
    );
  } catch (error) {
    console.error('Error broadcasting message:', error);
    throw error;
  }
}

/**
 * Simulate processing with mock agent updates
 * This will be replaced with real agent orchestration
 */
async function simulateProcessing(
  connectionId: string,
  domainName: string,
  stage: string
): Promise<void> {
  const steps = [
    {
      delay: 1000,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'OCR Agent',
          status: 'running',
          message: 'Starting document text extraction...',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 2000,
      message: {
        type: 'field_extracted',
        data: {
          fieldName: 'Invoice Number',
          value: 'INV-2025-001',
          confidence: 0.98,
          page: 1,
          boundingBox: { left: 0.15, top: 0.12, width: 0.25, height: 0.03 }
        }
      }
    },
    {
      delay: 2500,
      message: {
        type: 'field_extracted',
        data: {
          fieldName: 'Total Amount',
          value: '₹45,670.00',
          confidence: 0.95,
          page: 1,
          boundingBox: { left: 0.75, top: 0.85, width: 0.20, height: 0.04 }
        }
      }
    },
    {
      delay: 3000,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'OCR Agent',
          status: 'completed',
          message: 'Text extraction completed - 15 fields extracted',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 3500,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'Validation Agent',
          status: 'running',
          message: 'Validating extracted data...',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 5000,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'Validation Agent',
          status: 'completed',
          message: 'Validation completed - All fields valid',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 5500,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'Tax Compliance Agent',
          status: 'running',
          message: 'Checking tax compliance using Knowledge Base...',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 7000,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'Tax Compliance Agent',
          status: 'completed',
          message: 'Tax compliance verified - Invoice is compliant',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 7500,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'Fraud Detection Agent',
          status: 'running',
          message: 'Analyzing for fraud patterns...',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 9000,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'Fraud Detection Agent',
          status: 'completed',
          message: 'Fraud analysis completed - Low risk score: 12%',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 9500,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'GL Coding Agent',
          status: 'running',
          message: 'Assigning general ledger codes...',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 11000,
      message: {
        type: 'agent_activity',
        data: {
          agentName: 'GL Coding Agent',
          status: 'completed',
          message: 'GL coding completed - 5 entries created',
          timestamp: new Date().toISOString()
        }
      }
    },
    {
      delay: 11500,
      message: {
        type: 'processing_complete',
        data: {
          message: 'All agents completed successfully',
          decision: 'APPROVED',
          timestamp: new Date().toISOString(),
          summary: {
            fieldsExtracted: 15,
            validationPassed: true,
            taxCompliant: true,
            fraudRisk: 12,
            glEntriesCreated: 5
          }
        }
      }
    }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, step.delay));
    await sendMessageToClient(connectionId, domainName, stage, step.message);
  }
}
