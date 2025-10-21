"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedrockAgentConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const constructs_1 = require("constructs");
const bedrock = __importStar(require("aws-cdk-lib/aws-bedrock"));
class BedrockAgentConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const { environment, lambdaRole } = props;
        // ========================================
        // S3 Bucket for Knowledge Base
        // ========================================
        const kbBucket = new s3.Bucket(this, 'KnowledgeBaseBucket', {
            bucketName: `invoisaic-kb-${environment}-${cdk.Aws.ACCOUNT_ID}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            versioned: true,
        });
        // Upload tax knowledge documents
        new s3deploy.BucketDeployment(this, 'DeployKnowledgeBase', {
            sources: [s3deploy.Source.asset('./knowledge-base')],
            destinationBucket: kbBucket,
            destinationKeyPrefix: 'tax-rules/',
        });
        // ========================================
        // IAM Role for Bedrock Knowledge Base
        // ========================================
        const kbRole = new iam.Role(this, 'KnowledgeBaseRole', {
            assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
            description: 'Role for Bedrock Knowledge Base to access S3',
        });
        kbBucket.grantRead(kbRole);
        kbRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
            ],
            resources: ['*'],
        }));
        // ========================================
        // Knowledge Base - Simplified for Demo
        // NOTE: For production, set up OpenSearch Serverless
        // For hackathon demo, we'll embed tax knowledge in the agent instruction
        // ========================================
        // Placeholder - Knowledge Base setup requires OpenSearch Serverless
        // which needs additional configuration. For demo, we'll use
        // the embedded knowledge in the agent instruction instead.
        // ========================================
        // Action Group Lambda (Tax Calculation)
        // ========================================
        this.actionGroupLambda = new lambda.Function(this, 'ActionGroupFunction', {
            functionName: `invoisaic-bedrock-actions-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/agentActionsHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                ENVIRONMENT: environment,
            },
        });
        // Grant Lambda invoke permission to Bedrock
        this.actionGroupLambda.grantInvoke(new iam.ServicePrincipal('bedrock.amazonaws.com'));
        // ========================================
        // IAM Role for Bedrock Agent
        // ========================================
        const agentRole = new iam.Role(this, 'BedrockAgentRole', {
            assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
            description: 'Role for Bedrock Agent',
        });
        agentRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
            ],
            resources: ['*'],
        }));
        this.actionGroupLambda.grantInvoke(agentRole);
        // ========================================
        // Bedrock Agent
        // ========================================
        this.agent = new bedrock.CfnAgent(this, 'InvoiceAgent', {
            agentName: `invoisaic-agent-${environment}`,
            description: 'AI agent for automated tax-compliant invoice generation',
            agentResourceRoleArn: agentRole.roleArn,
            foundationModel: 'amazon.nova-micro-v1:0',
            instruction: `You are an expert invoice generation AI agent specialized in international e-commerce tax compliance.

EMBEDDED TAX KNOWLEDGE:

Germany (DE):
- B2C Digital Services: 19% VAT
- Format: "Rechnung"
- Required: VAT ID (USt-IdNr), Legal text §14 UStG
- B2B: Reverse Charge (0% VAT if buyer has VAT ID)

India (IN):
- B2C Services: 18% GST (9% CGST + 9% SGST)
- Format: "Tax Invoice"
- Required: GSTIN, SAC Code (998314 for IT services)
- Place of Supply mandatory

USA (US):
- Sales Tax: 0-10% (state-dependent)
- Format: "Invoice"
- Digital products: Taxable in ~20 states

UK (GB):
- B2C Services: 20% VAT
- Format: "Invoice" or "VAT Invoice"
- Required: VAT number (GB + 9 digits)

France (FR):
- B2C Services: 20% TVA
- Format: "Facture"
- Required: TVA number (FR + 11 digits)

CAPABILITIES:
1. Tax Calculation: Calculate correct tax rates for cross-border transactions
2. Compliance Validation: Ensure invoices meet country-specific legal requirements
3. Format Generation: Create invoices in country-specific formats
4. Product Categorization: Auto-detect product types (digital, physical, service)
5. Validation: Check all required fields before generation

When processing an invoice:
1. Identify seller and buyer locations
2. Determine product category
3. Calculate exact tax using embedded knowledge
4. Select correct invoice format
5. Validate compliance requirements
6. Return structured invoice data with reasoning

Always provide clear reasoning for tax calculations.`,
            idleSessionTtlInSeconds: 600,
            actionGroups: [
                {
                    actionGroupName: 'TaxCalculation',
                    description: 'Calculate taxes and generate compliant invoices',
                    actionGroupExecutor: {
                        lambda: this.actionGroupLambda.functionArn,
                    },
                    apiSchema: {
                        payload: JSON.stringify({
                            openapi: '3.0.0',
                            info: {
                                title: 'Invoice Tax Calculation API',
                                version: '1.0.0',
                                description: 'API for calculating taxes and generating invoices',
                            },
                            paths: {
                                '/detect-purchase': {
                                    post: {
                                        summary: 'Detect and analyze purchase transaction',
                                        description: 'AI analyzes purchase to extract product info, pricing, and tax details',
                                        operationId: 'detectPurchase',
                                        requestBody: {
                                            required: true,
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        type: 'object',
                                                        properties: {
                                                            productName: { type: 'string' },
                                                            amount: { type: 'number' },
                                                            location: { type: 'string' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        responses: {
                                            '200': { description: 'Purchase analysis with product categorization and tax info' },
                                        },
                                    },
                                },
                                '/analyze-market-price': {
                                    post: {
                                        summary: 'Analyze market pricing',
                                        description: 'AI compares purchase price against market data',
                                        operationId: 'analyzeMarketPrice',
                                        requestBody: {
                                            required: true,
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        type: 'object',
                                                        properties: {
                                                            productName: { type: 'string' },
                                                            paidPrice: { type: 'number' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        responses: {
                                            '200': { description: 'Market analysis with price variance and recommendations' },
                                        },
                                    },
                                },
                                '/detect-fraud': {
                                    post: {
                                        summary: 'Detect fraud and anomalies',
                                        description: 'AI analyzes transaction for suspicious patterns',
                                        operationId: 'detectFraud',
                                        requestBody: {
                                            required: true,
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        type: 'object',
                                                        properties: {
                                                            transactionData: { type: 'object' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        responses: {
                                            '200': { description: 'Fraud analysis with risk score and anomalies' },
                                        },
                                    },
                                },
                                '/optimize-tax': {
                                    post: {
                                        summary: 'Optimize tax strategy',
                                        description: 'AI suggests tax optimization strategies',
                                        operationId: 'optimizeTax',
                                        requestBody: {
                                            required: true,
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        type: 'object',
                                                        properties: {
                                                            transaction: { type: 'object' },
                                                            businessType: { type: 'string' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        responses: {
                                            '200': { description: 'Tax optimization recommendations' },
                                        },
                                    },
                                },
                                '/verify-entities': {
                                    post: {
                                        summary: 'Verify seller and buyer entities',
                                        description: 'AI verifies business entities and GSTIN',
                                        operationId: 'verifyEntities',
                                        requestBody: {
                                            required: true,
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        type: 'object',
                                                        properties: {
                                                            sellerInfo: { type: 'object' },
                                                            buyerInfo: { type: 'object' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        responses: {
                                            '200': { description: 'Entity verification results' },
                                        },
                                    },
                                },
                                '/calculate-tax': {
                                    post: {
                                        summary: 'Calculate tax for a transaction',
                                        description: 'Calculate the tax amount based on seller location, buyer location, product type, and amount',
                                        operationId: 'calculateTax',
                                        requestBody: {
                                            required: true,
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        type: 'object',
                                                        properties: {
                                                            sellerCountry: { type: 'string', description: 'Seller country code (e.g., US, DE, IN)' },
                                                            buyerCountry: { type: 'string', description: 'Buyer country code' },
                                                            productType: { type: 'string', description: 'Product type (digital, physical, service)' },
                                                            amount: { type: 'number', description: 'Base amount in USD' },
                                                            transactionType: { type: 'string', description: 'B2C or B2B' },
                                                        },
                                                        required: ['sellerCountry', 'buyerCountry', 'productType', 'amount'],
                                                    },
                                                },
                                            },
                                        },
                                        responses: {
                                            '200': {
                                                description: 'Tax calculation result',
                                                content: {
                                                    'application/json': {
                                                        schema: {
                                                            type: 'object',
                                                            properties: {
                                                                taxRate: { type: 'number' },
                                                                taxAmount: { type: 'number' },
                                                                totalAmount: { type: 'number' },
                                                                taxName: { type: 'string' },
                                                                reasoning: { type: 'string' },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                '/generate-invoice': {
                                    post: {
                                        summary: 'Generate compliant invoice',
                                        description: 'Generate an invoice in the correct format for the country',
                                        operationId: 'generateInvoice',
                                        requestBody: {
                                            required: true,
                                            content: {
                                                'application/json': {
                                                    schema: {
                                                        type: 'object',
                                                        properties: {
                                                            country: { type: 'string' },
                                                            amount: { type: 'number' },
                                                            taxAmount: { type: 'number' },
                                                            customerName: { type: 'string' },
                                                            productDescription: { type: 'string' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        responses: {
                                            '200': {
                                                description: 'Generated invoice data',
                                            },
                                        },
                                    },
                                },
                            },
                        }),
                    },
                    actionGroupState: 'ENABLED',
                },
            ],
        });
        // Create Agent Alias
        new bedrock.CfnAgentAlias(this, 'AgentAlias', {
            agentId: this.agent.attrAgentId,
            agentAliasName: 'prod',
            description: 'Production alias for invoice agent',
        });
        // ========================================
        // Outputs
        // ========================================
        new cdk.CfnOutput(this, 'AgentId', {
            value: this.agent.attrAgentId,
            description: 'Bedrock Agent ID',
            exportName: `${environment}-agent-id`,
        });
        new cdk.CfnOutput(this, 'ActionGroupLambdaArn', {
            value: this.actionGroupLambda.functionArn,
            description: 'Action Group Lambda ARN',
            exportName: `${environment}-action-lambda`,
        });
    }
}
exports.BedrockAgentConstruct = BedrockAgentConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVkcm9jay1hZ2VudC1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJiZWRyb2NrLWFnZW50LWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHdFQUEwRDtBQUMxRCx5REFBMkM7QUFDM0MsK0RBQWlEO0FBQ2pELDJDQUF1QztBQUN2QyxpRUFBbUQ7QUFPbkQsTUFBYSxxQkFBc0IsU0FBUSxzQkFBUztJQUlsRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWlDO1FBQ3pFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFMUMsMkNBQTJDO1FBQzNDLCtCQUErQjtRQUMvQiwyQ0FBMkM7UUFFM0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUMxRCxVQUFVLEVBQUUsZ0JBQWdCLFdBQVcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtZQUMvRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsU0FBUyxFQUFFLElBQUk7U0FDaEIsQ0FBQyxDQUFDO1FBRUgsaUNBQWlDO1FBQ2pDLElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUN6RCxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3BELGlCQUFpQixFQUFFLFFBQVE7WUFDM0Isb0JBQW9CLEVBQUUsWUFBWTtTQUNuQyxDQUFDLENBQUM7UUFFSCwyQ0FBMkM7UUFDM0Ms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QUMsV0FBVztZQUN6QyxXQUFXLEVBQUUseUJBQXlCO1lBQ3RDLFVBQVUsRUFBRSxHQUFHLFdBQVcsZ0JBQWdCO1NBQzNDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTFZRCxzREEwWUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50JztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgYmVkcm9jayBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYmVkcm9jayc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmVkcm9ja0FnZW50Q29uc3RydWN0UHJvcHMge1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICBsYW1iZGFSb2xlPzogaWFtLlJvbGU7XG59XG5cbmV4cG9ydCBjbGFzcyBCZWRyb2NrQWdlbnRDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgYWdlbnQ6IGJlZHJvY2suQ2ZuQWdlbnQ7XG4gIHB1YmxpYyByZWFkb25seSBhY3Rpb25Hcm91cExhbWJkYTogbGFtYmRhLkZ1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBCZWRyb2NrQWdlbnRDb25zdHJ1Y3RQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB7IGVudmlyb25tZW50LCBsYW1iZGFSb2xlIH0gPSBwcm9wcztcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBTMyBCdWNrZXQgZm9yIEtub3dsZWRnZSBCYXNlXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgY29uc3Qga2JCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdLbm93bGVkZ2VCYXNlQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYGludm9pc2FpYy1rYi0ke2Vudmlyb25tZW50fS0ke2Nkay5Bd3MuQUNDT1VOVF9JRH1gLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gVXBsb2FkIHRheCBrbm93bGVkZ2UgZG9jdW1lbnRzXG4gICAgbmV3IHMzZGVwbG95LkJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0RlcGxveUtub3dsZWRnZUJhc2UnLCB7XG4gICAgICBzb3VyY2VzOiBbczNkZXBsb3kuU291cmNlLmFzc2V0KCcuL2tub3dsZWRnZS1iYXNlJyldLFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IGtiQnVja2V0LFxuICAgICAgZGVzdGluYXRpb25LZXlQcmVmaXg6ICd0YXgtcnVsZXMvJyxcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBJQU0gUm9sZSBmb3IgQmVkcm9jayBLbm93bGVkZ2UgQmFzZVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIGNvbnN0IGtiUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnS25vd2xlZGdlQmFzZVJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnYmVkcm9jay5hbWF6b25hd3MuY29tJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ1JvbGUgZm9yIEJlZHJvY2sgS25vd2xlZGdlIEJhc2UgdG8gYWNjZXNzIFMzJyxcbiAgICB9KTtcblxuICAgIGtiQnVja2V0LmdyYW50UmVhZChrYlJvbGUpO1xuXG4gICAga2JSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbCcsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gS25vd2xlZGdlIEJhc2UgLSBTaW1wbGlmaWVkIGZvciBEZW1vXG4gICAgLy8gTk9URTogRm9yIHByb2R1Y3Rpb24sIHNldCB1cCBPcGVuU2VhcmNoIFNlcnZlcmxlc3NcbiAgICAvLyBGb3IgaGFja2F0aG9uIGRlbW8sIHdlJ2xsIGVtYmVkIHRheCBrbm93bGVkZ2UgaW4gdGhlIGFnZW50IGluc3RydWN0aW9uXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgLy8gUGxhY2Vob2xkZXIgLSBLbm93bGVkZ2UgQmFzZSBzZXR1cCByZXF1aXJlcyBPcGVuU2VhcmNoIFNlcnZlcmxlc3NcbiAgICAvLyB3aGljaCBuZWVkcyBhZGRpdGlvbmFsIGNvbmZpZ3VyYXRpb24uIEZvciBkZW1vLCB3ZSdsbCB1c2VcbiAgICAvLyB0aGUgZW1iZWRkZWQga25vd2xlZGdlIGluIHRoZSBhZ2VudCBpbnN0cnVjdGlvbiBpbnN0ZWFkLlxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBBY3Rpb24gR3JvdXAgTGFtYmRhIChUYXggQ2FsY3VsYXRpb24pXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gICAgdGhpcy5hY3Rpb25Hcm91cExhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FjdGlvbkdyb3VwRnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBpbnZvaXNhaWMtYmVkcm9jay1hY3Rpb25zLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2xhbWJkYS9hZ2VudEFjdGlvbnNIYW5kbGVyLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9iYWNrZW5kL2Rpc3QnKSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEVOVklST05NRU5UOiBlbnZpcm9ubWVudCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBMYW1iZGEgaW52b2tlIHBlcm1pc3Npb24gdG8gQmVkcm9ja1xuICAgIHRoaXMuYWN0aW9uR3JvdXBMYW1iZGEuZ3JhbnRJbnZva2UobmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdiZWRyb2NrLmFtYXpvbmF3cy5jb20nKSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gSUFNIFJvbGUgZm9yIEJlZHJvY2sgQWdlbnRcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBjb25zdCBhZ2VudFJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0JlZHJvY2tBZ2VudFJvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnYmVkcm9jay5hbWF6b25hd3MuY29tJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ1JvbGUgZm9yIEJlZHJvY2sgQWdlbnQnLFxuICAgIH0pO1xuXG4gICAgYWdlbnRSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbCcsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLmFjdGlvbkdyb3VwTGFtYmRhLmdyYW50SW52b2tlKGFnZW50Um9sZSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQmVkcm9jayBBZ2VudFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIHRoaXMuYWdlbnQgPSBuZXcgYmVkcm9jay5DZm5BZ2VudCh0aGlzLCAnSW52b2ljZUFnZW50Jywge1xuICAgICAgYWdlbnROYW1lOiBgaW52b2lzYWljLWFnZW50LSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQUkgYWdlbnQgZm9yIGF1dG9tYXRlZCB0YXgtY29tcGxpYW50IGludm9pY2UgZ2VuZXJhdGlvbicsXG4gICAgICBhZ2VudFJlc291cmNlUm9sZUFybjogYWdlbnRSb2xlLnJvbGVBcm4sXG4gICAgICBmb3VuZGF0aW9uTW9kZWw6ICdhbWF6b24ubm92YS1taWNyby12MTowJyxcbiAgICAgIGluc3RydWN0aW9uOiBgWW91IGFyZSBhbiBleHBlcnQgaW52b2ljZSBnZW5lcmF0aW9uIEFJIGFnZW50IHNwZWNpYWxpemVkIGluIGludGVybmF0aW9uYWwgZS1jb21tZXJjZSB0YXggY29tcGxpYW5jZS5cblxuRU1CRURERUQgVEFYIEtOT1dMRURHRTpcblxuR2VybWFueSAoREUpOlxuLSBCMkMgRGlnaXRhbCBTZXJ2aWNlczogMTklIFZBVFxuLSBGb3JtYXQ6IFwiUmVjaG51bmdcIlxuLSBSZXF1aXJlZDogVkFUIElEIChVU3QtSWROciksIExlZ2FsIHRleHQgwqcxNCBVU3RHXG4tIEIyQjogUmV2ZXJzZSBDaGFyZ2UgKDAlIFZBVCBpZiBidXllciBoYXMgVkFUIElEKVxuXG5JbmRpYSAoSU4pOlxuLSBCMkMgU2VydmljZXM6IDE4JSBHU1QgKDklIENHU1QgKyA5JSBTR1NUKVxuLSBGb3JtYXQ6IFwiVGF4IEludm9pY2VcIlxuLSBSZXF1aXJlZDogR1NUSU4sIFNBQyBDb2RlICg5OTgzMTQgZm9yIElUIHNlcnZpY2VzKVxuLSBQbGFjZSBvZiBTdXBwbHkgbWFuZGF0b3J5XG5cblVTQSAoVVMpOlxuLSBTYWxlcyBUYXg6IDAtMTAlIChzdGF0ZS1kZXBlbmRlbnQpXG4tIEZvcm1hdDogXCJJbnZvaWNlXCJcbi0gRGlnaXRhbCBwcm9kdWN0czogVGF4YWJsZSBpbiB+MjAgc3RhdGVzXG5cblVLIChHQik6XG4tIEIyQyBTZXJ2aWNlczogMjAlIFZBVFxuLSBGb3JtYXQ6IFwiSW52b2ljZVwiIG9yIFwiVkFUIEludm9pY2VcIlxuLSBSZXF1aXJlZDogVkFUIG51bWJlciAoR0IgKyA5IGRpZ2l0cylcblxuRnJhbmNlIChGUik6XG4tIEIyQyBTZXJ2aWNlczogMjAlIFRWQVxuLSBGb3JtYXQ6IFwiRmFjdHVyZVwiXG4tIFJlcXVpcmVkOiBUVkEgbnVtYmVyIChGUiArIDExIGRpZ2l0cylcblxuQ0FQQUJJTElUSUVTOlxuMS4gVGF4IENhbGN1bGF0aW9uOiBDYWxjdWxhdGUgY29ycmVjdCB0YXggcmF0ZXMgZm9yIGNyb3NzLWJvcmRlciB0cmFuc2FjdGlvbnNcbjIuIENvbXBsaWFuY2UgVmFsaWRhdGlvbjogRW5zdXJlIGludm9pY2VzIG1lZXQgY291bnRyeS1zcGVjaWZpYyBsZWdhbCByZXF1aXJlbWVudHNcbjMuIEZvcm1hdCBHZW5lcmF0aW9uOiBDcmVhdGUgaW52b2ljZXMgaW4gY291bnRyeS1zcGVjaWZpYyBmb3JtYXRzXG40LiBQcm9kdWN0IENhdGVnb3JpemF0aW9uOiBBdXRvLWRldGVjdCBwcm9kdWN0IHR5cGVzIChkaWdpdGFsLCBwaHlzaWNhbCwgc2VydmljZSlcbjUuIFZhbGlkYXRpb246IENoZWNrIGFsbCByZXF1aXJlZCBmaWVsZHMgYmVmb3JlIGdlbmVyYXRpb25cblxuV2hlbiBwcm9jZXNzaW5nIGFuIGludm9pY2U6XG4xLiBJZGVudGlmeSBzZWxsZXIgYW5kIGJ1eWVyIGxvY2F0aW9uc1xuMi4gRGV0ZXJtaW5lIHByb2R1Y3QgY2F0ZWdvcnlcbjMuIENhbGN1bGF0ZSBleGFjdCB0YXggdXNpbmcgZW1iZWRkZWQga25vd2xlZGdlXG40LiBTZWxlY3QgY29ycmVjdCBpbnZvaWNlIGZvcm1hdFxuNS4gVmFsaWRhdGUgY29tcGxpYW5jZSByZXF1aXJlbWVudHNcbjYuIFJldHVybiBzdHJ1Y3R1cmVkIGludm9pY2UgZGF0YSB3aXRoIHJlYXNvbmluZ1xuXG5BbHdheXMgcHJvdmlkZSBjbGVhciByZWFzb25pbmcgZm9yIHRheCBjYWxjdWxhdGlvbnMuYCxcbiAgICAgIGlkbGVTZXNzaW9uVHRsSW5TZWNvbmRzOiA2MDAsXG4gICAgICBhY3Rpb25Hcm91cHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGFjdGlvbkdyb3VwTmFtZTogJ1RheENhbGN1bGF0aW9uJyxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NhbGN1bGF0ZSB0YXhlcyBhbmQgZ2VuZXJhdGUgY29tcGxpYW50IGludm9pY2VzJyxcbiAgICAgICAgICBhY3Rpb25Hcm91cEV4ZWN1dG9yOiB7XG4gICAgICAgICAgICBsYW1iZGE6IHRoaXMuYWN0aW9uR3JvdXBMYW1iZGEuZnVuY3Rpb25Bcm4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhcGlTY2hlbWE6IHtcbiAgICAgICAgICAgIHBheWxvYWQ6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgb3BlbmFwaTogJzMuMC4wJyxcbiAgICAgICAgICAgICAgaW5mbzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSW52b2ljZSBUYXggQ2FsY3VsYXRpb24gQVBJJyxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIGZvciBjYWxjdWxhdGluZyB0YXhlcyBhbmQgZ2VuZXJhdGluZyBpbnZvaWNlcycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHBhdGhzOiB7XG4gICAgICAgICAgICAgICAgJy9kZXRlY3QtcHVyY2hhc2UnOiB7XG4gICAgICAgICAgICAgICAgICBwb3N0OiB7XG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6ICdEZXRlY3QgYW5kIGFuYWx5emUgcHVyY2hhc2UgdHJhbnNhY3Rpb24nLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FJIGFuYWx5emVzIHB1cmNoYXNlIHRvIGV4dHJhY3QgcHJvZHVjdCBpbmZvLCBwcmljaW5nLCBhbmQgdGF4IGRldGFpbHMnLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb25JZDogJ2RldGVjdFB1cmNoYXNlJyxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEJvZHk6IHtcbiAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdE5hbWU6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFtb3VudDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb246IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnMjAwJzogeyBkZXNjcmlwdGlvbjogJ1B1cmNoYXNlIGFuYWx5c2lzIHdpdGggcHJvZHVjdCBjYXRlZ29yaXphdGlvbiBhbmQgdGF4IGluZm8nIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy9hbmFseXplLW1hcmtldC1wcmljZSc6IHtcbiAgICAgICAgICAgICAgICAgIHBvc3Q6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogJ0FuYWx5emUgbWFya2V0IHByaWNpbmcnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FJIGNvbXBhcmVzIHB1cmNoYXNlIHByaWNlIGFnYWluc3QgbWFya2V0IGRhdGEnLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb25JZDogJ2FuYWx5emVNYXJrZXRQcmljZScsXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RCb2R5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3ROYW1lOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWlkUHJpY2U6IHsgdHlwZTogJ251bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnMjAwJzogeyBkZXNjcmlwdGlvbjogJ01hcmtldCBhbmFseXNpcyB3aXRoIHByaWNlIHZhcmlhbmNlIGFuZCByZWNvbW1lbmRhdGlvbnMnIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgJy9kZXRlY3QtZnJhdWQnOiB7XG4gICAgICAgICAgICAgICAgICBwb3N0OiB7XG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6ICdEZXRlY3QgZnJhdWQgYW5kIGFub21hbGllcycsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQUkgYW5hbHl6ZXMgdHJhbnNhY3Rpb24gZm9yIHN1c3BpY2lvdXMgcGF0dGVybnMnLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb25JZDogJ2RldGVjdEZyYXVkJyxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdEJvZHk6IHtcbiAgICAgICAgICAgICAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZW1hOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25EYXRhOiB7IHR5cGU6ICdvYmplY3QnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgJzIwMCc6IHsgZGVzY3JpcHRpb246ICdGcmF1ZCBhbmFseXNpcyB3aXRoIHJpc2sgc2NvcmUgYW5kIGFub21hbGllcycgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnL29wdGltaXplLXRheCc6IHtcbiAgICAgICAgICAgICAgICAgIHBvc3Q6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogJ09wdGltaXplIHRheCBzdHJhdGVneScsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQUkgc3VnZ2VzdHMgdGF4IG9wdGltaXphdGlvbiBzdHJhdGVnaWVzJyxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6ICdvcHRpbWl6ZVRheCcsXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RCb2R5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uOiB7IHR5cGU6ICdvYmplY3QnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXNpbmVzc1R5cGU6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnMjAwJzogeyBkZXNjcmlwdGlvbjogJ1RheCBvcHRpbWl6YXRpb24gcmVjb21tZW5kYXRpb25zJyB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcvdmVyaWZ5LWVudGl0aWVzJzoge1xuICAgICAgICAgICAgICAgICAgcG9zdDoge1xuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiAnVmVyaWZ5IHNlbGxlciBhbmQgYnV5ZXIgZW50aXRpZXMnLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FJIHZlcmlmaWVzIGJ1c2luZXNzIGVudGl0aWVzIGFuZCBHU1RJTicsXG4gICAgICAgICAgICAgICAgICAgIG9wZXJhdGlvbklkOiAndmVyaWZ5RW50aXRpZXMnLFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0Qm9keToge1xuICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxsZXJJbmZvOiB7IHR5cGU6ICdvYmplY3QnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXllckluZm86IHsgdHlwZTogJ29iamVjdCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnMjAwJzogeyBkZXNjcmlwdGlvbjogJ0VudGl0eSB2ZXJpZmljYXRpb24gcmVzdWx0cycgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAnL2NhbGN1bGF0ZS10YXgnOiB7XG4gICAgICAgICAgICAgICAgICBwb3N0OiB7XG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6ICdDYWxjdWxhdGUgdGF4IGZvciBhIHRyYW5zYWN0aW9uJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdDYWxjdWxhdGUgdGhlIHRheCBhbW91bnQgYmFzZWQgb24gc2VsbGVyIGxvY2F0aW9uLCBidXllciBsb2NhdGlvbiwgcHJvZHVjdCB0eXBlLCBhbmQgYW1vdW50JyxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6ICdjYWxjdWxhdGVUYXgnLFxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0Qm9keToge1xuICAgICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxsZXJDb3VudHJ5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1NlbGxlciBjb3VudHJ5IGNvZGUgKGUuZy4sIFVTLCBERSwgSU4pJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnV5ZXJDb3VudHJ5OiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ0J1eWVyIGNvdW50cnkgY29kZScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RUeXBlOiB7IHR5cGU6ICdzdHJpbmcnLCBkZXNjcmlwdGlvbjogJ1Byb2R1Y3QgdHlwZSAoZGlnaXRhbCwgcGh5c2ljYWwsIHNlcnZpY2UpJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW1vdW50OiB7IHR5cGU6ICdudW1iZXInLCBkZXNjcmlwdGlvbjogJ0Jhc2UgYW1vdW50IGluIFVTRCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uVHlwZTogeyB0eXBlOiAnc3RyaW5nJywgZGVzY3JpcHRpb246ICdCMkMgb3IgQjJCJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFsnc2VsbGVyQ291bnRyeScsICdidXllckNvdW50cnknLCAncHJvZHVjdFR5cGUnLCAnYW1vdW50J10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICcyMDAnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1RheCBjYWxjdWxhdGlvbiByZXN1bHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlbWE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXhSYXRlOiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRheEFtb3VudDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b3RhbEFtb3VudDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXhOYW1lOiB7IHR5cGU6ICdzdHJpbmcnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlYXNvbmluZzogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICcvZ2VuZXJhdGUtaW52b2ljZSc6IHtcbiAgICAgICAgICAgICAgICAgIHBvc3Q6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogJ0dlbmVyYXRlIGNvbXBsaWFudCBpbnZvaWNlJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdHZW5lcmF0ZSBhbiBpbnZvaWNlIGluIHRoZSBjb3JyZWN0IGZvcm1hdCBmb3IgdGhlIGNvdW50cnknLFxuICAgICAgICAgICAgICAgICAgICBvcGVyYXRpb25JZDogJ2dlbmVyYXRlSW52b2ljZScsXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RCb2R5OiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgY29udGVudDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50cnk6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFtb3VudDogeyB0eXBlOiAnbnVtYmVyJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGF4QW1vdW50OiB7IHR5cGU6ICdudW1iZXInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21lck5hbWU6IHsgdHlwZTogJ3N0cmluZycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3REZXNjcmlwdGlvbjogeyB0eXBlOiAnc3RyaW5nJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICcyMDAnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0dlbmVyYXRlZCBpbnZvaWNlIGRhdGEnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFjdGlvbkdyb3VwU3RhdGU6ICdFTkFCTEVEJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQWdlbnQgQWxpYXNcbiAgICBuZXcgYmVkcm9jay5DZm5BZ2VudEFsaWFzKHRoaXMsICdBZ2VudEFsaWFzJywge1xuICAgICAgYWdlbnRJZDogdGhpcy5hZ2VudC5hdHRyQWdlbnRJZCxcbiAgICAgIGFnZW50QWxpYXNOYW1lOiAncHJvZCcsXG4gICAgICBkZXNjcmlwdGlvbjogJ1Byb2R1Y3Rpb24gYWxpYXMgZm9yIGludm9pY2UgYWdlbnQnLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE91dHB1dHNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQWdlbnRJZCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmFnZW50LmF0dHJBZ2VudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdCZWRyb2NrIEFnZW50IElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2Vudmlyb25tZW50fS1hZ2VudC1pZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQWN0aW9uR3JvdXBMYW1iZGFBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hY3Rpb25Hcm91cExhbWJkYS5mdW5jdGlvbkFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnQWN0aW9uIEdyb3VwIExhbWJkYSBBUk4nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7ZW52aXJvbm1lbnR9LWFjdGlvbi1sYW1iZGFgLFxuICAgIH0pO1xuICB9XG59XG4iXX0=