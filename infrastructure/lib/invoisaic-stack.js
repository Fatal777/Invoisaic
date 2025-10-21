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
exports.InvoisaicStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const bedrock_agent_construct_1 = require("./bedrock-agent-construct");
const knowledge_base_construct_1 = require("./knowledge-base-construct");
class InvoisaicStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environment } = props;
        // ========================================
        // DynamoDB Tables
        // ========================================
        const invoicesTable = new dynamodb.Table(this, 'InvoicesTable', {
            tableName: `invoisaic-invoices-${environment}`,
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            pointInTimeRecovery: environment === 'prod',
        });
        const customersTable = new dynamodb.Table(this, 'CustomersTable', {
            tableName: `invoisaic-customers-${environment}`,
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            pointInTimeRecovery: environment === 'prod',
        });
        const agentsTable = new dynamodb.Table(this, 'AgentsTable', {
            tableName: `invoisaic-agents-${environment}`,
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // ========================================
        // S3 Buckets
        // ========================================
        const documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
            bucketName: `invoisaic-documents-${environment}-${cdk.Stack.of(this).account}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: environment !== 'prod',
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
        });
        // ========================================
        // Cognito User Pool
        // ========================================
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: `invoisaic-users-${environment}`,
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
            },
            autoVerify: {
                email: true,
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool,
            authFlows: {
                userSrp: true,
            },
            generateSecret: false,
        });
        // Individual Lambda functions now create their own roles with specific permissions
        // ========================================
        // Lambda Functions
        // ========================================
        const invoiceFunction = new lambda.Function(this, 'InvoiceFunction', {
            functionName: `invoisaic-invoice-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/invoiceHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            environment: {
                DYNAMODB_INVOICES_TABLE: invoicesTable.tableName,
                DYNAMODB_CUSTOMERS_TABLE: customersTable.tableName,
                DYNAMODB_AGENTS_TABLE: agentsTable.tableName,
                S3_DOCUMENTS_BUCKET: documentsBucket.bucketName,
                BEDROCK_MODEL_ID: 'apac.amazon.nova-micro-v1:0',
                ENVIRONMENT: environment,
            },
        });
        // Grant permissions
        invoicesTable.grantReadWriteData(invoiceFunction);
        customersTable.grantReadWriteData(invoiceFunction);
        agentsTable.grantReadWriteData(invoiceFunction);
        documentsBucket.grantReadWrite(invoiceFunction);
        const customerFunction = new lambda.Function(this, 'CustomerFunction', {
            functionName: `invoisaic-customer-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/customerHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                DYNAMODB_CUSTOMERS_TABLE: customersTable.tableName,
                DYNAMODB_INVOICES_TABLE: invoicesTable.tableName,
                BEDROCK_MODEL_ID: 'apac.amazon.nova-micro-v1:0',
                ENVIRONMENT: environment,
            },
        });
        customersTable.grantReadWriteData(customerFunction);
        invoicesTable.grantReadWriteData(customerFunction);
        const agentFunction = new lambda.Function(this, 'AgentFunction', {
            functionName: `invoisaic-agent-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/agentHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                DYNAMODB_AGENTS_TABLE: agentsTable.tableName,
                ENVIRONMENT: environment,
            },
        });
        agentsTable.grantReadWriteData(agentFunction);
        const analyticsFunction = new lambda.Function(this, 'AnalyticsFunction', {
            functionName: `invoisaic-analytics-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/analyticsHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                DYNAMODB_INVOICES_TABLE: invoicesTable.tableName,
                DYNAMODB_CUSTOMERS_TABLE: customersTable.tableName,
                ENVIRONMENT: environment,
            },
        });
        invoicesTable.grantReadWriteData(analyticsFunction);
        customersTable.grantReadWriteData(analyticsFunction);
        // Knowledge Base Construct
        const knowledgeBase = new knowledge_base_construct_1.KnowledgeBaseConstruct(this, 'KnowledgeBase', {
            environment,
        });
        // Bedrock Agent Construct
        const bedrockAgent = new bedrock_agent_construct_1.BedrockAgentConstruct(this, 'BedrockAgent', {
            environment,
        });
        const agenticDemoFunction = new lambda.Function(this, 'AgenticDemoFunction', {
            functionName: `invoisaic-agentic-demo-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/agenticDemoHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(60),
            memorySize: 1024,
            environment: {
                BEDROCK_AGENT_ID: bedrockAgent.agent.attrAgentId,
                BEDROCK_AGENT_ALIAS_ID: 'TSTALIASID',
                BEDROCK_MODEL_ID: 'apac.amazon.nova-micro-v1:0',
                ENVIRONMENT: environment,
            },
        });
        const demoFunction = new lambda.Function(this, 'DemoFunction', {
            functionName: `invoisaic-demo-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/demoHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                BEDROCK_MODEL_ID: 'apac.amazon.nova-micro-v1:0',
                ENVIRONMENT: environment,
            },
        });
        const featuresFunction = new lambda.Function(this, 'FeaturesFunction', {
            functionName: `invoisaic-features-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/featuresHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(60),
            memorySize: 1024,
            environment: {
                BEDROCK_MODEL_ID: 'apac.amazon.nova-micro-v1:0',
                ENVIRONMENT: environment,
            },
        });
        // AUTONOMOUS SYSTEM - Webhook Handler
        const webhookFunction = new lambda.Function(this, 'WebhookFunction', {
            functionName: `invoisaic-webhook-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/webhookHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(60),
            memorySize: 1024,
            environment: {
                DYNAMODB_INVOICES_TABLE: invoicesTable.tableName,
                DYNAMODB_CUSTOMERS_TABLE: customersTable.tableName,
                DYNAMODB_AGENTS_TABLE: agentsTable.tableName,
                S3_DOCUMENTS_BUCKET: documentsBucket.bucketName,
                KNOWLEDGE_BASE_ID: knowledgeBase.knowledgeBaseId,
                BEDROCK_AGENT_ID: bedrockAgent.agent.attrAgentId,
                REGION: this.region,
                ENVIRONMENT: environment,
            },
        });
        invoicesTable.grantReadWriteData(webhookFunction);
        customersTable.grantReadWriteData(webhookFunction);
        agentsTable.grantReadWriteData(webhookFunction);
        documentsBucket.grantReadWrite(webhookFunction);
        // AUTONOMOUS SYSTEM - Autonomous Agent Handler
        const autonomousAgentFunction = new lambda.Function(this, 'AutonomousAgentFunction', {
            functionName: `invoisaic-autonomous-agent-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/autonomousAgentHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(90),
            memorySize: 2048,
            environment: {
                DYNAMODB_INVOICES_TABLE: invoicesTable.tableName,
                DYNAMODB_CUSTOMERS_TABLE: customersTable.tableName,
                DYNAMODB_AGENTS_TABLE: agentsTable.tableName,
                S3_DOCUMENTS_BUCKET: documentsBucket.bucketName,
                KNOWLEDGE_BASE_ID: knowledgeBase.knowledgeBaseId,
                BEDROCK_AGENT_ID: bedrockAgent.agent.attrAgentId,
                REGION: this.region,
                ENVIRONMENT: environment,
            },
        });
        invoicesTable.grantReadWriteData(autonomousAgentFunction);
        customersTable.grantReadWriteData(autonomousAgentFunction);
        agentsTable.grantReadWriteData(autonomousAgentFunction);
        documentsBucket.grantReadWrite(autonomousAgentFunction);
        // TEXTRACT - OCR Processing (99.8% accuracy)
        const textractFunction = new lambda.Function(this, 'TextractFunction', {
            functionName: `invoisaic-textract-processor-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/textractHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(120),
            memorySize: 1024,
            environment: {
                S3_DOCUMENTS_BUCKET: documentsBucket.bucketName,
                REGION: this.region,
                ENVIRONMENT: environment,
            },
        });
        documentsBucket.grantReadWrite(textractFunction);
        // AGENT STATUS - Real-time agent monitoring
        const agentStatusFunction = new lambda.Function(this, 'AgentStatusFunction', {
            functionName: `invoisaic-agent-status-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/agentStatusHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                DYNAMODB_AGENTS_TABLE: agentsTable.tableName,
                REGION: this.region,
                ENVIRONMENT: environment,
            },
        });
        agentsTable.grantReadWriteData(agentStatusFunction);
        // Create Function URL for agent status (bypasses API Gateway)
        const agentStatusUrl = agentStatusFunction.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedMethods: [lambda.HttpMethod.ALL],
                allowedHeaders: ['*'],
            },
        });
        // ARCHITECTURE - AWS metrics and infrastructure view
        const architectureFunction = new lambda.Function(this, 'ArchitectureFunction', {
            functionName: `invoisaic-architecture-${environment}`,
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'lambda/architectureHandler.handler',
            code: lambda.Code.fromAsset('../backend/dist'),
            timeout: cdk.Duration.seconds(30),
            memorySize: 512,
            environment: {
                REGION: this.region,
                ENVIRONMENT: environment,
            },
        });
        // Create Function URL for architecture (bypasses API Gateway)
        const architectureUrl = architectureFunction.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE,
            cors: {
                allowedOrigins: ['*'],
                allowedMethods: [lambda.HttpMethod.ALL],
                allowedHeaders: ['*'],
            },
        });
        // Grant Bedrock permissions to autonomous agent function
        autonomousAgentFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock-agent-runtime:Retrieve',
                'bedrock-agent-runtime:RetrieveAndGenerate',
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'textract:AnalyzeDocument',
                'textract:DetectDocumentText',
            ],
            resources: ['*'],
        }));
        // Grant Textract permissions to textract function
        textractFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'textract:AnalyzeDocument',
                'textract:DetectDocumentText',
                'textract:StartDocumentAnalysis',
                'textract:GetDocumentAnalysis',
                'textract:StartDocumentTextDetection',
                'textract:GetDocumentTextDetection',
            ],
            resources: ['*'],
        }));
        // Grant Bedrock permissions to invoice function
        invoiceFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
            ],
            resources: ['*'],
        }));
        // Grant Bedrock permissions to demo and features functions
        demoFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
            ],
            resources: ['*'],
        }));
        featuresFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
            ],
            resources: ['*'],
        }));
        agenticDemoFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock-agent-runtime:InvokeAgent',
            ],
            resources: ['*'],
        }));
        // Step Functions temporarily removed to fix circular dependency
        // TODO: Add back after deployment with proper dependency management
        // ========================================
        // API Gateway
        // ========================================
        const api = new apigateway.RestApi(this, 'InvoisaicApi', {
            restApiName: `invoisaic-${environment}`,
            description: `Production API for ${environment}`,
            binaryMediaTypes: ['multipart/form-data', 'image/*', 'application/pdf', 'application/octet-stream'],
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent',
                    'Accept'
                ],
                allowCredentials: true
            },
            deployOptions: {
                description: `Production API for ${environment}`,
                // Logging disabled - requires CloudWatch Logs role in account settings
                // loggingLevel: apigateway.MethodLoggingLevel.INFO,
                // dataTraceEnabled: true,
                metricsEnabled: true,
                tracingEnabled: true
            },
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL]
            }
        });
        // Add a usage plan and API key (optional but recommended)
        const apiKey = new apigateway.ApiKey(this, 'InvoisaicApiKey', {
            apiKeyName: `invoisaic-${environment}-api-key`,
            description: 'API Key for Invoisaic API',
            enabled: true,
        });
        const plan = api.addUsagePlan('InvoisaicUsagePlan', {
            name: `invoisaic-${environment}-usage-plan`,
            description: 'Usage plan for Invoisaic API',
            apiStages: [{
                    api: api,
                    stage: api.deploymentStage,
                }],
            throttle: {
                rateLimit: 100,
                burstLimit: 20
            }
        });
        plan.addApiKey(apiKey);
        // Invoices endpoints
        const invoices = api.root.addResource('invoices');
        invoices.addMethod('GET', new apigateway.LambdaIntegration(invoiceFunction));
        invoices.addMethod('POST', new apigateway.LambdaIntegration(invoiceFunction));
        const invoice = invoices.addResource('{id}');
        invoice.addMethod('GET', new apigateway.LambdaIntegration(invoiceFunction));
        invoice.addMethod('PUT', new apigateway.LambdaIntegration(invoiceFunction));
        invoice.addMethod('DELETE', new apigateway.LambdaIntegration(invoiceFunction));
        const invoiceSend = invoice.addResource('send');
        invoiceSend.addMethod('POST', new apigateway.LambdaIntegration(invoiceFunction));
        const invoicePaid = invoice.addResource('mark-paid');
        invoicePaid.addMethod('POST', new apigateway.LambdaIntegration(invoiceFunction));
        // Customers endpoints
        const customers = api.root.addResource('customers');
        customers.addMethod('GET', new apigateway.LambdaIntegration(customerFunction));
        customers.addMethod('POST', new apigateway.LambdaIntegration(customerFunction));
        const customer = customers.addResource('{id}');
        customer.addMethod('GET', new apigateway.LambdaIntegration(customerFunction));
        customer.addMethod('PUT', new apigateway.LambdaIntegration(customerFunction));
        customer.addMethod('DELETE', new apigateway.LambdaIntegration(customerFunction));
        // Agents endpoints
        const agents = api.root.addResource('agents');
        agents.addMethod('GET', new apigateway.LambdaIntegration(agentFunction));
        const agent = agents.addResource('{id}');
        agent.addMethod('GET', new apigateway.LambdaIntegration(agentFunction));
        // Demo endpoints (public - no auth for hackathon judges)
        const demo = api.root.addResource('demo');
        demo.addMethod('POST', new apigateway.LambdaIntegration(demoFunction));
        // Advanced Features endpoints (public for demo)
        const features = api.root.addResource('features');
        const bulkGenerate = features.addResource('bulk-generate');
        bulkGenerate.addMethod('POST', new apigateway.LambdaIntegration(featuresFunction));
        const validate = features.addResource('validate');
        validate.addMethod('POST', new apigateway.LambdaIntegration(featuresFunction));
        const categorize = features.addResource('categorize-product');
        categorize.addMethod('POST', new apigateway.LambdaIntegration(featuresFunction));
        const ocr = features.addResource('ocr-invoice');
        ocr.addMethod('POST', new apigateway.LambdaIntegration(featuresFunction));
        const reconcile = features.addResource('reconcile');
        reconcile.addMethod('POST', new apigateway.LambdaIntegration(featuresFunction));
        // Analytics endpoints
        const analytics = api.root.addResource('analytics');
        const dashboard = analytics.addResource('dashboard');
        dashboard.addMethod('GET', new apigateway.LambdaIntegration(analyticsFunction));
        // Agentic Demo endpoint
        const agenticDemo = api.root.addResource('agentic-demo');
        agenticDemo.addMethod('POST', new apigateway.LambdaIntegration(agenticDemoFunction));
        // TEXTRACT - OCR Processing endpoint (inherits CORS from root API)
        const textract = api.root.addResource('textract');
        textract.addMethod('POST', new apigateway.LambdaIntegration(textractFunction, {
            proxy: true
        }));
        // AUTONOMOUS SYSTEM - Webhook endpoint (single endpoint for all platforms)
        const webhook = api.root.addResource('webhook');
        const webhookStripe = webhook.addResource('stripe');
        webhookStripe.addMethod('POST', new apigateway.LambdaIntegration(webhookFunction));
        // AUTONOMOUS SYSTEM - Autonomous Agent endpoint
        const autonomousAgent = api.root.addResource('autonomous-agent');
        autonomousAgent.addMethod('POST', new apigateway.LambdaIntegration(autonomousAgentFunction));
        // Agent Status and Architecture use Lambda Function URLs (not API Gateway)
        // This avoids circular dependency while providing real backend
        // ========================================
        // Outputs
        // ========================================
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: api.url,
            description: 'API Gateway URL',
            exportName: `invoisaic-api-url-${environment}`,
        });
        new cdk.CfnOutput(this, 'AgentStatusUrl', {
            value: agentStatusUrl.url,
            description: 'Agent Status Function URL (for Agent Theater)',
            exportName: `invoisaic-agent-status-url-${environment}`,
        });
        new cdk.CfnOutput(this, 'ArchitectureUrl', {
            value: architectureUrl.url,
            description: 'Architecture Function URL (for Architecture View)',
            exportName: `invoisaic-architecture-url-${environment}`,
        });
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: `invoisaic-user-pool-id-${environment}`,
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID',
            exportName: `invoisaic-user-pool-client-id-${environment}`,
        });
        new cdk.CfnOutput(this, 'DocumentsBucketName', {
            value: documentsBucket.bucketName,
            description: 'S3 Documents Bucket Name',
            exportName: `invoisaic-documents-bucket-${environment}`,
        });
    }
}
exports.InvoisaicStack = InvoisaicStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52b2lzYWljLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW52b2lzYWljLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQywrREFBaUQ7QUFDakQsdUVBQXlEO0FBQ3pELG1FQUFxRDtBQUNyRCx1REFBeUM7QUFDekMsaUVBQW1EO0FBQ25ELHlEQUEyQztBQUkzQyx1RUFBa0U7QUFDbEUseUVBQW9FO0FBTXBFLE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzNDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMEI7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUU5QiwyQ0FBMkM7UUFDM0Msa0JBQWtCO1FBQ2xCLDJDQUEyQztRQUUzQyxNQUFNLGFBQWEsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUM5RCxTQUFTLEVBQUUsc0JBQXNCLFdBQVcsRUFBRTtZQUM5QyxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNqRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxXQUFXLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQzVGLG1CQUFtQixFQUFFLFdBQVcsS0FBSyxNQUFNO1NBQzVDLENBQUMsQ0FBQztRQUVILE1BQU0sY0FBYyxHQUFHLElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJ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QztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxHQUFHO1lBQ3pCLFdBQVcsRUFBRSwrQ0FBK0M7WUFDNUQsVUFBVSxFQUFFLDhCQUE4QixXQUFXLEVBQUU7U0FDeEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUN6QyxLQUFLLEVBQUUsZUFBZSxDQUFDLEdBQUc7WUFDMUIsV0FBVyxFQUFFLG1EQUFtRDtZQUNoRSxVQUFVLEVBQUUsOEJBQThCLFdBQVcsRUFBRTtTQUN4RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNwQyxLQUFLLEVBQUUsUUFBUSxDQUFDLFVBQVU7WUFDMUIsV0FBVyxFQUFFLHNCQUFzQjtZQUNuQyxVQUFVLEVBQUUsMEJBQTBCLFdBQVcsRUFBRTtTQUNwRCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzFDLEtBQUssRUFBRSxjQUFjLENBQUMsZ0JBQWdCO1lBQ3RDLFdBQVcsRUFBRSw2QkFBNkI7WUFDMUMsVUFBVSxFQUFFLGlDQUFpQyxXQUFXLEVBQUU7U0FDM0QsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUM3QyxLQUFLLEVBQUUsZUFBZSxDQUFDLFVBQVU7WUFDakMsV0FBVyxFQUFFLDBCQUEwQjtZQUN2QyxVQUFVLEVBQUUsOEJBQThCLFdBQVcsRUFBRTtTQUN4RCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUEva0JELHdDQStrQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgc2ZuIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zdGVwZnVuY3Rpb25zJztcbmltcG9ydCAqIGFzIHRhc2tzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zdGVwZnVuY3Rpb25zLXRhc2tzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQmVkcm9ja0FnZW50Q29uc3RydWN0IH0gZnJvbSAnLi9iZWRyb2NrLWFnZW50LWNvbnN0cnVjdCc7XG5pbXBvcnQgeyBLbm93bGVkZ2VCYXNlQ29uc3RydWN0IH0gZnJvbSAnLi9rbm93bGVkZ2UtYmFzZS1jb25zdHJ1Y3QnO1xuXG5pbnRlcmZhY2UgSW52b2lzYWljU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEludm9pc2FpY1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEludm9pc2FpY1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnQgfSA9IHByb3BzO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIER5bmFtb0RCIFRhYmxlc1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIGNvbnN0IGludm9pY2VzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0ludm9pY2VzVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6IGBpbnZvaXNhaWMtaW52b2ljZXMtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IG5hbWU6ICdpZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY3VzdG9tZXJzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ0N1c3RvbWVyc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiBgaW52b2lzYWljLWN1c3RvbWVycy0ke2Vudmlyb25tZW50fWAsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2lkJywgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICByZW1vdmFsUG9saWN5OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IGVudmlyb25tZW50ID09PSAncHJvZCcsXG4gICAgfSk7XG5cbiAgICBjb25zdCBhZ2VudHNUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQWdlbnRzVGFibGUnLCB7XG4gICAgICB0YWJsZU5hbWU6IGBpbnZvaXNhaWMtYWdlbnRzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiAnaWQnLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gUzMgQnVja2V0c1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIGNvbnN0IGRvY3VtZW50c0J1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0RvY3VtZW50c0J1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGBpbnZvaXNhaWMtZG9jdW1lbnRzLSR7ZW52aXJvbm1lbnR9LSR7Y2RrLlN0YWNrLm9mKHRoaXMpLmFjY291bnR9YCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICByZW1vdmFsUG9saWN5OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiBlbnZpcm9ubWVudCAhPT0gJ3Byb2QnLFxuICAgICAgY29yczogW1xuICAgICAgICB7XG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtzMy5IdHRwTWV0aG9kcy5HRVQsIHMzLkh0dHBNZXRob2RzLlBVVCwgczMuSHR0cE1ldGhvZHMuUE9TVF0sXG4gICAgICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnKiddLFxuICAgICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQ29nbml0byBVc2VyIFBvb2xcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogYGludm9pc2FpYy11c2Vycy0ke2Vudmlyb25tZW50fWAsXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICB9LFxuICAgICAgYXV0b1ZlcmlmeToge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBwYXNzd29yZFBvbGljeToge1xuICAgICAgICBtaW5MZW5ndGg6IDgsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXG4gICAgICAgIHJlcXVpcmVTeW1ib2xzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSBuZXcgY29nbml0by5Vc2VyUG9vbENsaWVudCh0aGlzLCAnVXNlclBvb2xDbGllbnQnLCB7XG4gICAgICB1c2VyUG9vbCxcbiAgICAgIGF1dGhGbG93czoge1xuICAgICAgICB1c2VyU3JwOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGdlbmVyYXRlU2VjcmV0OiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIEluZGl2aWR1YWwgTGFtYmRhIGZ1bmN0aW9ucyBub3cgY3JlYXRlIHRoZWlyIG93biByb2xlcyB3aXRoIHNwZWNpZmljIHBlcm1pc3Npb25zXG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9uc1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIGNvbnN0IGludm9pY2VGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0ludm9pY2VGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGludm9pc2FpYy1pbnZvaWNlLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2xhbWJkYS9pbnZvaWNlSGFuZGxlci5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9kaXN0JyksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBtZW1vcnlTaXplOiAxMDI0LFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgRFlOQU1PREJfSU5WT0lDRVNfVEFCTEU6IGludm9pY2VzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBEWU5BTU9EQl9DVVNUT01FUlNfVEFCTEU6IGN1c3RvbWVyc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgRFlOQU1PREJfQUdFTlRTX1RBQkxFOiBhZ2VudHNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFMzX0RPQ1VNRU5UU19CVUNLRVQ6IGRvY3VtZW50c0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICBCRURST0NLX01PREVMX0lEOiAnYXBhYy5hbWF6b24ubm92YS1taWNyby12MTowJyxcbiAgICAgICAgRU5WSVJPTk1FTlQ6IGVudmlyb25tZW50LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zXG4gICAgaW52b2ljZXNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoaW52b2ljZUZ1bmN0aW9uKTtcbiAgICBjdXN0b21lcnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoaW52b2ljZUZ1bmN0aW9uKTtcbiAgICBhZ2VudHNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoaW52b2ljZUZ1bmN0aW9uKTtcbiAgICBkb2N1bWVudHNCdWNrZXQuZ3JhbnRSZWFkV3JpdGUoaW52b2ljZUZ1bmN0aW9uKTtcblxuICAgIGNvbnN0IGN1c3RvbWVyRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdDdXN0b21lckZ1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgaW52b2lzYWljLWN1c3RvbWVyLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2xhbWJkYS9jdXN0b21lckhhbmRsZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZGlzdCcpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgRFlOQU1PREJfQ1VTVE9NRVJTX1RBQkxFOiBjdXN0b21lcnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIERZTkFNT0RCX0lOVk9JQ0VTX1RBQkxFOiBpbnZvaWNlc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQkVEUk9DS19NT0RFTF9JRDogJ2FwYWMuYW1hem9uLm5vdmEtbWljcm8tdjE6MCcsXG4gICAgICAgIEVOVklST05NRU5UOiBlbnZpcm9ubWVudCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjdXN0b21lcnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3VzdG9tZXJGdW5jdGlvbik7XG4gICAgaW52b2ljZXNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoY3VzdG9tZXJGdW5jdGlvbik7XG5cbiAgICBjb25zdCBhZ2VudEZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQWdlbnRGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGludm9pc2FpYy1hZ2VudC0ke2Vudmlyb25tZW50fWAsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdsYW1iZGEvYWdlbnRIYW5kbGVyLmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCcuLi9iYWNrZW5kL2Rpc3QnKSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICAgIG1lbW9yeVNpemU6IDUxMixcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT0RCX0FHRU5UU19UQUJMRTogYWdlbnRzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBFTlZJUk9OTUVOVDogZW52aXJvbm1lbnQsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgYWdlbnRzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGFnZW50RnVuY3Rpb24pO1xuXG4gICAgY29uc3QgYW5hbHl0aWNzRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdBbmFseXRpY3NGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGludm9pc2FpYy1hbmFseXRpY3MtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnbGFtYmRhL2FuYWx5dGljc0hhbmRsZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZGlzdCcpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgRFlOQU1PREJfSU5WT0lDRVNfVEFCTEU6IGludm9pY2VzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBEWU5BTU9EQl9DVVNUT01FUlNfVEFCTEU6IGN1c3RvbWVyc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgRU5WSVJPTk1FTlQ6IGVudmlyb25tZW50LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGludm9pY2VzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGFuYWx5dGljc0Z1bmN0aW9uKTtcbiAgICBjdXN0b21lcnNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYW5hbHl0aWNzRnVuY3Rpb24pO1xuXG4gICAgLy8gS25vd2xlZGdlIEJhc2UgQ29uc3RydWN0XG4gICAgY29uc3Qga25vd2xlZGdlQmFzZSA9IG5ldyBLbm93bGVkZ2VCYXNlQ29uc3RydWN0KHRoaXMsICdLbm93bGVkZ2VCYXNlJywge1xuICAgICAgZW52aXJvbm1lbnQsXG4gICAgfSk7XG5cbiAgICAvLyBCZWRyb2NrIEFnZW50IENvbnN0cnVjdFxuICAgIGNvbnN0IGJlZHJvY2tBZ2VudCA9IG5ldyBCZWRyb2NrQWdlbnRDb25zdHJ1Y3QodGhpcywgJ0JlZHJvY2tBZ2VudCcsIHtcbiAgICAgIGVudmlyb25tZW50LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYWdlbnRpY0RlbW9GdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0FnZW50aWNEZW1vRnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBpbnZvaXNhaWMtYWdlbnRpYy1kZW1vLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2xhbWJkYS9hZ2VudGljRGVtb0hhbmRsZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZGlzdCcpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEJFRFJPQ0tfQUdFTlRfSUQ6IGJlZHJvY2tBZ2VudC5hZ2VudC5hdHRyQWdlbnRJZCxcbiAgICAgICAgQkVEUk9DS19BR0VOVF9BTElBU19JRDogJ1RTVEFMSUFTSUQnLFxuICAgICAgICBCRURST0NLX01PREVMX0lEOiAnYXBhYy5hbWF6b24ubm92YS1taWNyby12MTowJyxcbiAgICAgICAgRU5WSVJPTk1FTlQ6IGVudmlyb25tZW50LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRlbW9GdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0RlbW9GdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGludm9pc2FpYy1kZW1vLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2xhbWJkYS9kZW1vSGFuZGxlci5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9kaXN0JyksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBCRURST0NLX01PREVMX0lEOiAnYXBhYy5hbWF6b24ubm92YS1taWNyby12MTowJyxcbiAgICAgICAgRU5WSVJPTk1FTlQ6IGVudmlyb25tZW50LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGZlYXR1cmVzRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdGZWF0dXJlc0Z1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgaW52b2lzYWljLWZlYXR1cmVzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2xhbWJkYS9mZWF0dXJlc0hhbmRsZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZGlzdCcpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEJFRFJPQ0tfTU9ERUxfSUQ6ICdhcGFjLmFtYXpvbi5ub3ZhLW1pY3JvLXYxOjAnLFxuICAgICAgICBFTlZJUk9OTUVOVDogZW52aXJvbm1lbnQsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQVVUT05PTU9VUyBTWVNURU0gLSBXZWJob29rIEhhbmRsZXJcbiAgICBjb25zdCB3ZWJob29rRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdXZWJob29rRnVuY3Rpb24nLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBpbnZvaXNhaWMtd2ViaG9vay0ke2Vudmlyb25tZW50fWAsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcbiAgICAgIGhhbmRsZXI6ICdsYW1iZGEvd2ViaG9va0hhbmRsZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZGlzdCcpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT0RCX0lOVk9JQ0VTX1RBQkxFOiBpbnZvaWNlc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgRFlOQU1PREJfQ1VTVE9NRVJTX1RBQkxFOiBjdXN0b21lcnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIERZTkFNT0RCX0FHRU5UU19UQUJMRTogYWdlbnRzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBTM19ET0NVTUVOVFNfQlVDS0VUOiBkb2N1bWVudHNCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgS05PV0xFREdFX0JBU0VfSUQ6IGtub3dsZWRnZUJhc2Uua25vd2xlZGdlQmFzZUlkLFxuICAgICAgICBCRURST0NLX0FHRU5UX0lEOiBiZWRyb2NrQWdlbnQuYWdlbnQuYXR0ckFnZW50SWQsXG4gICAgICAgIFJFR0lPTjogdGhpcy5yZWdpb24sXG4gICAgICAgIEVOVklST05NRU5UOiBlbnZpcm9ubWVudCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBpbnZvaWNlc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh3ZWJob29rRnVuY3Rpb24pO1xuICAgIGN1c3RvbWVyc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh3ZWJob29rRnVuY3Rpb24pO1xuICAgIGFnZW50c1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YSh3ZWJob29rRnVuY3Rpb24pO1xuICAgIGRvY3VtZW50c0J1Y2tldC5ncmFudFJlYWRXcml0ZSh3ZWJob29rRnVuY3Rpb24pO1xuXG4gICAgLy8gQVVUT05PTU9VUyBTWVNURU0gLSBBdXRvbm9tb3VzIEFnZW50IEhhbmRsZXJcbiAgICBjb25zdCBhdXRvbm9tb3VzQWdlbnRGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0F1dG9ub21vdXNBZ2VudEZ1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgaW52b2lzYWljLWF1dG9ub21vdXMtYWdlbnQtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnbGFtYmRhL2F1dG9ub21vdXNBZ2VudEhhbmRsZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZGlzdCcpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoOTApLFxuICAgICAgbWVtb3J5U2l6ZTogMjA0OCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIERZTkFNT0RCX0lOVk9JQ0VTX1RBQkxFOiBpbnZvaWNlc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgRFlOQU1PREJfQ1VTVE9NRVJTX1RBQkxFOiBjdXN0b21lcnNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIERZTkFNT0RCX0FHRU5UU19UQUJMRTogYWdlbnRzVGFibGUudGFibGVOYW1lLFxuICAgICAgICBTM19ET0NVTUVOVFNfQlVDS0VUOiBkb2N1bWVudHNCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgICAgS05PV0xFREdFX0JBU0VfSUQ6IGtub3dsZWRnZUJhc2Uua25vd2xlZGdlQmFzZUlkLFxuICAgICAgICBCRURST0NLX0FHRU5UX0lEOiBiZWRyb2NrQWdlbnQuYWdlbnQuYXR0ckFnZW50SWQsXG4gICAgICAgIFJFR0lPTjogdGhpcy5yZWdpb24sXG4gICAgICAgIEVOVklST05NRU5UOiBlbnZpcm9ubWVudCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBpbnZvaWNlc1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhdXRvbm9tb3VzQWdlbnRGdW5jdGlvbik7XG4gICAgY3VzdG9tZXJzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGF1dG9ub21vdXNBZ2VudEZ1bmN0aW9uKTtcbiAgICBhZ2VudHNUYWJsZS5ncmFudFJlYWRXcml0ZURhdGEoYXV0b25vbW91c0FnZW50RnVuY3Rpb24pO1xuICAgIGRvY3VtZW50c0J1Y2tldC5ncmFudFJlYWRXcml0ZShhdXRvbm9tb3VzQWdlbnRGdW5jdGlvbik7XG5cbiAgICAvLyBURVhUUkFDVCAtIE9DUiBQcm9jZXNzaW5nICg5OS44JSBhY2N1cmFjeSlcbiAgICBjb25zdCB0ZXh0cmFjdEZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnVGV4dHJhY3RGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGludm9pc2FpYy10ZXh0cmFjdC1wcm9jZXNzb3ItJHtlbnZpcm9ubWVudH1gLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnbGFtYmRhL3RleHRyYWN0SGFuZGxlci5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9kaXN0JyksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMjApLFxuICAgICAgbWVtb3J5U2l6ZTogMTAyNCxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFMzX0RPQ1VNRU5UU19CVUNLRVQ6IGRvY3VtZW50c0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICBSRUdJT046IHRoaXMucmVnaW9uLFxuICAgICAgICBFTlZJUk9OTUVOVDogZW52aXJvbm1lbnQsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgZG9jdW1lbnRzQnVja2V0LmdyYW50UmVhZFdyaXRlKHRleHRyYWN0RnVuY3Rpb24pO1xuXG4gICAgLy8gQUdFTlQgU1RBVFVTIC0gUmVhbC10aW1lIGFnZW50IG1vbml0b3JpbmdcbiAgICBjb25zdCBhZ2VudFN0YXR1c0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQWdlbnRTdGF0dXNGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGludm9pc2FpYy1hZ2VudC1zdGF0dXMtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnbGFtYmRhL2FnZW50U3RhdHVzSGFuZGxlci5oYW5kbGVyJyxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnLi4vYmFja2VuZC9kaXN0JyksXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBEWU5BTU9EQl9BR0VOVFNfVEFCTEU6IGFnZW50c1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgUkVHSU9OOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgRU5WSVJPTk1FTlQ6IGVudmlyb25tZW50LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGFnZW50c1RhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShhZ2VudFN0YXR1c0Z1bmN0aW9uKTtcblxuICAgIC8vIENyZWF0ZSBGdW5jdGlvbiBVUkwgZm9yIGFnZW50IHN0YXR1cyAoYnlwYXNzZXMgQVBJIEdhdGV3YXkpXG4gICAgY29uc3QgYWdlbnRTdGF0dXNVcmwgPSBhZ2VudFN0YXR1c0Z1bmN0aW9uLmFkZEZ1bmN0aW9uVXJsKHtcbiAgICAgIGF1dGhUeXBlOiBsYW1iZGEuRnVuY3Rpb25VcmxBdXRoVHlwZS5OT05FLFxuICAgICAgY29yczoge1xuICAgICAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBbbGFtYmRhLkh0dHBNZXRob2QuQUxMXSxcbiAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFSQ0hJVEVDVFVSRSAtIEFXUyBtZXRyaWNzIGFuZCBpbmZyYXN0cnVjdHVyZSB2aWV3XG4gICAgY29uc3QgYXJjaGl0ZWN0dXJlRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdBcmNoaXRlY3R1cmVGdW5jdGlvbicsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogYGludm9pc2FpYy1hcmNoaXRlY3R1cmUtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnbGFtYmRhL2FyY2hpdGVjdHVyZUhhbmRsZXIuaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJy4uL2JhY2tlbmQvZGlzdCcpLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgbWVtb3J5U2l6ZTogNTEyLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUkVHSU9OOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgRU5WSVJPTk1FTlQ6IGVudmlyb25tZW50LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBGdW5jdGlvbiBVUkwgZm9yIGFyY2hpdGVjdHVyZSAoYnlwYXNzZXMgQVBJIEdhdGV3YXkpXG4gICAgY29uc3QgYXJjaGl0ZWN0dXJlVXJsID0gYXJjaGl0ZWN0dXJlRnVuY3Rpb24uYWRkRnVuY3Rpb25Vcmwoe1xuICAgICAgYXV0aFR5cGU6IGxhbWJkYS5GdW5jdGlvblVybEF1dGhUeXBlLk5PTkUsXG4gICAgICBjb3JzOiB7XG4gICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJyonXSxcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtsYW1iZGEuSHR0cE1ldGhvZC5BTExdLFxuICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgQmVkcm9jayBwZXJtaXNzaW9ucyB0byBhdXRvbm9tb3VzIGFnZW50IGZ1bmN0aW9uXG4gICAgYXV0b25vbW91c0FnZW50RnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnYmVkcm9jay1hZ2VudC1ydW50aW1lOlJldHJpZXZlJyxcbiAgICAgICAgICAnYmVkcm9jay1hZ2VudC1ydW50aW1lOlJldHJpZXZlQW5kR2VuZXJhdGUnLFxuICAgICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbFdpdGhSZXNwb25zZVN0cmVhbScsXG4gICAgICAgICAgJ3RleHRyYWN0OkFuYWx5emVEb2N1bWVudCcsXG4gICAgICAgICAgJ3RleHRyYWN0OkRldGVjdERvY3VtZW50VGV4dCcsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBUZXh0cmFjdCBwZXJtaXNzaW9ucyB0byB0ZXh0cmFjdCBmdW5jdGlvblxuICAgIHRleHRyYWN0RnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAndGV4dHJhY3Q6QW5hbHl6ZURvY3VtZW50JyxcbiAgICAgICAgICAndGV4dHJhY3Q6RGV0ZWN0RG9jdW1lbnRUZXh0JyxcbiAgICAgICAgICAndGV4dHJhY3Q6U3RhcnREb2N1bWVudEFuYWx5c2lzJyxcbiAgICAgICAgICAndGV4dHJhY3Q6R2V0RG9jdW1lbnRBbmFseXNpcycsXG4gICAgICAgICAgJ3RleHRyYWN0OlN0YXJ0RG9jdW1lbnRUZXh0RGV0ZWN0aW9uJyxcbiAgICAgICAgICAndGV4dHJhY3Q6R2V0RG9jdW1lbnRUZXh0RGV0ZWN0aW9uJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEdyYW50IEJlZHJvY2sgcGVybWlzc2lvbnMgdG8gaW52b2ljZSBmdW5jdGlvblxuICAgIGludm9pY2VGdW5jdGlvbi5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbFdpdGhSZXNwb25zZVN0cmVhbScsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBCZWRyb2NrIHBlcm1pc3Npb25zIHRvIGRlbW8gYW5kIGZlYXR1cmVzIGZ1bmN0aW9uc1xuICAgIGRlbW9GdW5jdGlvbi5hZGRUb1JvbGVQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsJyxcbiAgICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbFdpdGhSZXNwb25zZVN0cmVhbScsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICBmZWF0dXJlc0Z1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWwnLFxuICAgICAgICAgICdiZWRyb2NrOkludm9rZU1vZGVsV2l0aFJlc3BvbnNlU3RyZWFtJyxcbiAgICAgICAgXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGFnZW50aWNEZW1vRnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnYmVkcm9jazpJbnZva2VNb2RlbCcsXG4gICAgICAgICAgJ2JlZHJvY2s6SW52b2tlTW9kZWxXaXRoUmVzcG9uc2VTdHJlYW0nLFxuICAgICAgICAgICdiZWRyb2NrLWFnZW50LXJ1bnRpbWU6SW52b2tlQWdlbnQnLFxuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gU3RlcCBGdW5jdGlvbnMgdGVtcG9yYXJpbHkgcmVtb3ZlZCB0byBmaXggY2lyY3VsYXIgZGVwZW5kZW5jeVxuICAgIC8vIFRPRE86IEFkZCBiYWNrIGFmdGVyIGRlcGxveW1lbnQgd2l0aCBwcm9wZXIgZGVwZW5kZW5jeSBtYW5hZ2VtZW50XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQVBJIEdhdGV3YXlcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnSW52b2lzYWljQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6IGBpbnZvaXNhaWMtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgZGVzY3JpcHRpb246IGBQcm9kdWN0aW9uIEFQSSBmb3IgJHtlbnZpcm9ubWVudH1gLFxuICAgICAgYmluYXJ5TWVkaWFUeXBlczogWydtdWx0aXBhcnQvZm9ybS1kYXRhJywgJ2ltYWdlLyonLCAnYXBwbGljYXRpb24vcGRmJywgJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSddLFxuICAgICAgZGVmYXVsdENvcnNQcmVmbGlnaHRPcHRpb25zOiB7XG4gICAgICAgIGFsbG93T3JpZ2luczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IGFwaWdhdGV3YXkuQ29ycy5BTExfTUVUSE9EUyxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbXG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZScsXG4gICAgICAgICAgJ1gtQW16LURhdGUnLFxuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnWC1BcGktS2V5JyxcbiAgICAgICAgICAnWC1BbXotU2VjdXJpdHktVG9rZW4nLFxuICAgICAgICAgICdYLUFtei1Vc2VyLUFnZW50JyxcbiAgICAgICAgICAnQWNjZXB0J1xuICAgICAgICBdLFxuICAgICAgICBhbGxvd0NyZWRlbnRpYWxzOiB0cnVlXG4gICAgICB9LFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBkZXNjcmlwdGlvbjogYFByb2R1Y3Rpb24gQVBJIGZvciAke2Vudmlyb25tZW50fWAsXG4gICAgICAgIC8vIExvZ2dpbmcgZGlzYWJsZWQgLSByZXF1aXJlcyBDbG91ZFdhdGNoIExvZ3Mgcm9sZSBpbiBhY2NvdW50IHNldHRpbmdzXG4gICAgICAgIC8vIGxvZ2dpbmdMZXZlbDogYXBpZ2F0ZXdheS5NZXRob2RMb2dnaW5nTGV2ZWwuSU5GTyxcbiAgICAgICAgLy8gZGF0YVRyYWNlRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgbWV0cmljc0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIHRyYWNpbmdFbmFibGVkOiB0cnVlXG4gICAgICB9LFxuICAgICAgZW5kcG9pbnRDb25maWd1cmF0aW9uOiB7XG4gICAgICAgIHR5cGVzOiBbYXBpZ2F0ZXdheS5FbmRwb2ludFR5cGUuUkVHSU9OQUxdXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgYSB1c2FnZSBwbGFuIGFuZCBBUEkga2V5IChvcHRpb25hbCBidXQgcmVjb21tZW5kZWQpXG4gICAgY29uc3QgYXBpS2V5ID0gbmV3IGFwaWdhdGV3YXkuQXBpS2V5KHRoaXMsICdJbnZvaXNhaWNBcGlLZXknLCB7XG4gICAgICBhcGlLZXlOYW1lOiBgaW52b2lzYWljLSR7ZW52aXJvbm1lbnR9LWFwaS1rZXlgLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkgS2V5IGZvciBJbnZvaXNhaWMgQVBJJyxcbiAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICBjb25zdCBwbGFuID0gYXBpLmFkZFVzYWdlUGxhbignSW52b2lzYWljVXNhZ2VQbGFuJywge1xuICAgICAgbmFtZTogYGludm9pc2FpYy0ke2Vudmlyb25tZW50fS11c2FnZS1wbGFuYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVXNhZ2UgcGxhbiBmb3IgSW52b2lzYWljIEFQSScsXG4gICAgICBhcGlTdGFnZXM6IFt7XG4gICAgICAgIGFwaTogYXBpLFxuICAgICAgICBzdGFnZTogYXBpLmRlcGxveW1lbnRTdGFnZSxcbiAgICAgIH1dLFxuICAgICAgdGhyb3R0bGU6IHtcbiAgICAgICAgcmF0ZUxpbWl0OiAxMDAsXG4gICAgICAgIGJ1cnN0TGltaXQ6IDIwXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwbGFuLmFkZEFwaUtleShhcGlLZXkpO1xuXG4gICAgLy8gSW52b2ljZXMgZW5kcG9pbnRzXG4gICAgY29uc3QgaW52b2ljZXMgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnaW52b2ljZXMnKTtcbiAgICBpbnZvaWNlcy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGludm9pY2VGdW5jdGlvbikpO1xuICAgIGludm9pY2VzLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGludm9pY2VGdW5jdGlvbikpO1xuXG4gICAgY29uc3QgaW52b2ljZSA9IGludm9pY2VzLmFkZFJlc291cmNlKCd7aWR9Jyk7XG4gICAgaW52b2ljZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGludm9pY2VGdW5jdGlvbikpO1xuICAgIGludm9pY2UuYWRkTWV0aG9kKCdQVVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihpbnZvaWNlRnVuY3Rpb24pKTtcbiAgICBpbnZvaWNlLmFkZE1ldGhvZCgnREVMRVRFJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oaW52b2ljZUZ1bmN0aW9uKSk7XG5cbiAgICBjb25zdCBpbnZvaWNlU2VuZCA9IGludm9pY2UuYWRkUmVzb3VyY2UoJ3NlbmQnKTtcbiAgICBpbnZvaWNlU2VuZC5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihpbnZvaWNlRnVuY3Rpb24pKTtcblxuICAgIGNvbnN0IGludm9pY2VQYWlkID0gaW52b2ljZS5hZGRSZXNvdXJjZSgnbWFyay1wYWlkJyk7XG4gICAgaW52b2ljZVBhaWQuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oaW52b2ljZUZ1bmN0aW9uKSk7XG5cbiAgICAvLyBDdXN0b21lcnMgZW5kcG9pbnRzXG4gICAgY29uc3QgY3VzdG9tZXJzID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2N1c3RvbWVycycpO1xuICAgIGN1c3RvbWVycy5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGN1c3RvbWVyRnVuY3Rpb24pKTtcbiAgICBjdXN0b21lcnMuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oY3VzdG9tZXJGdW5jdGlvbikpO1xuXG4gICAgY29uc3QgY3VzdG9tZXIgPSBjdXN0b21lcnMuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBjdXN0b21lci5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGN1c3RvbWVyRnVuY3Rpb24pKTtcbiAgICBjdXN0b21lci5hZGRNZXRob2QoJ1BVVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGN1c3RvbWVyRnVuY3Rpb24pKTtcbiAgICBjdXN0b21lci5hZGRNZXRob2QoJ0RFTEVURScsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGN1c3RvbWVyRnVuY3Rpb24pKTtcblxuICAgIC8vIEFnZW50cyBlbmRwb2ludHNcbiAgICBjb25zdCBhZ2VudHMgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnYWdlbnRzJyk7XG4gICAgYWdlbnRzLmFkZE1ldGhvZCgnR0VUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYWdlbnRGdW5jdGlvbikpO1xuXG4gICAgY29uc3QgYWdlbnQgPSBhZ2VudHMuYWRkUmVzb3VyY2UoJ3tpZH0nKTtcbiAgICBhZ2VudC5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFnZW50RnVuY3Rpb24pKTtcblxuICAgIC8vIERlbW8gZW5kcG9pbnRzIChwdWJsaWMgLSBubyBhdXRoIGZvciBoYWNrYXRob24ganVkZ2VzKVxuICAgIGNvbnN0IGRlbW8gPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnZGVtbycpO1xuICAgIGRlbW8uYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZGVtb0Z1bmN0aW9uKSk7XG5cbiAgICAvLyBBZHZhbmNlZCBGZWF0dXJlcyBlbmRwb2ludHMgKHB1YmxpYyBmb3IgZGVtbylcbiAgICBjb25zdCBmZWF0dXJlcyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdmZWF0dXJlcycpO1xuXG4gICAgY29uc3QgYnVsa0dlbmVyYXRlID0gZmVhdHVyZXMuYWRkUmVzb3VyY2UoJ2J1bGstZ2VuZXJhdGUnKTtcbiAgICBidWxrR2VuZXJhdGUuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZmVhdHVyZXNGdW5jdGlvbikpO1xuXG4gICAgY29uc3QgdmFsaWRhdGUgPSBmZWF0dXJlcy5hZGRSZXNvdXJjZSgndmFsaWRhdGUnKTtcbiAgICB2YWxpZGF0ZS5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihmZWF0dXJlc0Z1bmN0aW9uKSk7XG5cbiAgICBjb25zdCBjYXRlZ29yaXplID0gZmVhdHVyZXMuYWRkUmVzb3VyY2UoJ2NhdGVnb3JpemUtcHJvZHVjdCcpO1xuICAgIGNhdGVnb3JpemUuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZmVhdHVyZXNGdW5jdGlvbikpO1xuXG4gICAgY29uc3Qgb2NyID0gZmVhdHVyZXMuYWRkUmVzb3VyY2UoJ29jci1pbnZvaWNlJyk7XG4gICAgb2NyLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGZlYXR1cmVzRnVuY3Rpb24pKTtcblxuICAgIGNvbnN0IHJlY29uY2lsZSA9IGZlYXR1cmVzLmFkZFJlc291cmNlKCdyZWNvbmNpbGUnKTtcbiAgICByZWNvbmNpbGUuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oZmVhdHVyZXNGdW5jdGlvbikpO1xuXG4gICAgLy8gQW5hbHl0aWNzIGVuZHBvaW50c1xuICAgIGNvbnN0IGFuYWx5dGljcyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdhbmFseXRpY3MnKTtcbiAgICBjb25zdCBkYXNoYm9hcmQgPSBhbmFseXRpY3MuYWRkUmVzb3VyY2UoJ2Rhc2hib2FyZCcpO1xuICAgIGRhc2hib2FyZC5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGFuYWx5dGljc0Z1bmN0aW9uKSk7XG5cbiAgICAvLyBBZ2VudGljIERlbW8gZW5kcG9pbnRcbiAgICBjb25zdCBhZ2VudGljRGVtbyA9IGFwaS5yb290LmFkZFJlc291cmNlKCdhZ2VudGljLWRlbW8nKTtcbiAgICBhZ2VudGljRGVtby5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihhZ2VudGljRGVtb0Z1bmN0aW9uKSk7XG5cbiAgICAvLyBURVhUUkFDVCAtIE9DUiBQcm9jZXNzaW5nIGVuZHBvaW50IChpbmhlcml0cyBDT1JTIGZyb20gcm9vdCBBUEkpXG4gICAgY29uc3QgdGV4dHJhY3QgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgndGV4dHJhY3QnKTtcbiAgICB0ZXh0cmFjdC5hZGRNZXRob2QoJ1BPU1QnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0ZXh0cmFjdEZ1bmN0aW9uLCB7XG4gICAgICBwcm94eTogdHJ1ZVxuICAgIH0pKTtcblxuICAgIC8vIEFVVE9OT01PVVMgU1lTVEVNIC0gV2ViaG9vayBlbmRwb2ludCAoc2luZ2xlIGVuZHBvaW50IGZvciBhbGwgcGxhdGZvcm1zKVxuICAgIGNvbnN0IHdlYmhvb2sgPSBhcGkucm9vdC5hZGRSZXNvdXJjZSgnd2ViaG9vaycpO1xuICAgIGNvbnN0IHdlYmhvb2tTdHJpcGUgPSB3ZWJob29rLmFkZFJlc291cmNlKCdzdHJpcGUnKTtcbiAgICB3ZWJob29rU3RyaXBlLmFkZE1ldGhvZCgnUE9TVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHdlYmhvb2tGdW5jdGlvbikpO1xuXG4gICAgLy8gQVVUT05PTU9VUyBTWVNURU0gLSBBdXRvbm9tb3VzIEFnZW50IGVuZHBvaW50XG4gICAgY29uc3QgYXV0b25vbW91c0FnZW50ID0gYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2F1dG9ub21vdXMtYWdlbnQnKTtcbiAgICBhdXRvbm9tb3VzQWdlbnQuYWRkTWV0aG9kKCdQT1NUJywgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oYXV0b25vbW91c0FnZW50RnVuY3Rpb24pKTtcblxuICAgIC8vIEFnZW50IFN0YXR1cyBhbmQgQXJjaGl0ZWN0dXJlIHVzZSBMYW1iZGEgRnVuY3Rpb24gVVJMcyAobm90IEFQSSBHYXRld2F5KVxuICAgIC8vIFRoaXMgYXZvaWRzIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2hpbGUgcHJvdmlkaW5nIHJlYWwgYmFja2VuZFxuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE91dHB1dHNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXBpVXJsJywge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IFVSTCcsXG4gICAgICBleHBvcnROYW1lOiBgaW52b2lzYWljLWFwaS11cmwtJHtlbnZpcm9ubWVudH1gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FnZW50U3RhdHVzVXJsJywge1xuICAgICAgdmFsdWU6IGFnZW50U3RhdHVzVXJsLnVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQWdlbnQgU3RhdHVzIEZ1bmN0aW9uIFVSTCAoZm9yIEFnZW50IFRoZWF0ZXIpJyxcbiAgICAgIGV4cG9ydE5hbWU6IGBpbnZvaXNhaWMtYWdlbnQtc3RhdHVzLXVybC0ke2Vudmlyb25tZW50fWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQXJjaGl0ZWN0dXJlVXJsJywge1xuICAgICAgdmFsdWU6IGFyY2hpdGVjdHVyZVVybC51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FyY2hpdGVjdHVyZSBGdW5jdGlvbiBVUkwgKGZvciBBcmNoaXRlY3R1cmUgVmlldyknLFxuICAgICAgZXhwb3J0TmFtZTogYGludm9pc2FpYy1hcmNoaXRlY3R1cmUtdXJsLSR7ZW52aXJvbm1lbnR9YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGBpbnZvaXNhaWMtdXNlci1wb29sLWlkLSR7ZW52aXJvbm1lbnR9YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbENsaWVudElkJywge1xuICAgICAgdmFsdWU6IHVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIENsaWVudCBJRCcsXG4gICAgICBleHBvcnROYW1lOiBgaW52b2lzYWljLXVzZXItcG9vbC1jbGllbnQtaWQtJHtlbnZpcm9ubWVudH1gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RvY3VtZW50c0J1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogZG9jdW1lbnRzQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIERvY3VtZW50cyBCdWNrZXQgTmFtZScsXG4gICAgICBleHBvcnROYW1lOiBgaW52b2lzYWljLWRvY3VtZW50cy1idWNrZXQtJHtlbnZpcm9ubWVudH1gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=