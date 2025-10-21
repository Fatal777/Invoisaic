/**
 * Architecture Handler
 * 
 * API endpoints for Architecture View
 * Provides AWS infrastructure metrics, costs, and health status
 * 
 * Routes:
 * GET /architecture/summary - Complete architecture overview
 * GET /architecture/services - All AWS services
 * GET /architecture/services/:serviceId - Specific service details
 * GET /architecture/cost - Cost analysis and comparison
 * GET /architecture/health - System health status
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWSMetricsService from '../services/awsMetricsService';

const metricsService = new AWSMetricsService();

export const handler = async (event: any): Promise<any> => {
  console.log('🏗️ Architecture Handler:', event.requestContext?.http?.method || event.httpMethod, event.rawPath || event.path);

  try {
    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
    };

    // Handle OPTIONS for CORS preflight
    const method = event.requestContext?.http?.method || event.httpMethod;
    if (method === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    // Parse path (works for both Function URL and API Gateway)
    const rawPath = event.rawPath || event.path || '';
    const pathParts = rawPath.split('/').filter(Boolean);
    const proxyPath = pathParts.slice(1).join('/'); // Remove 'architecture' prefix

    // GET /architecture/summary - Complete architecture overview
    if (method === 'GET' && proxyPath === 'summary') {
      console.log('📊 Fetching complete architecture summary...');

      const summary = await metricsService.getArchitectureSummary();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          architecture: summary,
          timestamp: new Date().toISOString(),
          message: 'Architecture summary retrieved successfully',
        }),
      };
    }

    // GET /architecture/services - All AWS services
    if (method === 'GET' && proxyPath === 'services') {
      console.log('📋 Fetching all AWS services...');

      const services = await metricsService.getAllMetrics();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          services,
          total: services.length,
          totalCost: metricsService.getTotalCost(),
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // GET /architecture/services/:serviceId - Specific service details
    if (method === 'GET' && proxyPath.startsWith('services/')) {
      const serviceId = proxyPath.split('/')[1];
      console.log(`🔍 Fetching service details for: ${serviceId}`);

      const service = await metricsService.getServiceMetrics(serviceId);

      if (!service) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'Service not found',
            serviceId,
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          service,
        }),
      };
    }

    // GET /architecture/cost - Cost analysis
    if (method === 'GET' && proxyPath === 'cost') {
      console.log('💰 Fetching cost analysis...');

      const costComparison = metricsService.getCostComparison();
      const totalCost = metricsService.getTotalCost();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          cost: {
            total: totalCost,
            monthly: totalCost,
            yearly: totalCost * 12,
            comparison: costComparison,
            breakdown: {
              frontend: metricsService.getServicesByTier('frontend').reduce((sum, s) => 
                sum + parseFloat(s.cost.replace(/[^0-9.]/g, '')), 0),
              api: metricsService.getServicesByTier('api').reduce((sum, s) => 
                sum + parseFloat(s.cost.replace(/[^0-9.]/g, '')), 0),
              compute: metricsService.getServicesByTier('compute').reduce((sum, s) => 
                sum + parseFloat(s.cost.replace(/[^0-9.]/g, '')), 0),
              ai: metricsService.getServicesByTier('ai').reduce((sum, s) => 
                sum + parseFloat(s.cost.replace(/[^0-9.]/g, '')), 0),
              data: metricsService.getServicesByTier('data').reduce((sum, s) => 
                sum + parseFloat(s.cost.replace(/[^0-9.]/g, '')), 0),
              infrastructure: metricsService.getServicesByTier('infrastructure').reduce((sum, s) => 
                sum + parseFloat(s.cost.replace(/[^0-9.]/g, '')), 0),
            },
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // GET /architecture/health - System health
    if (method === 'GET' && proxyPath === 'health') {
      console.log('🏥 Fetching system health...');

      const healthSummary = await metricsService.getHealthSummary();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          health: healthSummary,
          status: healthSummary.healthPercentage === 100 ? 'operational' : 
                  healthSummary.healthPercentage >= 80 ? 'degraded' : 'critical',
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
        availableRoutes: [
          'GET /architecture/summary',
          'GET /architecture/services',
          'GET /architecture/services/:serviceId',
          'GET /architecture/cost',
          'GET /architecture/health',
        ],
      }),
    };
  } catch (error: any) {
    console.error('❌ Architecture Handler error:', error);

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
