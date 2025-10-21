import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.REGION || process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_CUSTOMERS_TABLE || 'invoisaic-customers';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    const { httpMethod, pathParameters, queryStringParameters, body } = event;

    if (httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers, body: '' };
    }

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getCustomer(pathParameters.id, headers);
        } else {
          return await listCustomers(queryStringParameters || {}, headers);
        }

      case 'POST':
        return await createCustomer(JSON.parse(body || '{}'), headers);

      case 'PUT':
        return await updateCustomer(
          pathParameters?.id || '',
          JSON.parse(body || '{}'),
          headers
        );

      case 'DELETE':
        return await deleteCustomer(pathParameters?.id || '', headers);

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error: any) {
    console.error('Customer handler error:', error);
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

async function createCustomer(data: any, headers: any): Promise<APIGatewayProxyResult> {
  const customerId = uuidv4();
  const timestamp = new Date().toISOString();

  const customer = {
    id: customerId,
    ...data,
    totalInvoices: 0,
    totalRevenue: 0,
    averagePaymentDays: 0,
    riskScore: 50,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: customer,
    })
  );

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    }),
  };
}

async function getCustomer(id: string, headers: any): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id },
    })
  );

  if (!result.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Customer not found' }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result.Item,
    }),
  };
}

async function listCustomers(params: any, headers: any): Promise<APIGatewayProxyResult> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: tableName,
      Limit: parseInt(params.pageSize || '20'),
    })
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      items: result.Items || [],
      total: result.Count || 0,
      page: parseInt(params.page || '1'),
      pageSize: parseInt(params.pageSize || '20'),
      hasMore: !!result.LastEvaluatedKey,
    }),
  };
}

async function updateCustomer(id: string, data: any, headers: any): Promise<APIGatewayProxyResult> {
  const timestamp = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: 'set #data = :data, updatedAt = :timestamp',
      ExpressionAttributeNames: {
        '#data': 'data',
      },
      ExpressionAttributeValues: {
        ':data': data,
        ':timestamp': timestamp,
      },
      ReturnValues: 'ALL_NEW',
    })
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      data: result.Attributes,
      message: 'Customer updated successfully',
    }),
  };
}

async function deleteCustomer(id: string, headers: any): Promise<APIGatewayProxyResult> {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { id },
    })
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Customer deleted successfully',
    }),
  };
}
