import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };

  try {
    const { httpMethod, path } = event;

    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    if (httpMethod === 'GET') {
      if (path.includes('/dashboard')) {
        return await getDashboardMetrics(headers);
      } else if (path.includes('/revenue')) {
        return await getRevenueData(headers);
      } else if (path.includes('/payment-trends')) {
        return await getPaymentTrends(headers);
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error: any) {
    console.error('Analytics handler error:', error);
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

async function getDashboardMetrics(headers: any): Promise<APIGatewayProxyResult> {
  // Mock dashboard metrics - in production, query from DynamoDB
  const metrics = {
    totalRevenue: 125000,
    revenueChange: 12.5,
    outstandingAmount: 45000,
    outstandingChange: -8.3,
    averagePaymentDays: 28,
    paymentDaysChange: -15.2,
    invoiceCount: 156,
    invoiceCountChange: 23.1,
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: metrics,
    }),
  };
}

async function getRevenueData(headers: any): Promise<APIGatewayProxyResult> {
  // Mock revenue data
  const data = [
    { month: 'Jan', revenue: 18000, invoices: 24 },
    { month: 'Feb', revenue: 22000, invoices: 28 },
    { month: 'Mar', revenue: 19500, invoices: 26 },
    { month: 'Apr', revenue: 25000, invoices: 32 },
    { month: 'May', revenue: 28000, invoices: 35 },
    { month: 'Jun', revenue: 31000, invoices: 38 },
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
}

async function getPaymentTrends(headers: any): Promise<APIGatewayProxyResult> {
  // Mock payment trends
  const data = [
    { date: '2025-01-01', onTime: 15, late: 3, overdue: 1 },
    { date: '2025-01-08', onTime: 18, late: 2, overdue: 0 },
    { date: '2025-01-15', onTime: 20, late: 4, overdue: 1 },
    { date: '2025-01-22', onTime: 22, late: 3, overdue: 2 },
    { date: '2025-01-29', onTime: 25, late: 2, overdue: 1 },
  ];

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data,
    }),
  };
}
