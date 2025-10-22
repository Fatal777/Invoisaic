/**
 * Invoice Processing Handler
 * Main API endpoint for processing invoices through Bedrock agents
 */

import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockAgentOrchestrator } from '../services/bedrockAgentOrchestrator';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const textractClient = new TextractClient({ region: process.env.AWS_REGION || 'ap-south-1' });

interface ProcessInvoiceRequest {
  s3Bucket?: string;
  s3Key?: string;
  invoiceData?: any;
  useTextract?: boolean;
}

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
  console.log('Invoice Processing Event:', JSON.stringify(event, null, 2));

  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: '',
    };
  }

  try {
    const body: ProcessInvoiceRequest = JSON.parse(event.body || '{}');
    const { s3Bucket, s3Key, invoiceData, useTextract = false } = body;

    // Get invoice data
    let processedInvoiceData = invoiceData;

    // If S3 location provided and useTextract is true, extract text first
    if (s3Bucket && s3Key && useTextract) {
      console.log('Extracting text from S3 document...');
      processedInvoiceData = await extractTextFromS3(s3Bucket, s3Key);
    } else if (!processedInvoiceData) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          error: 'Either invoiceData or (s3Bucket + s3Key) must be provided',
        }),
      };
    }

    // Initialize orchestrator
    const orchestrator = new BedrockAgentOrchestrator();

    // Process invoice through all agents
    console.log('Starting agent orchestration...');
    const result = await orchestrator.processInvoice(processedInvoiceData);

    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        success: true,
        result,
      }),
    };

  } catch (error) {
    console.error('Invoice processing error:', error);

    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        success: false,
        error: 'Invoice processing failed',
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};

/**
 * Extract text from S3 document using Textract
 */
async function extractTextFromS3(bucket: string, key: string): Promise<any> {
  try {
    const response = await textractClient.send(new AnalyzeDocumentCommand({
      Document: {
        S3Object: { Bucket: bucket, Name: key },
      },
      FeatureTypes: ['FORMS', 'TABLES'],
    }));

    const blocks = response.Blocks || [];
    const fields: Record<string, string> = {};
    const tables: any[] = [];

    // Extract key-value pairs
    const keyValueBlocks = blocks.filter(b => b.BlockType === 'KEY_VALUE_SET');
    
    for (const kvBlock of keyValueBlocks) {
      if (kvBlock.EntityTypes?.includes('KEY')) {
        const valueBlock = findRelatedBlock(kvBlock, blocks, 'VALUE');
        
        if (valueBlock) {
          const keyText = getBlockText(kvBlock, blocks);
          const valueText = getBlockText(valueBlock, blocks);
          
          if (keyText && valueText) {
            fields[keyText.trim()] = valueText.trim();
          }
        }
      }
    }

    // Extract tables
    const tableBlocks = blocks.filter(b => b.BlockType === 'TABLE');
    
    for (const tableBlock of tableBlocks) {
      const table = extractTable(tableBlock, blocks);
      if (table.length > 0) {
        tables.push(table);
      }
    }

    return {
      documentType: 'invoice',
      extractedFields: fields,
      tables,
      rawText: blocks
        .filter(b => b.BlockType === 'LINE')
        .map(b => b.Text)
        .join('\n'),
    };

  } catch (error) {
    console.error('Textract extraction error:', error);
    throw new Error(`Failed to extract text from S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper functions for Textract block processing
 */
function findRelatedBlock(block: any, allBlocks: any[], relationType: string): any {
  const relationId = block.Relationships?.find((r: any) => r.Type === relationType)?.Ids?.[0];
  return allBlocks.find(b => b.Id === relationId);
}

function getBlockText(block: any, allBlocks: any[]): string {
  const childIds = block.Relationships?.find((r: any) => r.Type === 'CHILD')?.Ids || [];
  const childBlocks = allBlocks.filter(b => childIds.includes(b.Id));
  return childBlocks.map(b => b.Text || '').join(' ').trim();
}

function extractTable(tableBlock: any, allBlocks: any[]): any[] {
  const cellIds = tableBlock.Relationships?.find((r: any) => r.Type === 'CHILD')?.Ids || [];
  const cells = allBlocks.filter(b => cellIds.includes(b.Id) && b.BlockType === 'CELL');
  
  const rows: any[] = [];
  
  for (const cell of cells) {
    const rowIndex = cell.RowIndex - 1;
    const colIndex = cell.ColumnIndex - 1;
    
    if (!rows[rowIndex]) {
      rows[rowIndex] = [];
    }
    
    rows[rowIndex][colIndex] = getBlockText(cell, allBlocks);
  }
  
  return rows;
}

function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
