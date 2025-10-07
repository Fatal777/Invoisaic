/**
 * Document Processing Handler using AWS Textract
 * Extracts structured data from invoices, receipts, and documents
 */

import { 
  TextractClient,
  AnalyzeDocumentCommand,
  AnalyzeExpenseCommand,
  GetDocumentAnalysisCommand,
  StartDocumentAnalysisCommand,
} from '@aws-sdk/client-textract';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const textractClient = new TextractClient({});
const s3Client = new S3Client({});
const bedrockClient = new BedrockRuntimeClient({});

const DOCUMENTS_BUCKET = process.env.S3_DOCUMENTS_BUCKET || '';
const BEDROCK_MODEL_ID = 'apac.amazon.nova-micro-v1:0';

export const handler = async (event: any) => {
  console.log('Document processing handler invoked:', JSON.stringify(event, null, 2));

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
    const { fileKey, fileType, action } = body;

    if (!fileKey) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'File key is required' }),
      };
    }

    let result;

    switch (action) {
      case 'extract-invoice':
        result = await extractInvoiceData(fileKey);
        break;
      case 'extract-receipt':
        result = await extractReceiptData(fileKey);
        break;
      case 'extract-general':
      default:
        result = await extractGeneralDocument(fileKey);
        break;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error: any) {
    console.error('Document processing error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

/**
 * Extract invoice data using Textract Analyze Expense
 */
async function extractInvoiceData(fileKey: string) {
  const startTime = Date.now();

  try {
    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: DOCUMENTS_BUCKET,
          Name: fileKey,
        },
      },
    });

    const response = await textractClient.send(command);
    const processingTime = (Date.now() - startTime) / 1000;

    // Extract summary fields
    const summaryFields = response.ExpenseDocuments?.[0]?.SummaryFields || [];
    const lineItems = response.ExpenseDocuments?.[0]?.LineItemGroups || [];

    // Parse extracted data
    const extractedData = {
      invoiceNumber: findField(summaryFields, ['INVOICE_RECEIPT_ID', 'INVOICE_NUMBER']),
      date: findField(summaryFields, ['INVOICE_RECEIPT_DATE', 'DATE']),
      dueDate: findField(summaryFields, ['DUE_DATE', 'PAYMENT_DATE']),
      vendorName: findField(summaryFields, ['VENDOR_NAME', 'SELLER', 'FROM']),
      vendorAddress: findField(summaryFields, ['VENDOR_ADDRESS', 'SELLER_ADDRESS']),
      vendorTaxId: findField(summaryFields, ['TAX_PAYER_ID', 'GST_NUMBER', 'VAT_NUMBER']),
      customerName: findField(summaryFields, ['RECEIVER_NAME', 'TO', 'BILL_TO']),
      customerAddress: findField(summaryFields, ['RECEIVER_ADDRESS', 'BILL_TO_ADDRESS']),
      subtotal: findField(summaryFields, ['SUBTOTAL', 'NET_AMOUNT']),
      tax: findField(summaryFields, ['TAX', 'TAX_AMOUNT', 'GST', 'VAT']),
      total: findField(summaryFields, ['TOTAL', 'AMOUNT_DUE', 'GRAND_TOTAL']),
      currency: detectCurrency(summaryFields),
      items: parseLineItems(lineItems),
    };

    // Calculate confidence score
    const confidence = calculateConfidence(summaryFields);

    // Use AI to enhance and validate data
    const enhancedData = await enhanceWithAI(extractedData);

    return {
      success: true,
      extractedData: enhancedData,
      confidence,
      processingTime,
      rawData: response.ExpenseDocuments?.[0],
    };
  } catch (error: any) {
    console.error('Invoice extraction error:', error);
    throw new Error(`Failed to extract invoice data: ${error.message}`);
  }
}

/**
 * Extract receipt data using Textract Analyze Expense
 */
async function extractReceiptData(fileKey: string) {
  const startTime = Date.now();

  try {
    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: DOCUMENTS_BUCKET,
          Name: fileKey,
        },
      },
    });

    const response = await textractClient.send(command);
    const processingTime = (Date.now() - startTime) / 1000;

    const summaryFields = response.ExpenseDocuments?.[0]?.SummaryFields || [];
    const lineItems = response.ExpenseDocuments?.[0]?.LineItemGroups || [];

    const extractedData = {
      merchantName: findField(summaryFields, ['VENDOR_NAME', 'MERCHANT_NAME']),
      merchantAddress: findField(summaryFields, ['VENDOR_ADDRESS', 'MERCHANT_ADDRESS']),
      date: findField(summaryFields, ['INVOICE_RECEIPT_DATE', 'DATE']),
      time: findField(summaryFields, ['TIME']),
      subtotal: findField(summaryFields, ['SUBTOTAL']),
      tax: findField(summaryFields, ['TAX', 'TAX_AMOUNT']),
      tip: findField(summaryFields, ['TIP', 'GRATUITY']),
      total: findField(summaryFields, ['TOTAL', 'AMOUNT_PAID']),
      paymentMethod: findField(summaryFields, ['PAYMENT_METHOD', 'CARD_TYPE']),
      items: parseLineItems(lineItems),
    };

    const confidence = calculateConfidence(summaryFields);

    return {
      success: true,
      extractedData,
      confidence,
      processingTime,
    };
  } catch (error: any) {
    console.error('Receipt extraction error:', error);
    throw new Error(`Failed to extract receipt data: ${error.message}`);
  }
}

/**
 * Extract general document using Textract Analyze Document
 */
async function extractGeneralDocument(fileKey: string) {
  const startTime = Date.now();

  try {
    const command = new AnalyzeDocumentCommand({
      Document: {
        S3Object: {
          Bucket: DOCUMENTS_BUCKET,
          Name: fileKey,
        },
      },
      FeatureTypes: ['TABLES', 'FORMS', 'SIGNATURES'],
    });

    const response = await textractClient.send(command);
    const processingTime = (Date.now() - startTime) / 1000;

    // Extract text blocks
    const blocks = response.Blocks || [];
    const text = blocks
      .filter((block) => block.BlockType === 'LINE')
      .map((block) => block.Text)
      .join('\n');

    // Extract key-value pairs
    const keyValues = extractKeyValuePairs(blocks);

    // Extract tables
    const tables = extractTables(blocks);

    return {
      success: true,
      extractedData: {
        fullText: text,
        keyValuePairs: keyValues,
        tables,
      },
      processingTime,
      blockCount: blocks.length,
    };
  } catch (error: any) {
    console.error('General document extraction error:', error);
    throw new Error(`Failed to extract document: ${error.message}`);
  }
}

/**
 * Find field value by type labels
 */
function findField(fields: any[], possibleLabels: string[]): string | undefined {
  for (const label of possibleLabels) {
    const field = fields.find((f) => f.Type?.Text === label);
    if (field && field.ValueDetection?.Text) {
      return field.ValueDetection.Text;
    }
  }
  return undefined;
}

/**
 * Parse line items from expense document
 */
function parseLineItems(lineItemGroups: any[]): any[] {
  const items: any[] = [];

  for (const group of lineItemGroups) {
    for (const lineItem of group.LineItems || []) {
      const item: any = {};

      for (const field of lineItem.LineItemExpenseFields || []) {
        const type = field.Type?.Text;
        const value = field.ValueDetection?.Text;

        if (type && value) {
          item[type.toLowerCase()] = value;
        }
      }

      if (Object.keys(item).length > 0) {
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * Detect currency from extracted fields
 */
function detectCurrency(fields: any[]): string {
  const currencyField = findField(fields, ['CURRENCY']);
  if (currencyField) {
    return currencyField;
  }

  // Try to detect from amount fields
  for (const field of fields) {
    const text = field.ValueDetection?.Text || '';
    if (text.includes('$')) return 'USD';
    if (text.includes('€')) return 'EUR';
    if (text.includes('£')) return 'GBP';
    if (text.includes('₹')) return 'INR';
  }

  return 'USD'; // Default
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(fields: any[]): number {
  if (fields.length === 0) return 0;

  let totalConfidence = 0;
  let count = 0;

  for (const field of fields) {
    if (field.ValueDetection?.Confidence) {
      totalConfidence += field.ValueDetection.Confidence;
      count++;
    }
  }

  return count > 0 ? Math.round(totalConfidence / count) : 0;
}

/**
 * Extract key-value pairs from blocks
 */
function extractKeyValuePairs(blocks: any[]): Record<string, string> {
  const pairs: Record<string, string> = {};

  const keyValueBlocks = blocks.filter(
    (block) => block.BlockType === 'KEY_VALUE_SET'
  );

  for (const kvBlock of keyValueBlocks) {
    if (kvBlock.EntityTypes?.includes('KEY')) {
      const key = getBlockText(kvBlock, blocks);
      const valueBlock = findValueBlock(kvBlock, blocks);
      if (valueBlock) {
        const value = getBlockText(valueBlock, blocks);
        if (key && value) {
          pairs[key] = value;
        }
      }
    }
  }

  return pairs;
}

/**
 * Extract tables from blocks
 */
function extractTables(blocks: any[]): any[][] {
  const tables: any[][] = [];
  const tableBlocks = blocks.filter((block) => block.BlockType === 'TABLE');

  for (const tableBlock of tableBlocks) {
    const cells = tableBlock.Relationships?.[0]?.Ids?.map((id: string) =>
      blocks.find((b) => b.Id === id)
    ).filter(Boolean) || [];

    // Group cells by row
    const rows: any[][] = [];
    for (const cell of cells) {
      const rowIndex = cell.RowIndex - 1;
      const colIndex = cell.ColumnIndex - 1;

      if (!rows[rowIndex]) {
        rows[rowIndex] = [];
      }

      rows[rowIndex][colIndex] = getBlockText(cell, blocks);
    }

    tables.push(rows);
  }

  return tables;
}

/**
 * Get text content from a block
 */
function getBlockText(block: any, allBlocks: any[]): string {
  if (block.Text) {
    return block.Text;
  }

  const childIds = block.Relationships?.[0]?.Ids || [];
  const texts = childIds
    .map((id: string) => allBlocks.find((b) => b.Id === id))
    .filter((b: any) => b && b.Text)
    .map((b: any) => b.Text);

  return texts.join(' ');
}

/**
 * Find corresponding value block for a key block
 */
function findValueBlock(keyBlock: any, blocks: any[]): any {
  const valueIds = keyBlock.Relationships?.find(
    (r: any) => r.Type === 'VALUE'
  )?.Ids || [];

  if (valueIds.length > 0) {
    return blocks.find((b) => b.Id === valueIds[0]);
  }

  return null;
}

/**
 * Enhance extracted data using AI
 */
async function enhanceWithAI(extractedData: any): Promise<any> {
  try {
    const prompt = `Enhance and validate this invoice data. Fill in missing fields, correct errors, and standardize format:

${JSON.stringify(extractedData, null, 2)}

Return only valid JSON with corrected/enhanced data.`;

    const command = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{ role: 'user', content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 1000, temperature: 0.1 },
      }),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiText = responseBody.content?.[0]?.text || '';

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return extractedData;
  } catch (error) {
    console.error('AI enhancement error:', error);
    return extractedData;
  }
}
