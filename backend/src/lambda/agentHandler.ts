import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };

  try {
    const { httpMethod, pathParameters } = event;

    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (httpMethod === 'GET') {
      if (pathParameters?.id) {
        return await getAgent(pathParameters.id, headers);
      } else {
        return await listAgents(headers);
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error: any) {
    console.error('Agent handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

async function listAgents(headers: any): Promise<APIGatewayProxyResult> {
  // Mock agent data - in production, this would query actual agent status
  const agents = [
    {
      id: 'supervisor-001',
      name: 'Supervisor Agent',
      type: 'supervisor',
      status: 'processing',
      currentTask: 'Coordinating invoice #INV-2025-045 processing',
      tasksCompleted: 1247,
      successRate: 98.5,
      averageProcessingTime: 2.3,
      lastActive: new Date().toISOString(),
    },
    {
      id: 'pricing-001',
      name: 'Pricing Agent',
      type: 'pricing',
      status: 'idle',
      currentTask: null,
      tasksCompleted: 892,
      successRate: 99.2,
      averageProcessingTime: 1.8,
      lastActive: new Date().toISOString(),
    },
    {
      id: 'compliance-001',
      name: 'Compliance Agent',
      type: 'compliance',
      status: 'processing',
      currentTask: 'Validating tax calculations for EU invoice',
      tasksCompleted: 1103,
      successRate: 97.8,
      averageProcessingTime: 3.1,
      lastActive: new Date().toISOString(),
    },
    {
      id: 'customer-001',
      name: 'Customer Intelligence Agent',
      type: 'customer_intelligence',
      status: 'idle',
      currentTask: null,
      tasksCompleted: 756,
      successRate: 96.4,
      averageProcessingTime: 2.7,
      lastActive: new Date().toISOString(),
    },
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: agents,
    }),
  };
}

async function getAgent(id: string, headers: any): Promise<APIGatewayProxyResult> {
  // Mock agent details
  const agent = {
    id,
    name: 'Agent',
    type: 'supervisor',
    status: 'active',
    tasksCompleted: 1000,
    successRate: 98.5,
    averageProcessingTime: 2.3,
    lastActive: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: agent,
    }),
  };
}
