/**
 * Semantic Search Handler using Titan Embeddings and Knowledge Base
 * Provides AI-powered search across invoices, customers, and tax knowledge
 */

import { 
  BedrockRuntimeClient, 
  InvokeModelCommand 
} from '@aws-sdk/client-bedrock-runtime';
import { 
  BedrockAgentRuntimeClient,
  RetrieveCommand
} from '@aws-sdk/client-bedrock-agent-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const bedrockClient = new BedrockRuntimeClient({});
const bedrockAgentClient = new BedrockAgentRuntimeClient({});
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TITAN_EMBEDDINGS_MODEL = 'amazon.titan-embed-text-v2:0';
const KNOWLEDGE_BASE_ID = process.env.KNOWLEDGE_BASE_ID || '';
const INVOICES_TABLE = process.env.DYNAMODB_INVOICES_TABLE || '';
const CUSTOMERS_TABLE = process.env.DYNAMODB_CUSTOMERS_TABLE || '';

export const handler = async (event: any) => {
  console.log('Search handler invoked:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { query, type, filters } = body;

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query is required' }),
      };
    }

    let results: any = {};

    switch (type) {
      case 'invoices':
        results = await searchInvoices(query, filters);
        break;
      case 'customers':
        results = await searchCustomers(query);
        break;
      case 'knowledge':
        results = await searchKnowledge(query);
        break;
      case 'all':
      default:
        const [invoices, customers, knowledge] = await Promise.all([
          searchInvoices(query, filters),
          searchCustomers(query),
          searchKnowledge(query),
        ]);
        results = { invoices, customers, knowledge };
        break;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        query,
        results,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

/**
 * Search invoices using semantic embeddings
 */
async function searchInvoices(query: string, filters?: any): Promise<any> {
  try {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Get all invoices (in production, use vector database)
    const scanCommand = new ScanCommand({
      TableName: INVOICES_TABLE,
      Limit: 100,
    });

    const response = await dynamoClient.send(scanCommand);
    const invoices = response.Items || [];

    // Calculate semantic similarity scores
    const scoredInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        const invoiceText = `${invoice.customerName} ${invoice.description || ''} ${invoice.notes || ''}`;
        const invoiceEmbedding = await generateEmbedding(invoiceText);
        const similarity = cosineSimilarity(queryEmbedding, invoiceEmbedding);

        return {
          ...invoice,
          relevanceScore: similarity,
        };
      })
    );

    // Sort by relevance and filter
    let results = scoredInvoices
      .filter((inv) => inv.relevanceScore > 0.5) // Threshold for relevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

    // Apply additional filters
    if (filters) {
      if (filters.minAmount) {
        results = results.filter((inv: any) => inv.amount >= filters.minAmount);
      }
      if (filters.maxAmount) {
        results = results.filter((inv: any) => inv.amount <= filters.maxAmount);
      }
      if (filters.status) {
        results = results.filter((inv: any) => inv.status === filters.status);
      }
      if (filters.dateFrom) {
        results = results.filter((inv: any) => inv.createdAt >= filters.dateFrom);
      }
      if (filters.dateTo) {
        results = results.filter((inv: any) => inv.createdAt <= filters.dateTo);
      }
    }

    return {
      items: results,
      total: results.length,
    };
  } catch (error) {
    console.error('Invoice search error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * Search customers using semantic embeddings
 */
async function searchCustomers(query: string): Promise<any> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const scanCommand = new ScanCommand({
      TableName: CUSTOMERS_TABLE,
      Limit: 100,
    });

    const response = await dynamoClient.send(scanCommand);
    const customers = response.Items || [];

    const scoredCustomers = await Promise.all(
      customers.map(async (customer) => {
        const customerText = `${customer.name} ${customer.email} ${customer.company || ''} ${customer.notes || ''}`;
        const customerEmbedding = await generateEmbedding(customerText);
        const similarity = cosineSimilarity(queryEmbedding, customerEmbedding);

        return {
          ...customer,
          relevanceScore: similarity,
        };
      })
    );

    const results = scoredCustomers
      .filter((cust) => cust.relevanceScore > 0.5)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

    return {
      items: results,
      total: results.length,
    };
  } catch (error) {
    console.error('Customer search error:', error);
    return { items: [], total: 0 };
  }
}

/**
 * Search knowledge base using Bedrock Retrieve API
 */
async function searchKnowledge(query: string): Promise<any> {
  try {
    if (!KNOWLEDGE_BASE_ID) {
      return {
        items: [],
        total: 0,
        message: 'Knowledge base not configured',
      };
    }

    const command = new RetrieveCommand({
      knowledgeBaseId: KNOWLEDGE_BASE_ID,
      retrievalQuery: {
        text: query,
      },
      retrievalConfiguration: {
        vectorSearchConfiguration: {
          numberOfResults: 5,
        },
      },
    });

    const response = await bedrockAgentClient.send(command);
    const results = response.retrievalResults || [];

    return {
      items: results.map((result) => ({
        content: result.content?.text,
        score: result.score,
        location: result.location?.s3Location?.uri,
        metadata: result.metadata,
      })),
      total: results.length,
    };
  } catch (error) {
    console.error('Knowledge base search error:', error);
    return {
      items: [],
      total: 0,
      error: 'Knowledge base search failed',
    };
  }
}

/**
 * Generate embeddings using Titan Embeddings V2
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const command = new InvokeModelCommand({
      modelId: TITAN_EMBEDDINGS_MODEL,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: text,
      }),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    // Return zero vector as fallback
    return new Array(1024).fill(0);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
