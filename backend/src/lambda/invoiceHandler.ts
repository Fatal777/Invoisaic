import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InvoiceService } from '../services/invoiceService';

const invoiceService = new InvoiceService();

/**
 * API Gateway Lambda handler for invoice operations
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    const { httpMethod, path, pathParameters, queryStringParameters, body } = event;

    // Handle OPTIONS for CORS
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Route to appropriate handler
    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getInvoice(pathParameters.id, headers);
        } else {
          return await listInvoices(queryStringParameters || {}, headers);
        }

      case 'POST':
        if (path.includes('/send')) {
          return await sendInvoice(pathParameters?.id || '', headers);
        } else if (path.includes('/mark-paid')) {
          return await markAsPaid(pathParameters?.id || '', headers);
        } else {
          return await createInvoice(JSON.parse(body || '{}'), headers);
        }

      case 'PUT':
        return await updateInvoice(
          pathParameters?.id || '',
          JSON.parse(body || '{}'),
          headers
        );

      case 'DELETE':
        return await deleteInvoice(pathParameters?.id || '', headers);

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error: any) {
    console.error('Invoice handler error:', error);
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

async function createInvoice(data: any, headers: any): Promise<APIGatewayProxyResult> {
  const invoice = await invoiceService.createInvoice(data);
  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      data: invoice,
      message: 'Invoice created successfully with AI recommendations',
    }),
  };
}

async function getInvoice(id: string, headers: any): Promise<APIGatewayProxyResult> {
  const invoice = await invoiceService.getInvoice(id);
  
  if (!invoice) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Invoice not found' }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: invoice,
    }),
  };
}

async function listInvoices(params: any, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const result = await invoiceService.listInvoices(params);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...result
      }),
    };
  } catch (error: any) {
    console.error('List invoices error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        hasMore: false
      }),
    };
  }
}

async function updateInvoice(id: string, data: any, headers: any): Promise<APIGatewayProxyResult> {
  const invoice = await invoiceService.updateInvoice(id, data);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: invoice,
      message: 'Invoice updated successfully',
    }),
  };
}

async function deleteInvoice(id: string, headers: any): Promise<APIGatewayProxyResult> {
  await invoiceService.deleteInvoice(id);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Invoice deleted successfully',
    }),
  };
}

async function sendInvoice(id: string, headers: any): Promise<APIGatewayProxyResult> {
  const invoice = await invoiceService.sendInvoice(id);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: invoice,
      message: 'Invoice sent successfully',
    }),
  };
}

async function markAsPaid(id: string, headers: any): Promise<APIGatewayProxyResult> {
  const invoice = await invoiceService.markAsPaid(id);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: invoice,
      message: 'Invoice marked as paid',
    }),
  };
}
