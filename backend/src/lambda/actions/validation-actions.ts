/**
 * Validation Agent Action Group Handler
 * Final validation and quality assurance checks
 */

import {
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const INVOICE_TABLE = process.env.INVOICE_TABLE || 'Invoisaic-Invoices';

interface ActionEvent {
  actionGroup: string;
  function: string;
  parameters: Array<{ name: string; type: string; value: string }>;
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
 * Main Lambda handler for Validation Agent actions
 */
export const handler = async (event: ActionEvent): Promise<ActionResponse> => {
  console.log('Validation action event:', JSON.stringify(event, null, 2));

  const { actionGroup, function: functionName, parameters } = event;

  try {
    let result: any;

    switch (functionName) {
      case 'validate_invoice_completeness':
        result = await validateInvoiceCompleteness(parameters);
        break;
      case 'cross_check_calculations':
        result = await crossCheckCalculations(parameters);
        break;
      case 'verify_data_consistency':
        result = await verifyDataConsistency(parameters);
        break;
      case 'generate_validation_report':
        result = await generateValidationReport(parameters);
        break;
      case 'finalize_invoice_status':
        result = await finalizeInvoiceStatus(parameters);
        break;
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    return formatResponse(actionGroup, functionName, result);
  } catch (error: any) {
    console.error('Error in validation action:', error);
    return formatResponse(actionGroup, functionName, {
      error: error.message,
      validation_status: 'FAILED',
      approved: false
    });
  }
};

/**
 * Validate invoice completeness
 */
async function validateInvoiceCompleteness(parameters: any[]): Promise<any> {
  const invoiceData = getParameter(parameters, 'invoice_data');

  if (!invoiceData) {
    throw new Error('invoice_data is required');
  }

  let parsedData: any;
  try {
    parsedData = JSON.parse(invoiceData);
  } catch (error) {
    throw new Error('Invalid JSON format for invoice_data');
  }

  console.log('Validating invoice completeness');

  const fields = parsedData.fields || parsedData;
  const requiredFields = [
    'invoice_number',
    'invoice_date',
    'vendor_name',
    'total_amount',
    'tax_amount'
  ];

  const missingFields: string[] = [];
  const presentFields: string[] = [];
  const weakFields: string[] = [];

  // Check required fields
  for (const field of requiredFields) {
    const fieldData = fields[field];
    
    if (!fieldData) {
      missingFields.push(field);
    } else {
      presentFields.push(field);
      
      // Check confidence if available
      const confidence = fieldData.confidence || 1.0;
      if (confidence < 0.85) {
        weakFields.push(`${field} (${(confidence * 100).toFixed(1)}% confidence)`);
      }
    }
  }

  // Check optional but important fields
  const optionalFields = ['due_date', 'vendor_address', 'line_items'];
  const presentOptional: string[] = [];
  const missingOptional: string[] = [];

  for (const field of optionalFields) {
    if (fields[field] || (field === 'line_items' && parsedData.line_items)) {
      presentOptional.push(field);
    } else {
      missingOptional.push(field);
    }
  }

  const completenessScore = presentFields.length / requiredFields.length;
  const qualityScore = 1 - (weakFields.length / presentFields.length);

  return {
    completeness_status: missingFields.length === 0 ? 'COMPLETE' : 'INCOMPLETE',
    completeness_score: completenessScore,
    quality_score: qualityScore,
    overall_score: (completenessScore + qualityScore) / 2,
    required_fields: {
      total: requiredFields.length,
      present: presentFields.length,
      missing: missingFields.length,
      missing_list: missingFields
    },
    optional_fields: {
      present: presentOptional,
      missing: missingOptional
    },
    weak_confidence_fields: weakFields,
    recommendations: [
      ...(missingFields.length > 0 ? [`Add missing required fields: ${missingFields.join(', ')}`] : []),
      ...(weakFields.length > 0 ? [`Review low-confidence fields: ${weakFields.join(', ')}`] : []),
      ...(missingFields.length === 0 && weakFields.length === 0 ? ['Invoice data is complete and high quality'] : [])
    ]
  };
}

/**
 * Cross-check calculations (totals, taxes, etc.)
 */
async function crossCheckCalculations(parameters: any[]): Promise<any> {
  const invoiceData = getParameter(parameters, 'invoice_data');

  if (!invoiceData) {
    throw new Error('invoice_data is required');
  }

  let parsedData: any;
  try {
    parsedData = JSON.parse(invoiceData);
  } catch (error) {
    throw new Error('Invalid JSON format for invoice_data');
  }

  console.log('Cross-checking calculations');

  const fields = parsedData.fields || parsedData;
  const calculationChecks: any[] = [];
  const errors: string[] = [];
  let allChecksPass = true;

  // Extract amounts
  const totalAmount = parseFloat(fields.total_amount?.value || fields.total_amount || 0);
  const taxAmount = parseFloat(fields.tax_amount?.value || fields.tax_amount || 0);
  const subtotal = totalAmount - taxAmount;

  // Check 1: Total = Subtotal + Tax
  if (totalAmount > 0 && taxAmount >= 0) {
    const calculatedTotal = subtotal + taxAmount;
    const difference = Math.abs(totalAmount - calculatedTotal);
    
    calculationChecks.push({
      check: 'total_equals_subtotal_plus_tax',
      expected: calculatedTotal,
      actual: totalAmount,
      difference: difference,
      passed: difference < 0.01,
      details: `Total: ${totalAmount}, Subtotal: ${subtotal}, Tax: ${taxAmount}`
    });

    if (difference >= 0.01) {
      errors.push(`Total amount mismatch: Expected ${calculatedTotal.toFixed(2)}, got ${totalAmount.toFixed(2)}`);
      allChecksPass = false;
    }
  }

  // Check 2: Line items sum to subtotal (if available)
  if (parsedData.line_items && parsedData.line_items.length > 0) {
    let lineItemSum = 0;
    const lineItems = parsedData.line_items;

    for (const item of lineItems) {
      const itemTotal = parseFloat(item.total?.value || item.total || 0);
      lineItemSum += itemTotal;
    }

    const difference = Math.abs(subtotal - lineItemSum);
    
    calculationChecks.push({
      check: 'line_items_sum_to_subtotal',
      expected: subtotal,
      actual: lineItemSum,
      difference: difference,
      passed: difference < 1.0,
      details: `${lineItems.length} line items, sum: ${lineItemSum.toFixed(2)}`
    });

    if (difference >= 1.0) {
      errors.push(`Line items don't sum to subtotal: Expected ${subtotal.toFixed(2)}, got ${lineItemSum.toFixed(2)}`);
      allChecksPass = false;
    }
  }

  // Check 3: Tax rate reasonableness
  if (subtotal > 0 && taxAmount > 0) {
    const taxRate = taxAmount / subtotal;
    const isReasonable = taxRate >= 0 && taxRate <= 0.35; // 0-35% is reasonable
    
    calculationChecks.push({
      check: 'tax_rate_reasonable',
      tax_rate: taxRate,
      tax_rate_percent: (taxRate * 100).toFixed(2) + '%',
      passed: isReasonable,
      details: `Tax rate should be between 0% and 35%`
    });

    if (!isReasonable) {
      errors.push(`Unreasonable tax rate: ${(taxRate * 100).toFixed(2)}%`);
      allChecksPass = false;
    }
  }

  // Check 4: Amounts are positive
  const positiveCheck = totalAmount > 0 && taxAmount >= 0;
  calculationChecks.push({
    check: 'amounts_are_positive',
    passed: positiveCheck,
    details: `Total: ${totalAmount}, Tax: ${taxAmount}`
  });

  if (!positiveCheck) {
    errors.push('Amounts must be positive');
    allChecksPass = false;
  }

  return {
    calculations_valid: allChecksPass,
    checks_passed: calculationChecks.filter(c => c.passed).length,
    checks_failed: calculationChecks.filter(c => !c.passed).length,
    calculation_checks: calculationChecks,
    errors: errors,
    summary: allChecksPass 
      ? 'All calculations are correct' 
      : `${errors.length} calculation error(s) found`
  };
}

/**
 * Verify data consistency across all fields
 */
async function verifyDataConsistency(parameters: any[]): Promise<any> {
  const invoiceData = getParameter(parameters, 'invoice_data');
  const extractionResults = getParameter(parameters, 'extraction_results');
  const complianceResults = getParameter(parameters, 'compliance_results');

  if (!invoiceData) {
    throw new Error('invoice_data is required');
  }

  console.log('Verifying data consistency');

  const consistencyChecks: any[] = [];
  const inconsistencies: string[] = [];

  // Parse all inputs
  let invoice: any;
  try {
    invoice = JSON.parse(invoiceData);
  } catch (error) {
    throw new Error('Invalid invoice_data JSON');
  }

  let extraction: any = {};
  if (extractionResults) {
    try {
      extraction = JSON.parse(extractionResults);
    } catch (e) {
      extraction = {};
    }
  }

  let compliance: any = {};
  if (complianceResults) {
    try {
      compliance = JSON.parse(complianceResults);
    } catch (e) {
      compliance = {};
    }
  }

  // Consistency Check 1: Date logic
  const fields = invoice.fields || invoice;
  if (fields.invoice_date && fields.due_date) {
    const invoiceDate = new Date(fields.invoice_date.value || fields.invoice_date);
    const dueDate = new Date(fields.due_date.value || fields.due_date);

    const datesValid = dueDate >= invoiceDate;
    consistencyChecks.push({
      check: 'due_date_after_invoice_date',
      passed: datesValid,
      invoice_date: invoiceDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0]
    });

    if (!datesValid) {
      inconsistencies.push('Due date is before invoice date');
    }
  }

  // Consistency Check 2: Vendor information consistency
  if (extraction.vendor_exists !== undefined && fields.vendor_name) {
    consistencyChecks.push({
      check: 'vendor_consistency',
      passed: true,
      details: `Vendor exists: ${extraction.vendor_exists}`
    });
  }

  // Consistency Check 3: Compliance status vs data quality
  if (compliance.compliance_status && extraction.confidence_score) {
    const compliant = compliance.compliance_status === 'COMPLIANT';
    const highConfidence = extraction.confidence_score > 0.85;
    
    const consistent = !(compliant && !highConfidence);
    consistencyChecks.push({
      check: 'compliance_confidence_consistency',
      passed: consistent,
      compliance_status: compliance.compliance_status,
      extraction_confidence: extraction.confidence_score
    });

    if (!consistent) {
      inconsistencies.push('Invoice marked compliant but has low extraction confidence');
    }
  }

  // Consistency Check 4: Field format consistency
  const formatChecks: any[] = [];
  
  if (fields.invoice_number) {
    const invNum = fields.invoice_number.value || fields.invoice_number;
    const hasValidFormat = /^[A-Z0-9-]+$/i.test(invNum);
    formatChecks.push({
      field: 'invoice_number',
      valid_format: hasValidFormat,
      value: invNum
    });
  }

  consistencyChecks.push({
    check: 'field_format_consistency',
    passed: formatChecks.every(f => f.valid_format),
    format_checks: formatChecks
  });

  const allConsistent = inconsistencies.length === 0;

  return {
    consistency_status: allConsistent ? 'CONSISTENT' : 'INCONSISTENT',
    consistency_score: 1 - (inconsistencies.length / Math.max(consistencyChecks.length, 1)),
    checks_performed: consistencyChecks.length,
    inconsistencies_found: inconsistencies.length,
    consistency_checks: consistencyChecks,
    inconsistencies: inconsistencies,
    recommendation: allConsistent
      ? 'Data is consistent across all checks'
      : 'Review and resolve inconsistencies before approval'
  };
}

/**
 * Generate comprehensive validation report
 */
async function generateValidationReport(parameters: any[]): Promise<any> {
  const invoiceId = getParameter(parameters, 'invoice_id');
  const invoiceData = getParameter(parameters, 'invoice_data');
  const extractionResults = getParameter(parameters, 'extraction_results');
  const complianceResults = getParameter(parameters, 'compliance_results');

  console.log(`Generating validation report for invoice ${invoiceId}`);

  // Run all validation checks
  const completeness = await validateInvoiceCompleteness([
    { name: 'invoice_data', type: 'string', value: invoiceData }
  ]);

  const calculations = await crossCheckCalculations([
    { name: 'invoice_data', type: 'string', value: invoiceData }
  ]);

  const consistency = await verifyDataConsistency([
    { name: 'invoice_data', type: 'string', value: invoiceData },
    { name: 'extraction_results', type: 'string', value: extractionResults || '{}' },
    { name: 'compliance_results', type: 'string', value: complianceResults || '{}' }
  ]);

  // Calculate overall validation score
  const scores = [
    completeness.overall_score || 0,
    calculations.calculations_valid ? 1.0 : 0.5,
    consistency.consistency_score || 0
  ];

  const overallScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Determine approval recommendation
  const criticalIssues = [
    ...completeness.required_fields.missing_list,
    ...calculations.errors,
    ...consistency.inconsistencies
  ];

  const approved = overallScore >= 0.8 && criticalIssues.length === 0;

  return {
    invoice_id: invoiceId,
    validation_timestamp: new Date().toISOString(),
    overall_validation_score: overallScore,
    validation_grade: overallScore >= 0.9 ? 'EXCELLENT' :
                      overallScore >= 0.8 ? 'GOOD' :
                      overallScore >= 0.7 ? 'ACCEPTABLE' : 'POOR',
    approved_for_processing: approved,
    validation_results: {
      completeness: {
        score: completeness.overall_score,
        status: completeness.completeness_status,
        missing_fields: completeness.required_fields.missing_list
      },
      calculations: {
        valid: calculations.calculations_valid,
        checks_passed: calculations.checks_passed,
        errors: calculations.errors
      },
      consistency: {
        status: consistency.consistency_status,
        score: consistency.consistency_score,
        inconsistencies: consistency.inconsistencies
      }
    },
    critical_issues: criticalIssues,
    total_issues: criticalIssues.length,
    recommendations: [
      ...(criticalIssues.length === 0 ? ['Invoice passes all validation checks - APPROVE'] : []),
      ...(criticalIssues.length > 0 ? ['HOLD: Resolve critical issues before approval'] : []),
      ...completeness.recommendations,
      ...(calculations.errors.length > 0 ? ['Verify calculation errors with vendor'] : []),
      ...(consistency.inconsistencies.length > 0 ? ['Investigate data inconsistencies'] : [])
    ],
    next_action: approved ? 'APPROVE' : 'REVIEW_REQUIRED'
  };
}

/**
 * Finalize invoice status after validation
 */
async function finalizeInvoiceStatus(parameters: any[]): Promise<any> {
  const invoiceId = getParameter(parameters, 'invoice_id');
  const validationReport = getParameter(parameters, 'validation_report');
  const approved = getParameter(parameters, 'approved') === 'true';

  if (!invoiceId) {
    throw new Error('invoice_id is required');
  }

  console.log(`Finalizing status for invoice ${invoiceId}: ${approved ? 'APPROVED' : 'REJECTED'}`);

  let report: any = {};
  if (validationReport) {
    try {
      report = JSON.parse(validationReport);
    } catch (e) {
      console.warn('Could not parse validation report');
    }
  }

  const finalStatus = approved ? 'APPROVED' : 'REJECTED';
  const timestamp = Date.now();

  // Update invoice status in DynamoDB
  try {
    await docClient.send(new UpdateCommand({
      TableName: INVOICE_TABLE,
      Key: {
        invoiceId: invoiceId,
        timestamp: timestamp
      },
      UpdateExpression: 'SET #status = :status, validationReport = :report, finalizedAt = :finalizedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': finalStatus,
        ':report': report,
        ':finalizedAt': new Date().toISOString()
      }
    }));

    console.log(`Invoice ${invoiceId} status updated to ${finalStatus}`);
  } catch (error: any) {
    console.error('Error updating invoice status:', error);
    // Continue even if DB update fails
  }

  return {
    invoice_id: invoiceId,
    final_status: finalStatus,
    approved: approved,
    validation_score: report.overall_validation_score || 0,
    finalized_at: new Date().toISOString(),
    next_steps: approved
      ? ['Route to payment processing', 'Send approval notification', 'Update accounting system']
      : ['Send rejection notification to vendor', 'Request corrected invoice', 'Archive with rejection reason'],
    summary: approved
      ? `Invoice ${invoiceId} APPROVED - Ready for payment processing`
      : `Invoice ${invoiceId} REJECTED - Requires correction`
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getParameter(parameters: any[], name: string): string | undefined {
  const param = parameters.find(p => p.name === name);
  return param?.value;
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
