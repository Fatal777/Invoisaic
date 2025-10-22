/**
 * Extraction Agent Action Group Handler
 * Implements all extraction-related actions for the Extraction Agent
 */

import { 
  TextractClient, 
  AnalyzeExpenseCommand,
  AnalyzeDocumentCommand,
  FeatureType 
} from '@aws-sdk/client-textract';
import { 
  DynamoDBClient 
} from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand 
} from '@aws-sdk/lib-dynamodb';
import { 
  S3Client,
  GetObjectCommand 
} from '@aws-sdk/client-s3';

// Initialize AWS clients
const textractClient = new TextractClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const INVOICE_TABLE = process.env.INVOICE_TABLE || 'Invoisaic-Invoices';
const INVOICE_BUCKET = process.env.INVOICE_BUCKET || 'invoisaic-invoices';

interface ActionEvent {
  actionGroup: string;
  function: string;
  parameters: Array<{ name: string; type: string; value: string }>;
  messageVersion: string;
  sessionAttributes?: Record<string, string>;
  sessionId?: string;
}

interface ActionResponse {
  response: {
    actionGroup: string;
    function: string;
    functionResponse: {
      responseBody: {
        'application/json': {
          body: string;
        };
      };
    };
  };
}

/**
 * Main Lambda handler for Extraction Agent actions
 */
export const handler = async (event: ActionEvent): Promise<ActionResponse> => {
  console.log('Extraction action event:', JSON.stringify(event, null, 2));

  const { actionGroup, function: functionName, parameters } = event;

  try {
    let result: any;

    switch (functionName) {
      case 'extract_with_textract':
        result = await extractWithTextract(parameters);
        break;
      case 'validate_extraction':
        result = await validateExtraction(parameters);
        break;
      case 'classify_document_type':
        result = await classifyDocumentType(parameters);
        break;
      case 'calculate_confidence_scores':
        result = await calculateConfidenceScores(parameters);
        break;
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    return formatResponse(actionGroup, functionName, result);
  } catch (error: any) {
    console.error('Error in extraction action:', error);
    return formatResponse(actionGroup, functionName, {
      error: error.message,
      status: 'failed'
    });
  }
};

/**
 * Extract invoice data using AWS Textract
 */
async function extractWithTextract(parameters: any[]): Promise<any> {
  const s3Uri = getParameter(parameters, 's3_uri');
  const invoiceId = getParameter(parameters, 'invoice_id');

  if (!s3Uri || !invoiceId) {
    throw new Error('s3_uri and invoice_id are required');
  }

  // Parse S3 URI
  const { bucket, key } = parseS3Uri(s3Uri);

  console.log(`Extracting invoice ${invoiceId} from ${bucket}/${key}`);

  try {
    // Use Textract AnalyzeExpense for invoice-specific extraction
    const command = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: bucket,
          Name: key
        }
      }
    });

    const response = await textractClient.send(command);

    // Process Textract response
    const extractedData = processTextractResponse(response);

    // Store extraction results in DynamoDB
    await storeExtractionResults(invoiceId, extractedData, s3Uri);

    return {
      extraction_status: 'success',
      invoice_id: invoiceId,
      confidence_score: calculateOverallConfidence(extractedData),
      invoice_data: extractedData,
      fields_extracted: Object.keys(extractedData.fields || {}).length,
      line_items_count: extractedData.line_items?.length || 0,
      validation_flags: extractedData.validation_flags || [],
      quality_issues: extractedData.quality_issues || []
    };
  } catch (error: any) {
    console.error('Textract extraction error:', error);
    throw new Error(`Textract extraction failed: ${error.message}`);
  }
}

/**
 * Validate extracted data quality and completeness
 */
async function validateExtraction(parameters: any[]): Promise<any> {
  const extractedDataStr = getParameter(parameters, 'extracted_data');

  if (!extractedDataStr) {
    throw new Error('extracted_data is required');
  }

  let extractedData: any;
  try {
    extractedData = JSON.parse(extractedDataStr);
  } catch (error) {
    throw new Error('Invalid JSON format for extracted_data');
  }

  const validation_flags: string[] = [];
  const quality_issues: string[] = [];
  const missing_fields: string[] = [];

  // Required fields check
  const requiredFields = [
    'invoice_number',
    'invoice_date',
    'vendor_name',
    'total_amount',
    'tax_amount'
  ];

  for (const field of requiredFields) {
    if (!extractedData.fields?.[field]) {
      missing_fields.push(field);
      quality_issues.push(`Missing required field: ${field}`);
    } else {
      validation_flags.push(`Required field present: ${field}`);
    }
  }

  // Confidence threshold check
  if (extractedData.confidence_score < 0.85) {
    quality_issues.push(`Low overall confidence: ${extractedData.confidence_score}`);
  }

  // Mathematical validation
  if (extractedData.fields?.total_amount && extractedData.fields?.tax_amount) {
    const total = parseFloat(extractedData.fields.total_amount.value);
    const tax = parseFloat(extractedData.fields.tax_amount.value);
    const subtotal = total - tax;

    if (subtotal > 0 && tax > 0) {
      validation_flags.push('Total and tax amounts are logical');
    }
  }

  // Line items validation
  if (extractedData.line_items && extractedData.line_items.length > 0) {
    validation_flags.push(`${extractedData.line_items.length} line items extracted`);
    
    // Validate line item totals
    const lineItemSum = extractedData.line_items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.total?.value || 0));
    }, 0);

    if (extractedData.fields?.total_amount) {
      const total = parseFloat(extractedData.fields.total_amount.value);
      const diff = Math.abs(total - lineItemSum);
      
      if (diff < 1.0) {
        validation_flags.push('Line item totals match invoice total');
      } else {
        quality_issues.push(`Line item sum mismatch: ${lineItemSum} vs ${total}`);
      }
    }
  }

  // Date validation
  if (extractedData.fields?.invoice_date && extractedData.fields?.due_date) {
    const invoiceDate = new Date(extractedData.fields.invoice_date.value);
    const dueDate = new Date(extractedData.fields.due_date.value);

    if (dueDate > invoiceDate) {
      validation_flags.push('Due date is after invoice date');
    } else {
      quality_issues.push('Invalid dates: due date must be after invoice date');
    }
  }

  return {
    validation_status: quality_issues.length === 0 ? 'PASSED' : 'FAILED',
    completeness_score: 1 - (missing_fields.length / requiredFields.length),
    validation_flags,
    quality_issues,
    missing_fields,
    recommendations: quality_issues.length > 0 
      ? ['Review and correct quality issues before proceeding']
      : ['Data quality is acceptable for processing']
  };
}

/**
 * Classify document type and format
 */
async function classifyDocumentType(parameters: any[]): Promise<any> {
  const s3Uri = getParameter(parameters, 's3_uri');

  if (!s3Uri) {
    throw new Error('s3_uri is required');
  }

  const { bucket, key } = parseS3Uri(s3Uri);

  try {
    // Get document metadata
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const { ContentType, ContentLength, Metadata } = await s3Client.send(getObjectCommand);

    // Classify based on file extension and content type
    const fileExtension = key.split('.').pop()?.toLowerCase();
    let documentType = 'unknown';
    let confidence = 0.5;

    if (fileExtension === 'pdf' || ContentType === 'application/pdf') {
      documentType = 'pdf_invoice';
      confidence = 0.95;
    } else if (['jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
      documentType = 'image_invoice';
      confidence = 0.90;
    }

    // Determine invoice format hints
    const formatHints: string[] = [];
    if (ContentLength && ContentLength > 500000) {
      formatHints.push('large_document');
    }
    if (key.includes('multi')) {
      formatHints.push('multi_page');
    }

    return {
      document_type: documentType,
      confidence: confidence,
      file_extension: fileExtension,
      content_type: ContentType,
      file_size_bytes: ContentLength,
      format_hints: formatHints,
      processing_recommendation: documentType === 'pdf_invoice' 
        ? 'Use Textract AnalyzeExpense for best results'
        : 'Use Textract AnalyzeDocument with TABLES and FORMS features'
    };
  } catch (error: any) {
    console.error('Document classification error:', error);
    throw new Error(`Document classification failed: ${error.message}`);
  }
}

/**
 * Calculate field-level confidence scores
 */
async function calculateConfidenceScores(parameters: any[]): Promise<any> {
  const extractedDataStr = getParameter(parameters, 'extracted_data');

  if (!extractedDataStr) {
    throw new Error('extracted_data is required');
  }

  let extractedData: any;
  try {
    extractedData = JSON.parse(extractedDataStr);
  } catch (error) {
    throw new Error('Invalid JSON format for extracted_data');
  }

  const fieldScores: Record<string, number> = {};
  const lowConfidenceFields: string[] = [];
  let totalConfidence = 0;
  let fieldCount = 0;

  // Calculate scores for each field
  if (extractedData.fields) {
    for (const [fieldName, fieldData] of Object.entries(extractedData.fields as Record<string, any>)) {
      const confidence = fieldData.confidence || 0;
      fieldScores[fieldName] = confidence;
      totalConfidence += confidence;
      fieldCount++;

      if (confidence < 0.85) {
        lowConfidenceFields.push(`${fieldName} (${(confidence * 100).toFixed(1)}%)`);
      }
    }
  }

  const overallConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0;

  return {
    overall_confidence: overallConfidence,
    field_scores: fieldScores,
    low_confidence_fields: lowConfidenceFields,
    total_fields_analyzed: fieldCount,
    confidence_grade: overallConfidence > 0.95 ? 'EXCELLENT' :
                      overallConfidence > 0.85 ? 'GOOD' :
                      overallConfidence > 0.70 ? 'ACCEPTABLE' : 'POOR',
    recommendations: lowConfidenceFields.length > 0
      ? [`Manual review recommended for: ${lowConfidenceFields.join(', ')}`]
      : ['All fields extracted with high confidence']
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getParameter(parameters: any[], name: string): string | undefined {
  const param = parameters.find(p => p.name === name);
  return param?.value;
}

function parseS3Uri(s3Uri: string): { bucket: string; key: string } {
  if (!s3Uri.startsWith('s3://')) {
    throw new Error(`Invalid S3 URI format: ${s3Uri}`);
  }

  const parts = s3Uri.substring(5).split('/');
  const bucket = parts[0];
  const key = parts.slice(1).join('/');

  return { bucket, key };
}

function processTextractResponse(response: any): any {
  const fields: Record<string, any> = {};
  const lineItems: any[] = [];
  const validationFlags: string[] = [];
  const qualityIssues: string[] = [];

  // Process expense documents
  if (response.ExpenseDocuments && response.ExpenseDocuments.length > 0) {
    const expenseDoc = response.ExpenseDocuments[0];

    // Extract summary fields
    if (expenseDoc.SummaryFields) {
      for (const field of expenseDoc.SummaryFields) {
        const fieldType = field.Type?.Text || 'unknown';
        const fieldValue = field.ValueDetection?.Text || '';
        const confidence = field.ValueDetection?.Confidence || 0;

        const normalizedKey = normalizeFieldType(fieldType);
        fields[normalizedKey] = {
          value: fieldValue,
          confidence: confidence / 100,
          raw_type: fieldType
        };
      }
    }

    // Extract line items
    if (expenseDoc.LineItemGroups) {
      for (const group of expenseDoc.LineItemGroups) {
        if (group.LineItems) {
          for (const item of group.LineItems) {
            const lineItem: Record<string, any> = {};

            if (item.LineItemExpenseFields) {
              for (const field of item.LineItemExpenseFields) {
                const fieldType = field.Type?.Text || 'unknown';
                const fieldValue = field.ValueDetection?.Text || '';
                const confidence = field.ValueDetection?.Confidence || 0;

                const normalizedKey = normalizeFieldType(fieldType);
                lineItem[normalizedKey] = {
                  value: fieldValue,
                  confidence: confidence / 100
                };
              }
            }

            lineItems.push(lineItem);
          }
        }
      }
    }
  }

  return {
    fields,
    line_items: lineItems,
    validation_flags: validationFlags,
    quality_issues: qualityIssues
  };
}

function normalizeFieldType(fieldType: string): string {
  const mapping: Record<string, string> = {
    'INVOICE_RECEIPT_ID': 'invoice_number',
    'INVOICE_RECEIPT_DATE': 'invoice_date',
    'DUE_DATE': 'due_date',
    'VENDOR_NAME': 'vendor_name',
    'VENDOR_ADDRESS': 'vendor_address',
    'TOTAL': 'total_amount',
    'TAX': 'tax_amount',
    'SUBTOTAL': 'subtotal',
    'ITEM': 'description',
    'QUANTITY': 'quantity',
    'UNIT_PRICE': 'unit_price',
    'PRICE': 'total'
  };

  return mapping[fieldType] || fieldType.toLowerCase().replace(/\s+/g, '_');
}

async function storeExtractionResults(invoiceId: string, extractedData: any, s3Uri: string): Promise<void> {
  const command = new PutCommand({
    TableName: INVOICE_TABLE,
    Item: {
      invoiceId,
      timestamp: Date.now(),
      status: 'EXTRACTED',
      s3Uri,
      extractionData: extractedData,
      createdAt: new Date().toISOString(),
      extractedFields: Object.keys(extractedData.fields || {})
    }
  });

  await docClient.send(command);
  console.log(`Stored extraction results for invoice ${invoiceId}`);
}

function calculateOverallConfidence(extractedData: any): number {
  if (!extractedData.fields) return 0;

  const confidences = Object.values(extractedData.fields as Record<string, any>)
    .map(field => field.confidence || 0);

  if (confidences.length === 0) return 0;

  return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
}

function formatResponse(actionGroup: string, functionName: string, result: any): ActionResponse {
  return {
    response: {
      actionGroup,
      function: functionName,
      functionResponse: {
        responseBody: {
          'application/json': {
            body: JSON.stringify(result)
          }
        }
      }
    }
  };
}
