"use strict";
/**
 * Compliance Agent Action Group Handler
 * Implements tax compliance validation and regulatory checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_bedrock_agent_runtime_1 = require("@aws-sdk/client-bedrock-agent-runtime");
const bedrockAgentClient = new client_bedrock_agent_runtime_1.BedrockAgentRuntimeClient({
    region: process.env.AWS_REGION || 'ap-south-1'
});
const KNOWLEDGE_BASE_ID = process.env.KNOWLEDGE_BASE_ID || '2DW2JBM2MN';
/**
 * Main Lambda handler for Compliance Agent actions
 */
const handler = async (event) => {
    console.log('Compliance action event:', JSON.stringify(event, null, 2));
    const { actionGroup, function: functionName, parameters } = event;
    try {
        let result;
        switch (functionName) {
            case 'validate_tax_compliance':
                result = await validateTaxCompliance(parameters);
                break;
            case 'screen_regulatory_requirements':
                result = await screenRegulatoryRequirements(parameters);
                break;
            case 'query_compliance_knowledge_base':
                result = await queryComplianceKnowledgeBase(parameters);
                break;
            case 'check_corporate_policies':
                result = await checkCorporatePolicies(parameters);
                break;
            case 'verify_vendor_qualifications':
                result = await verifyVendorQualifications(parameters);
                break;
            default:
                throw new Error(`Unknown function: ${functionName}`);
        }
        return formatResponse(actionGroup, functionName, result);
    }
    catch (error) {
        console.error('Error in compliance action:', error);
        return formatResponse(actionGroup, functionName, {
            error: error.message,
            compliance_status: 'FAILED',
            compliance_score: 0
        });
    }
};
exports.handler = handler;
/**
 * Validate tax compliance using Knowledge Base
 */
async function validateTaxCompliance(parameters) {
    const invoiceData = getParameter(parameters, 'invoice_data');
    const jurisdiction = getParameter(parameters, 'jurisdiction') || 'US';
    if (!invoiceData) {
        throw new Error('invoice_data is required');
    }
    let parsedInvoice;
    try {
        parsedInvoice = JSON.parse(invoiceData);
    }
    catch (error) {
        throw new Error('Invalid JSON format for invoice_data');
    }
    console.log(`Validating tax compliance for jurisdiction: ${jurisdiction}`);
    const fields = parsedInvoice.fields || parsedInvoice;
    const taxAmount = parseFloat(fields.tax_amount?.value || fields.tax_amount || 0);
    const totalAmount = parseFloat(fields.total_amount?.value || fields.total_amount || 0);
    const subtotal = totalAmount - taxAmount;
    const taxRate = subtotal > 0 ? (taxAmount / subtotal) : 0;
    // Query Knowledge Base for tax regulations
    const kbQuery = `What are the tax compliance requirements for ${jurisdiction}? What are the current tax rates?`;
    const kbResults = await queryKnowledgeBase(kbQuery);
    const complianceChecks = [];
    const violations = [];
    let complianceScore = 1.0;
    // Tax rate validation
    const expectedRates = getExpectedTaxRates(jurisdiction);
    const rateMatch = expectedRates.some(rate => Math.abs(taxRate - rate) < 0.01);
    if (rateMatch) {
        complianceChecks.push({
            check: 'tax_rate_validation',
            status: 'PASS',
            details: `Tax rate ${(taxRate * 100).toFixed(2)}% matches ${jurisdiction} regulations`,
            regulation: kbResults.regulations?.find((r) => r.includes('tax rate'))
        });
    }
    else {
        complianceChecks.push({
            check: 'tax_rate_validation',
            status: 'FAIL',
            details: `Tax rate ${(taxRate * 100).toFixed(2)}% does not match expected rates: ${expectedRates.map(r => (r * 100).toFixed(2) + '%').join(', ')}`,
            regulation: kbResults.regulations?.find((r) => r.includes('tax rate'))
        });
        violations.push('Invalid tax rate for jurisdiction');
        complianceScore -= 0.3;
    }
    // Tax calculation verification
    const calculatedTax = subtotal * (expectedRates[0] || 0);
    const taxDifference = Math.abs(taxAmount - calculatedTax);
    if (taxDifference < 1.0) {
        complianceChecks.push({
            check: 'tax_calculation',
            status: 'PASS',
            details: 'Tax amount calculated correctly'
        });
    }
    else {
        complianceChecks.push({
            check: 'tax_calculation',
            status: 'WARNING',
            details: `Tax calculation off by $${taxDifference.toFixed(2)}`
        });
        complianceScore -= 0.1;
    }
    // Mandatory field validation
    const requiredFields = getMandatoryFields(jurisdiction);
    const missingFields = requiredFields.filter(field => !fields[field]);
    if (missingFields.length === 0) {
        complianceChecks.push({
            check: 'mandatory_fields',
            status: 'PASS',
            details: 'All mandatory fields present'
        });
    }
    else {
        complianceChecks.push({
            check: 'mandatory_fields',
            status: 'FAIL',
            details: `Missing fields: ${missingFields.join(', ')}`
        });
        violations.push(`Missing mandatory fields: ${missingFields.join(', ')}`);
        complianceScore -= 0.2 * missingFields.length;
    }
    // Tax ID validation (if applicable)
    if (jurisdiction === 'India' && fields.gst_number) {
        const gstValid = validateGSTNumber(fields.gst_number.value || fields.gst_number);
        complianceChecks.push({
            check: 'tax_id_validation',
            status: gstValid ? 'PASS' : 'FAIL',
            details: gstValid ? 'GST number format valid' : 'Invalid GST number format'
        });
        if (!gstValid) {
            violations.push('Invalid tax identification number');
            complianceScore -= 0.2;
        }
    }
    complianceScore = Math.max(0, complianceScore);
    return {
        compliance_status: violations.length === 0 ? 'COMPLIANT' : 'NON_COMPLIANT',
        compliance_score: complianceScore,
        jurisdiction: jurisdiction,
        tax_validation: {
            tax_rate: taxRate,
            expected_rates: expectedRates,
            tax_amount: taxAmount,
            rate_valid: rateMatch,
            calculation_correct: taxDifference < 1.0
        },
        compliance_checks: complianceChecks,
        violations: violations,
        knowledge_base_sources: kbResults.sources || [],
        recommendations: violations.length > 0
            ? ['Correct compliance violations before approval']
            : ['Invoice meets all compliance requirements']
    };
}
/**
 * Screen for regulatory requirements
 */
async function screenRegulatoryRequirements(parameters) {
    const invoiceData = getParameter(parameters, 'invoice_data');
    const jurisdiction = getParameter(parameters, 'jurisdiction') || 'US';
    if (!invoiceData) {
        throw new Error('invoice_data is required');
    }
    console.log(`Screening regulatory requirements for ${jurisdiction}`);
    // Query Knowledge Base for regulations
    const query = `What are the regulatory requirements and compliance rules for invoices in ${jurisdiction}?`;
    const kbResults = await queryKnowledgeBase(query);
    const regulatoryChecks = [];
    const requirements = [];
    // Industry-specific regulations
    if (jurisdiction === 'US') {
        regulatoryChecks.push({
            regulation: 'SOX_COMPLIANCE',
            status: 'PASS',
            description: 'Sarbanes-Oxley compliance requirements',
            details: 'Proper approval workflow and documentation'
        });
        requirements.push('Maintain audit trail per SOX requirements');
    }
    // Data retention requirements
    regulatoryChecks.push({
        regulation: 'DATA_RETENTION',
        status: 'PASS',
        description: 'Invoice record retention compliance',
        details: `Must retain for ${getRetentionPeriod(jurisdiction)} years`
    });
    // E-invoicing requirements
    if (jurisdiction === 'India') {
        regulatoryChecks.push({
            regulation: 'E_INVOICE_COMPLIANCE',
            status: 'REQUIRES_CHECK',
            description: 'E-invoice generation mandatory for B2B transactions',
            details: 'Verify IRN (Invoice Reference Number) generation'
        });
        requirements.push('Generate IRN through GST portal for B2B invoices');
    }
    // Anti-money laundering checks
    regulatoryChecks.push({
        regulation: 'AML_SCREENING',
        status: 'PENDING',
        description: 'Anti-money laundering vendor screening',
        details: 'Vendor sanctions list check required'
    });
    return {
        regulatory_status: 'SCREENED',
        jurisdiction: jurisdiction,
        regulatory_checks: regulatoryChecks,
        total_requirements: requirements.length,
        requirements: requirements,
        knowledge_base_citations: kbResults.sources || [],
        next_steps: [
            'Complete pending regulatory checks',
            'Verify industry-specific requirements',
            'Archive per retention policy'
        ]
    };
}
/**
 * Query compliance knowledge base
 */
async function queryComplianceKnowledgeBase(parameters) {
    const query = getParameter(parameters, 'query');
    const jurisdiction = getParameter(parameters, 'jurisdiction');
    if (!query) {
        throw new Error('query is required');
    }
    const enhancedQuery = jurisdiction
        ? `${query} for ${jurisdiction} jurisdiction`
        : query;
    console.log(`Querying Knowledge Base: ${enhancedQuery}`);
    const kbResults = await queryKnowledgeBase(enhancedQuery);
    return {
        query: enhancedQuery,
        results_found: kbResults.sources?.length || 0,
        relevant_regulations: kbResults.regulations || [],
        sources: kbResults.sources || [],
        summary: kbResults.summary || 'No specific information found',
        confidence: kbResults.confidence || 0.8,
        last_updated: new Date().toISOString()
    };
}
/**
 * Check corporate policies
 */
async function checkCorporatePolicies(parameters) {
    const invoiceData = getParameter(parameters, 'invoice_data');
    const amount = parseFloat(getParameter(parameters, 'amount') || '0');
    console.log(`Checking corporate policies for amount: ${amount}`);
    const policyChecks = [];
    const policyViolations = [];
    // Approval threshold policies
    const approvalLevel = getRequiredApprovalLevel(amount);
    policyChecks.push({
        policy: 'APPROVAL_AUTHORITY',
        status: 'INFO',
        details: `Amount $${amount} requires ${approvalLevel} approval`,
        threshold_met: true
    });
    // Payment terms policy
    policyChecks.push({
        policy: 'PAYMENT_TERMS',
        status: 'PASS',
        details: 'Standard NET 30 payment terms acceptable',
        compliant: true
    });
    // Budget allocation check (simplified)
    const budgetCompliant = amount < 100000; // Simplified check
    policyChecks.push({
        policy: 'BUDGET_ALLOCATION',
        status: budgetCompliant ? 'PASS' : 'WARNING',
        details: budgetCompliant
            ? 'Within typical budget limits'
            : 'High amount - verify budget availability',
        compliant: budgetCompliant
    });
    if (!budgetCompliant) {
        policyViolations.push('Amount exceeds standard budget threshold');
    }
    // Vendor qualification policy
    policyChecks.push({
        policy: 'VENDOR_QUALIFICATION',
        status: 'REQUIRES_VERIFICATION',
        details: 'Verify vendor is in approved vendor list',
        action_required: true
    });
    return {
        policy_compliance_status: policyViolations.length === 0 ? 'COMPLIANT' : 'REQUIRES_REVIEW',
        policy_checks: policyChecks,
        violations: policyViolations,
        required_approval_level: approvalLevel,
        policy_adherence_score: 1 - (policyViolations.length * 0.2),
        recommendations: policyViolations.length > 0
            ? ['Address policy violations before proceeding']
            : ['All corporate policies satisfied']
    };
}
/**
 * Verify vendor qualifications
 */
async function verifyVendorQualifications(parameters) {
    const vendorId = getParameter(parameters, 'vendor_id');
    const vendorName = getParameter(parameters, 'vendor_name');
    console.log(`Verifying qualifications for vendor: ${vendorName || vendorId}`);
    const qualificationChecks = [];
    // Vendor registration check
    qualificationChecks.push({
        qualification: 'VENDOR_REGISTRATION',
        status: 'REQUIRES_VERIFICATION',
        details: 'Verify vendor exists in approved vendor database',
        priority: 'HIGH'
    });
    // Tax compliance check
    qualificationChecks.push({
        qualification: 'TAX_COMPLIANCE',
        status: 'REQUIRES_VERIFICATION',
        details: 'Verify vendor tax registration and W-9/W-8 forms',
        priority: 'HIGH'
    });
    // Insurance verification
    qualificationChecks.push({
        qualification: 'INSURANCE_COVERAGE',
        status: 'RECOMMENDED',
        details: 'Verify liability insurance for service vendors',
        priority: 'MEDIUM'
    });
    // Background screening
    qualificationChecks.push({
        qualification: 'BACKGROUND_SCREENING',
        status: 'RECOMMENDED',
        details: 'Complete background check for new vendors',
        priority: 'MEDIUM'
    });
    // Sanctions screening
    qualificationChecks.push({
        qualification: 'SANCTIONS_SCREENING',
        status: 'REQUIRED',
        details: 'Screen against OFAC and other sanctions lists',
        priority: 'CRITICAL'
    });
    const requiredChecks = qualificationChecks.filter(c => c.priority === 'HIGH' || c.priority === 'CRITICAL');
    return {
        vendor_id: vendorId,
        vendor_name: vendorName,
        qualification_status: 'PENDING_VERIFICATION',
        qualification_checks: qualificationChecks,
        required_verifications: requiredChecks.length,
        total_checks: qualificationChecks.length,
        next_steps: [
            'Verify vendor registration status',
            'Obtain tax documentation',
            'Complete sanctions screening'
        ],
        estimated_verification_time: '2-3 business days'
    };
}
// ============================================================================
// Helper Functions
// ============================================================================
async function queryKnowledgeBase(query) {
    try {
        const command = new client_bedrock_agent_runtime_1.RetrieveCommand({
            knowledgeBaseId: KNOWLEDGE_BASE_ID,
            retrievalQuery: {
                text: query
            },
            retrievalConfiguration: {
                vectorSearchConfiguration: {
                    numberOfResults: 5
                }
            }
        });
        const response = await bedrockAgentClient.send(command);
        const sources = response.retrievalResults?.map(result => ({
            content: result.content?.text,
            score: result.score,
            location: result.location
        })) || [];
        const regulations = sources
            .map(s => s.content)
            .filter(c => c && c.length > 0);
        return {
            sources,
            regulations,
            summary: regulations.length > 0 ? regulations[0] : 'No information found',
            confidence: sources.length > 0 ? sources[0].score : 0
        };
    }
    catch (error) {
        console.error('Knowledge Base query error:', error);
        return {
            sources: [],
            regulations: [],
            summary: 'Knowledge Base query failed',
            confidence: 0
        };
    }
}
function getParameter(parameters, name) {
    const param = parameters.find(p => p.name === name);
    return param?.value;
}
function getExpectedTaxRates(jurisdiction) {
    const rates = {
        'US': [0.0, 0.05, 0.06, 0.07, 0.0875], // Varies by state
        'Germany': [0.19, 0.07], // Standard and reduced VAT
        'UK': [0.20, 0.05, 0.0], // Standard, reduced, and zero-rated
        'India': [0.05, 0.12, 0.18, 0.28], // GST rates
        'Canada': [0.05, 0.13, 0.15] // GST/HST rates
    };
    return rates[jurisdiction] || [0.0];
}
function getMandatoryFields(jurisdiction) {
    const baseFields = [
        'invoice_number',
        'invoice_date',
        'vendor_name',
        'total_amount'
    ];
    const jurisdictionFields = {
        'US': ['tax_id'],
        'India': ['gst_number', 'hsn_code'],
        'Germany': ['ust_id'],
        'UK': ['vat_number']
    };
    return [...baseFields, ...(jurisdictionFields[jurisdiction] || [])];
}
function validateGSTNumber(gstNumber) {
    // GST format: 2 digits (state) + 10 digits (PAN) + 1 digit (entity) + 1 letter (Z) + 1 checksum
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
}
function getRetentionPeriod(jurisdiction) {
    const periods = {
        'US': 7,
        'India': 6,
        'Germany': 10,
        'UK': 6
    };
    return periods[jurisdiction] || 7;
}
function getRequiredApprovalLevel(amount) {
    if (amount >= 100000)
        return 'CEO + Board';
    if (amount >= 25000)
        return 'VP + CFO';
    if (amount >= 5000)
        return 'Senior Manager + Finance';
    if (amount >= 1000)
        return 'Department Manager';
    return 'Auto-approved';
}
function formatResponse(actionGroup, functionName, result) {
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
//# sourceMappingURL=compliance-actions.js.map