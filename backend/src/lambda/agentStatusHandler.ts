/**
 * Agent Status Handler
 * 
 * API endpoints for Agent Theater and real-time agent status
 * 
 * Routes:
 * GET /agents/status - Get all agent statuses
 * GET /agents/status/:agentId - Get specific agent status
 * POST /agents/simulate - Simulate agent workflow (for demos)
 * POST /agents/reset - Reset all agents to idle
 * GET /agents/activity - Get activity summary
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AgentStatusService from '../services/agentStatusService';

const agentStatusService = new AgentStatusService();

export const handler = async (event: any): Promise<any> => {
  console.log('🤖 Agent Status Handler:', event.requestContext?.http?.method || event.httpMethod, event.rawPath || event.path);

  try {
    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    };

    // Handle OPTIONS for CORS preflight
    const method = event.requestContext?.http?.method || event.httpMethod;
    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Parse path (works for both Function URL and API Gateway)
    const rawPath = event.rawPath || event.path || '';
    const pathParts = rawPath.split('/').filter(Boolean);
    const proxyPath = pathParts.slice(1).join('/'); // Remove 'agents-monitor' prefix

    // GET /agents-monitor/status - Get all agent statuses
    if (method === 'GET' && proxyPath === 'status') {
      const statuses = await agentStatusService.getAllAgentStatuses();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          agents: statuses,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // GET /agents-monitor/status/:agentId - Get specific agent status
    if (method === 'GET' && proxyPath.startsWith('status/')) {
      const agentId = proxyPath.split('/')[1];
      const status = await agentStatusService.getAgentStatus(agentId);

      if (!status) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Agent not found',
            agentId,
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          agent: status,
        }),
      };
    }

    // POST /agents-monitor/simulate - Simulate agent workflow
    if (method === 'POST' && proxyPath === 'simulate') {
      console.log('🎬 Starting agent workflow simulation...');

      const result = await agentStatusService.simulateWorkflow();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          simulation: {
            decisions: result.decisions,
            totalTime: result.totalTime,
            totalCost: result.totalCost,
            invoiceNumber: 'INV-2025-001234',
          },
          message: 'Workflow simulation complete',
        }),
      };
    }

    // POST /agents-monitor/reset - Reset all agents
    if (method === 'POST' && proxyPath === 'reset') {
      await agentStatusService.resetAllAgents();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'All agents reset to idle',
        }),
      };
    }

    // GET /agents-monitor/activity - Get activity summary
    if (method === 'GET' && proxyPath === 'activity') {
      const summary = await agentStatusService.getActivitySummary();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          activity: summary,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Route not found',
        path: event.path,
        method: event.httpMethod,
      }),
    };
  } catch (error: any) {
    console.error('❌ Agent Status Handler error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        details: error.stack,
      }),
    };
  }
};

/**
 * Streaming handler for real-time agent updates (WebSocket alternative)
 */
export const streamHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('📡 Agent Status Stream Handler');

  try {
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    };

    // For demo purposes, return current status
    // In production, implement Server-Sent Events or WebSocket
    const statuses = await agentStatusService.getAllAgentStatuses();

    return {
      statusCode: 200,
      headers,
      body: `data: ${JSON.stringify(statuses)}\n\n`,
    };
  } catch (error: any) {
    console.error('❌ Stream handler error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Stream error',
        message: error.message,
      }),
    };
  }
};
