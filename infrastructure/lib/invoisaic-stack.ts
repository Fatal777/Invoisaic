import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

interface InvoisaicStackProps extends cdk.StackProps {
  environment: string;
}

export class InvoisaicStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InvoisaicStackProps) {
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

    // WebSocket Connections Table for LiveDoc real-time updates
    const connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: `invoisaic-websocket-connections-${environment}`,
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
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

    // Use existing Knowledge Base (created manually in AWS Console)
    const knowledgeBaseId = this.node.tryGetContext('knowledgeBaseId') || process.env.KNOWLEDGE_BASE_ID || '2DW2JBM2MN';

    // Use existing Bedrock Agents (created manually in AWS Console)
    // Agent IDs should be passed via environment variables or context
    const orchestratorAgentId = this.node.tryGetContext('orchestratorAgentId') || process.env.ORCHESTRATOR_AGENT_ID || 'HCARGCEHMP';
    const extractionAgentId = this.node.tryGetContext('extractionAgentId') || process.env.EXTRACTION_AGENT_ID || 'K93HN5QKPX';
    const complianceAgentId = this.node.tryGetContext('complianceAgentId') || process.env.COMPLIANCE_AGENT_ID || 'K2GYUI5YOK';
    const validationAgentId = this.node.tryGetContext('validationAgentId') || process.env.VALIDATION_AGENT_ID || 'GTNAFH8LWX';

    const agenticDemoFunction = new lambda.Function(this, 'AgenticDemoFunction', {
      functionName: `invoisaic-agentic-demo-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda/agenticDemoHandler.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        BEDROCK_AGENT_ID: orchestratorAgentId,
        BEDROCK_AGENT_ALIAS_ID: 'TSTALIASID',
        BEDROCK_MODEL_ID: 'apac.amazon.nova-micro-v1:0',
        ORCHESTRATOR_AGENT_ID: orchestratorAgentId,
        EXTRACTION_AGENT_ID: extractionAgentId,
        COMPLIANCE_AGENT_ID: complianceAgentId,
        VALIDATION_AGENT_ID: validationAgentId,
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
        KNOWLEDGE_BASE_ID: knowledgeBaseId,
        BEDROCK_AGENT_ID: orchestratorAgentId,
        ORCHESTRATOR_AGENT_ID: orchestratorAgentId,
        EXTRACTION_AGENT_ID: extractionAgentId,
        COMPLIANCE_AGENT_ID: complianceAgentId,
        VALIDATION_AGENT_ID: validationAgentId,
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
        KNOWLEDGE_BASE_ID: knowledgeBaseId,
        BEDROCK_AGENT_ID: orchestratorAgentId,
        ORCHESTRATOR_AGENT_ID: orchestratorAgentId,
        EXTRACTION_AGENT_ID: extractionAgentId,
        COMPLIANCE_AGENT_ID: complianceAgentId,
        VALIDATION_AGENT_ID: validationAgentId,
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

    // BEDROCK AGENT RUNTIME - Direct agent invocation
    const invokeBedrockAgentFunction = new lambda.Function(this, 'InvokeBedrockAgentFunction', {
      functionName: `invoisaic-invoke-bedrock-agent-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda/invokeBedrockAgent.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      timeout: cdk.Duration.seconds(300),
      memorySize: 1024,
      environment: {
        ORCHESTRATOR_AGENT_ID: orchestratorAgentId,
        ORCHESTRATOR_ALIAS_ID: process.env.ORCHESTRATOR_ALIAS_ID || 'TSTALIASID',
        EXTRACTION_AGENT_ID: extractionAgentId,
        EXTRACTION_ALIAS_ID: process.env.EXTRACTION_ALIAS_ID || 'TSTALIASID',
        COMPLIANCE_AGENT_ID: complianceAgentId,
        COMPLIANCE_ALIAS_ID: process.env.COMPLIANCE_ALIAS_ID || 'TSTALIASID',
        VALIDATION_AGENT_ID: validationAgentId,
        VALIDATION_ALIAS_ID: process.env.VALIDATION_ALIAS_ID || 'TSTALIASID',
        REGION: this.region,
        ENVIRONMENT: environment,
      },
    });

    // Grant Bedrock Agent Runtime permissions
    invokeBedrockAgentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock-agent-runtime:InvokeAgent',
          'bedrock-agent-runtime:Retrieve',
          'bedrock-agent-runtime:RetrieveAndGenerate',
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'],
      })
    );

    // Grant S3 access for document retrieval
    documentsBucket.grantReadWrite(invokeBedrockAgentFunction);

    // Grant DynamoDB access for logging and state
    invoicesTable.grantReadWriteData(invokeBedrockAgentFunction);
    agentsTable.grantReadWriteData(invokeBedrockAgentFunction);

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

    // LIVEDOC - WebSocket Handler for real-time invoice processing
    const websocketFunction = new lambda.Function(this, 'WebSocketFunction', {
      functionName: `invoisaic-websocket-${environment}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda/websocketHandler.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      timeout: cdk.Duration.seconds(120), // Increased for agent orchestration
      memorySize: 1024, // Increased for agent orchestration
      environment: {
        CONNECTIONS_TABLE: connectionsTable.tableName,
        S3_DOCUMENTS_BUCKET: documentsBucket.bucketName,
        ENVIRONMENT: environment,
      },
    });

    connectionsTable.grantReadWriteData(websocketFunction);
    documentsBucket.grantRead(websocketFunction);

    // Grant Bedrock permissions to autonomous agent function
    autonomousAgentFunction.addToRolePolicy(
      new iam.PolicyStatement({
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
      })
    );

    // Grant Textract permissions to textract function
    textractFunction.addToRolePolicy(
      new iam.PolicyStatement({
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
      })
    );

    // Grant Textract permissions to websocket function for AgentCoordinator
    websocketFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'textract:AnalyzeDocument',
          'textract:DetectDocumentText',
        ],
        resources: ['*'],
      })
    );

    // Grant Bedrock permissions to invoice function
    invoiceFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'],
      })
    );

    // Grant Bedrock permissions to demo and features functions
    demoFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'],
      })
    );

    featuresFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['*'],
      })
    );

    agenticDemoFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'bedrock-agent-runtime:InvokeAgent',
        ],
        resources: ['*'],
      })
    );

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

    const generateInvoice = features.addResource('generate-invoice');
    generateInvoice.addMethod('POST', new apigateway.LambdaIntegration(featuresFunction));

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

    // BEDROCK AGENT - Invoke Agent endpoint
    const invokeAgent = api.root.addResource('invoke-agent');
    invokeAgent.addMethod('POST', new apigateway.LambdaIntegration(invokeBedrockAgentFunction, {
      proxy: true
    }));
    invokeAgent.addMethod('OPTIONS', new apigateway.MockIntegration({
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          'method.response.header.Access-Control-Allow-Methods': "'POST,OPTIONS'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
        },
      }],
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }), {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
    });

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
    // WebSocket API for LiveDoc Real-Time Updates
    // ========================================

    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'LiveDocWebSocket', {
      apiName: `invoisaic-livedoc-ws-${environment}`,
      description: 'WebSocket API for real-time invoice processing updates',
      connectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('ConnectIntegration', websocketFunction)
      },
      disconnectRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('DisconnectIntegration', websocketFunction)
      },
      defaultRouteOptions: {
        integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('DefaultIntegration', websocketFunction)
      }
    });

    // Add custom route for processInvoice
    webSocketApi.addRoute('processInvoice', {
      integration: new apigatewayv2Integrations.WebSocketLambdaIntegration('ProcessInvoiceIntegration', websocketFunction)
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'LiveDocWebSocketStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true
    });

    // Grant websocket function permission to manage connections
    websocketFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['execute-api:ManageConnections'],
        resources: [
          `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.apiId}/*`
        ]
      })
    );

    // Update websocket function environment with WebSocket API endpoint
    websocketFunction.addEnvironment('WEBSOCKET_API_ENDPOINT', `${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/prod`);

    // ========================================
    // Outputs
    // ========================================

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `invoisaic-api-url-${environment}`,
    });

    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: `wss://${webSocketApi.apiId}.execute-api.${this.region}.amazonaws.com/prod`,
      description: 'WebSocket API URL for LiveDoc real-time updates',
      exportName: `invoisaic-websocket-url-${environment}`,
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
