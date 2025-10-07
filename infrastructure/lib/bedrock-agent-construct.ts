import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';

export interface BedrockAgentConstructProps {
  environment: string;
  lambdaRole?: iam.Role;
}

export class BedrockAgentConstruct extends Construct {
  public readonly agent: bedrock.CfnAgent;
  public readonly actionGroupLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: BedrockAgentConstructProps) {
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

    kbRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
        ],
        resources: ['*'],
      })
    );

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

    agentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
        ],
        resources: ['*'],
      })
    );

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
