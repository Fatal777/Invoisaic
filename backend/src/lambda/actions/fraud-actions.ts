/**
 * Fraud Detection Agent Action Group Handler
 * Implements fraud detection, duplicate checking, and risk analysis
 */

import {
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  ScanCommand,
  PutCommand
} from '@aws-sdk/lib-dynamodb';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const INVOICE_TABLE = process.env.INVOICE_TABLE || 'Invoisaic-Invoices';
const VENDOR_TABLE = process.env.VENDOR_TABLE || 'Invoisaic-Vendors';
const FRAUD_PATTERNS_TABLE = process.env.FRAUD_PATTERNS_TABLE || 'Invoisaic-FraudPatterns';

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
 * Main Lambda handler for Fraud Detection actions
 */
export const handler = async (event: ActionEvent): Promise<ActionResponse> => {
  console.log('Fraud detection action event:', JSON.stringify(event, null, 2));

  const { actionGroup, function: functionName, parameters } = event;

  try {
    let result: any;

    switch (functionName) {
      case 'check_vendor_history':
        result = await checkVendorHistory(parameters);
        break;
      case 'detect_duplicates':
        result = await detectDuplicates(parameters);
        break;
      case 'analyze_amount_patterns':
        result = await analyzeAmountPatterns(parameters);
        break;
      case 'query_fraud_database':
        result = await queryFraudDatabase(parameters);
        break;
      case 'calculate_risk_score':
        result = await calculateRiskScore(parameters);
        break;
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }

    return formatResponse(actionGroup, functionName, result);
  } catch (error: any) {
    console.error('Error in fraud detection action:', error);
    return formatResponse(actionGroup, functionName, {
      error: error.message,
      risk_score: 1.0, // Maximum risk on error
      risk_level: 'CRITICAL'
    });
  }
};

/**
 * Check vendor historical patterns for anomalies
 */
async function checkVendorHistory(parameters: any[]): Promise<any> {
  const vendorId = getParameter(parameters, 'vendor_id');
  const currentAmount = parseFloat(getParameter(parameters, 'current_amount') || '0');

  if (!vendorId || !currentAmount) {
    throw new Error('vendor_id and current_amount are required');
  }

  console.log(`Checking vendor history for ${vendorId}, amount: ${currentAmount}`);

  try {
    // Check if vendor exists
    const vendorResponse = await docClient.send(new GetCommand({
      TableName: VENDOR_TABLE,
      Key: { vendorId }
    }));

    const vendorExists = !!vendorResponse.Item;
    const riskIndicators: any[] = [];

    // Query vendor invoice history
    const invoiceResponse = await docClient.send(new QueryCommand({
      TableName: INVOICE_TABLE,
      IndexName: 'VendorIndex',
      KeyConditionExpression: 'vendorId = :vid',
      ExpressionAttributeValues: {
        ':vid': vendorId
      },
      Limit: 50
    }));

    const historicalInvoices = invoiceResponse.Items || [];
    let vendorProfile = 'UNKNOWN';
    let historicalStats: any = {};

    // New vendor risk
    if (!vendorExists) {
      riskIndicators.push({
        category: 'vendor_anomaly',
        description: 'New vendor with no historical record',
        severity: 0.4,
        recommendation: 'Verify vendor legitimacy and credentials'
      });
      vendorProfile = 'NEW_VENDOR';

      // Higher risk for new vendors with large first invoice
      if (currentAmount > 5000) {
        riskIndicators.push({
          category: 'amount_anomaly',
          description: `High-value first invoice: $${currentAmount}`,
          severity: 0.5,
          recommendation: 'Require additional verification for new vendor with large amount'
        });
      }
    }

    // Analyze historical patterns
    if (historicalInvoices.length > 0) {
      const amounts = historicalInvoices.map(inv => 
        parseFloat((inv as any).extractionData?.fields?.total_amount?.value || '0')
      ).filter(amt => amt > 0);

      if (amounts.length > 0) {
        const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
        const stdDev = Math.sqrt(
          amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length
        );

        historicalStats = {
          average_amount: avgAmount,
          std_deviation: stdDev,
          min_amount: Math.min(...amounts),
          max_amount: Math.max(...amounts),
          invoice_count: amounts.length
        };

        // Amount deviation analysis
        if (stdDev > 0) {
          const zScore = Math.abs(currentAmount - avgAmount) / stdDev;
          
          if (zScore > 2) {
            const percentDiff = ((currentAmount - avgAmount) / avgAmount * 100).toFixed(1);
            riskIndicators.push({
              category: 'amount_anomaly',
              description: `Amount deviates ${percentDiff}% from historical average`,
              severity: Math.min(0.6, zScore / 5),
              recommendation: 'Review invoice details for unusual amount'
            });
          }
        }

        // Frequency analysis - check for rapid-fire submissions
        const now = Date.now();
        const recentInvoices = historicalInvoices.filter(inv => 
          (now - ((inv as any).timestamp || 0)) < 30 * 24 * 60 * 60 * 1000 // 30 days
        );

        if (recentInvoices.length > 10) {
          riskIndicators.push({
            category: 'pattern_anomaly',
            description: `High frequency: ${recentInvoices.length} invoices in 30 days`,
            severity: 0.3,
            recommendation: 'Verify legitimate business activity'
          });
        }

        vendorProfile = 'ESTABLISHED';
      }
    }

    // Calculate vendor risk score
    const vendorRiskScore = riskIndicators.reduce((sum, ind) => sum + ind.severity, 0) / 
                            (riskIndicators.length || 1);

    return {
      vendor_exists: vendorExists,
      vendor_profile: vendorProfile,
      invoice_count: historicalInvoices.length,
      risk_indicators: riskIndicators,
      risk_score: Math.min(1.0, vendorRiskScore),
      risk_level: getRiskLevel(vendorRiskScore),
      historical_stats: historicalStats,
      recommendations: riskIndicators.map(ind => ind.recommendation)
    };

  } catch (error: any) {
    console.error('Vendor history check error:', error);
    throw new Error(`Vendor history analysis failed: ${error.message}`);
  }
}

/**
 * Detect duplicate invoices
 */
async function detectDuplicates(parameters: any[]): Promise<any> {
  const invoiceNumber = getParameter(parameters, 'invoice_number');
  const vendorId = getParameter(parameters, 'vendor_id');
  const amount = parseFloat(getParameter(parameters, 'amount') || '0');
  const invoiceDate = getParameter(parameters, 'invoice_date');

  if (!invoiceNumber || !vendorId) {
    throw new Error('invoice_number and vendor_id are required');
  }

  console.log(`Checking for duplicates: ${invoiceNumber} from ${vendorId}`);

  const duplicateIndicators: any[] = [];
  let riskScore = 0.0;

  try {
    // Check for exact invoice number match
    const exactMatchResponse = await docClient.send(new QueryCommand({
      TableName: INVOICE_TABLE,
      IndexName: 'VendorIndex',
      KeyConditionExpression: 'vendorId = :vid',
      FilterExpression: 'contains(extractionData.fields.invoice_number.#value, :inum)',
      ExpressionAttributeNames: {
        '#value': 'value'
      },
      ExpressionAttributeValues: {
        ':vid': vendorId,
        ':inum': invoiceNumber
      }
    }));

    const exactMatches = exactMatchResponse.Items || [];

    if (exactMatches.length > 0) {
      duplicateIndicators.push({
        type: 'EXACT_INVOICE_NUMBER',
        matches: exactMatches.length,
        severity: 1.0,
        description: `Invoice number ${invoiceNumber} already exists for this vendor`,
        matched_invoices: exactMatches.map(inv => ({
          invoice_id: (inv as any).invoiceId,
          date: (inv as any).extractionData?.fields?.invoice_date?.value,
          amount: (inv as any).extractionData?.fields?.total_amount?.value
        }))
      });
      riskScore = 1.0; // Definite duplicate
    }

    // Check for similar amounts within date range
    if (amount && invoiceDate) {
      const dateObj = new Date(invoiceDate);
      const sevenDaysAgo = new Date(dateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sevenDaysLater = new Date(dateObj.getTime() + 7 * 24 * 60 * 60 * 1000);

      const similarAmountResponse = await docClient.send(new QueryCommand({
        TableName: INVOICE_TABLE,
        IndexName: 'VendorIndex',
        KeyConditionExpression: 'vendorId = :vid',
        ExpressionAttributeValues: {
          ':vid': vendorId
        }
      }));

      const allInvoices = similarAmountResponse.Items || [];
      const similarInvoices = allInvoices.filter(inv => {
        const invAmount = parseFloat((inv as any).extractionData?.fields?.total_amount?.value || '0');
        const invDate = new Date((inv as any).extractionData?.fields?.invoice_date?.value || '');
        
        const amountDiff = Math.abs(invAmount - amount) / Math.max(amount, invAmount);
        const inDateRange = invDate >= sevenDaysAgo && invDate <= sevenDaysLater;

        return amountDiff < 0.01 && inDateRange; // Within 1% and 7 days
      });

      if (similarInvoices.length > 0) {
        duplicateIndicators.push({
          type: 'SIMILAR_AMOUNT_DATE',
          matches: similarInvoices.length,
          severity: 0.7,
          description: 'Similar amount invoices found within 7-day window',
          matched_invoices: similarInvoices.map(inv => ({
            invoice_id: (inv as any).invoiceId,
            date: (inv as any).extractionData?.fields?.invoice_date?.value,
            amount: (inv as any).extractionData?.fields?.total_amount?.value
          }))
        });
        riskScore = Math.max(riskScore, 0.7);
      }
    }

    // Check for round number patterns (potential fraud indicator)
    if (amount && amount % 100 === 0 && amount > 0) {
      const roundNumberInvoices = (await docClient.send(new QueryCommand({
        TableName: INVOICE_TABLE,
        IndexName: 'VendorIndex',
        KeyConditionExpression: 'vendorId = :vid',
        ExpressionAttributeValues: {
          ':vid': vendorId
        },
        Limit: 20
      }))).Items || [];

      const roundCount = roundNumberInvoices.filter(inv => {
        const amt = parseFloat((inv as any).extractionData?.fields?.total_amount?.value || '0');
        return amt % 100 === 0;
      }).length;

      if (roundCount > 5) {
        duplicateIndicators.push({
          type: 'ROUND_NUMBER_PATTERN',
          matches: roundCount,
          severity: 0.4,
          description: 'Suspicious pattern: multiple round-number invoices'
        });
        riskScore = Math.max(riskScore, 0.4);
      }
    }

    return {
      duplicates_detected: duplicateIndicators.length > 0,
      duplicate_indicators: duplicateIndicators,
      risk_score: riskScore,
      risk_level: getRiskLevel(riskScore),
      recommendation: riskScore > 0.8 ? 'REJECT' :
                     riskScore > 0.5 ? 'REQUIRE_REVIEW' :
                     'PROCEED',
      analysis_timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Duplicate detection error:', error);
    throw new Error(`Duplicate detection failed: ${error.message}`);
  }
}

/**
 * Analyze amount patterns for statistical anomalies
 */
async function analyzeAmountPatterns(parameters: any[]): Promise<any> {
  const vendorId = getParameter(parameters, 'vendor_id');
  const currentAmount = parseFloat(getParameter(parameters, 'current_amount') || '0');

  if (!vendorId || !currentAmount) {
    throw new Error('vendor_id and current_amount are required');
  }

  console.log(`Analyzing amount patterns for ${vendorId}`);

  try {
    // Get recent invoice history
    const response = await docClient.send(new QueryCommand({
      TableName: INVOICE_TABLE,
      IndexName: 'VendorIndex',
      KeyConditionExpression: 'vendorId = :vid',
      ExpressionAttributeValues: {
        ':vid': vendorId
      },
      Limit: 100
    }));

    const invoices = response.Items || [];
    const amounts = invoices
      .map(inv => parseFloat((inv as any).extractionData?.fields?.total_amount?.value || '0'))
      .filter(amt => amt > 0);

    if (amounts.length < 5) {
      return {
        anomaly_detected: false,
        risk_score: 0.3,
        risk_level: 'LOW',
        reason: 'Insufficient historical data for statistical analysis',
        sample_size: amounts.length
      };
    }

    // Statistical analysis
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const zScore = stdDev > 0 ? Math.abs(currentAmount - mean) / stdDev : 0;

    // Modified Z-score for outlier detection
    const anomalyDetected = zScore > 3; // 3 standard deviations
    let riskScore = Math.min(1.0, zScore / 5);

    // Pattern analysis
    const patterns: string[] = [];

    // Just-below-threshold pattern
    const approvalThresholds = [1000, 5000, 10000, 25000];
    for (const threshold of approvalThresholds) {
      if (currentAmount >= threshold * 0.95 && currentAmount < threshold) {
        patterns.push(`Amount suspiciously close to approval threshold: $${threshold}`);
        riskScore = Math.max(riskScore, 0.5);
      }
    }

    // Clustering analysis - check if amounts cluster around certain values
    const histogram: Record<string, number> = {};
    amounts.forEach(amt => {
      const bucket = Math.floor(amt / 100) * 100;
      histogram[bucket] = (histogram[bucket] || 0) + 1;
    });

    const maxCluster = Math.max(...Object.values(histogram));
    if (maxCluster > amounts.length * 0.4) {
      patterns.push('Invoice amounts show unusual clustering pattern');
    }

    return {
      anomaly_detected: anomalyDetected,
      z_score: zScore,
      risk_score: riskScore,
      risk_level: getRiskLevel(riskScore),
      statistical_analysis: {
        mean_amount: mean,
        std_deviation: stdDev,
        sample_size: amounts.length,
        current_deviation: currentAmount - mean
      },
      patterns_detected: patterns,
      recommendation: anomalyDetected
        ? 'Request additional documentation due to statistical anomaly'
        : 'Amount within expected range',
      confidence: 0.85
    };

  } catch (error: any) {
    console.error('Amount pattern analysis error:', error);
    throw new Error(`Amount pattern analysis failed: ${error.message}`);
  }
}

/**
 * Query fraud pattern database
 */
async function queryFraudDatabase(parameters: any[]): Promise<any> {
  const patternType = getParameter(parameters, 'pattern_type');

  console.log(`Querying fraud database for pattern: ${patternType}`);

  try {
    // Query fraud patterns table
    const response = await docClient.send(new ScanCommand({
      TableName: FRAUD_PATTERNS_TABLE,
      FilterExpression: 'contains(patternType, :ptype)',
      ExpressionAttributeValues: {
        ':ptype': patternType || 'all'
      },
      Limit: 50
    }));

    const patterns = response.Items || [];

    // Common fraud patterns (hardcoded knowledge base)
    const knownPatterns = [
      {
        pattern_id: 'FP001',
        pattern_type: 'duplicate_invoice',
        description: 'Same invoice number submitted multiple times',
        severity: 'HIGH',
        indicators: ['Identical invoice numbers', 'Same vendor', 'Similar dates'],
        detection_rate: 0.95
      },
      {
        pattern_id: 'FP002',
        pattern_type: 'amount_splitting',
        description: 'Large amount split into multiple invoices to avoid approval thresholds',
        severity: 'HIGH',
        indicators: ['Multiple invoices near threshold', 'Same vendor', 'Sequential dates'],
        detection_rate: 0.80
      },
      {
        pattern_id: 'FP003',
        pattern_type: 'ghost_vendor',
        description: 'Invoices from non-existent or shell companies',
        severity: 'CRITICAL',
        indicators: ['New vendor', 'High first invoice', 'Minimal vendor details'],
        detection_rate: 0.70
      },
      {
        pattern_id: 'FP004',
        pattern_type: 'round_number_bias',
        description: 'Excessive use of round numbers suggesting fabricated amounts',
        severity: 'MEDIUM',
        indicators: ['Most amounts end in 00', 'Unrealistic precision'],
        detection_rate: 0.65
      }
    ];

    const relevantPatterns = knownPatterns.filter(p => 
      !patternType || p.pattern_type.includes(patternType)
    );

    return {
      patterns_found: patterns.length + relevantPatterns.length,
      database_patterns: patterns,
      known_patterns: relevantPatterns,
      pattern_categories: ['duplicate_invoice', 'amount_splitting', 'ghost_vendor', 'round_number_bias'],
      last_updated: new Date().toISOString(),
      recommendations: relevantPatterns.map(p => ({
        pattern: p.pattern_type,
        action: `Screen for: ${p.description}`
      }))
    };

  } catch (error: any) {
    console.error('Fraud database query error:', error);
    return {
      patterns_found: 0,
      error: error.message,
      fallback_mode: true
    };
  }
}

/**
 * Calculate composite risk score from multiple indicators
 */
async function calculateRiskScore(parameters: any[]): Promise<any> {
  const fraudIndicatorsStr = getParameter(parameters, 'fraud_indicators');

  if (!fraudIndicatorsStr) {
    throw new Error('fraud_indicators is required');
  }

  let indicators: any[];
  try {
    indicators = JSON.parse(fraudIndicatorsStr);
  } catch (error) {
    throw new Error('Invalid JSON format for fraud_indicators');
  }

  console.log(`Calculating composite risk score from ${indicators.length} indicators`);

  // Weight different indicator types
  const weights: Record<string, number> = {
    'duplicate': 1.0,
    'vendor_anomaly': 0.7,
    'amount_anomaly': 0.6,
    'pattern_anomaly': 0.5,
    'frequency_anomaly': 0.4
  };

  let weightedScore = 0;
  let totalWeight = 0;

  for (const indicator of indicators) {
    const category = indicator.category || indicator.type || 'unknown';
    const severity = indicator.severity || 0.5;
    const weight = weights[category] || 0.5;

    weightedScore += severity * weight;
    totalWeight += weight;
  }

  const compositeScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const riskLevel = getRiskLevel(compositeScore);

  // Risk-based recommendations
  const recommendations: string[] = [];
  if (compositeScore > 0.8) {
    recommendations.push('REJECT invoice - Critical fraud risk detected');
    recommendations.push('Flag vendor for investigation');
    recommendations.push('Notify security team');
  } else if (compositeScore > 0.5) {
    recommendations.push('HOLD invoice for manual review');
    recommendations.push('Request additional vendor documentation');
    recommendations.push('Verify with vendor contact');
  } else if (compositeScore > 0.2) {
    recommendations.push('PROCEED with additional validation');
    recommendations.push('Monitor vendor pattern');
  } else {
    recommendations.push('APPROVE - Low fraud risk');
  }

  return {
    composite_risk_score: compositeScore,
    risk_level: riskLevel,
    indicators_analyzed: indicators.length,
    high_risk_indicators: indicators.filter(i => (i.severity || 0) > 0.7).length,
    weighted_factors: Object.entries(weights).map(([category, weight]) => ({
      category,
      weight,
      contribution: indicators.filter(i => 
        (i.category || i.type) === category
      ).length
    })),
    recommendations,
    decision: compositeScore > 0.8 ? 'REJECT' :
             compositeScore > 0.5 ? 'REVIEW' :
             compositeScore > 0.2 ? 'VALIDATE' : 'APPROVE',
    confidence: 0.90
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getParameter(parameters: any[], name: string): string | undefined {
  const param = parameters.find(p => p.name === name);
  return param?.value;
}

function getRiskLevel(score: number): string {
  if (score >= 0.8) return 'CRITICAL';
  if (score >= 0.5) return 'HIGH';
  if (score >= 0.2) return 'MEDIUM';
  return 'LOW';
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
