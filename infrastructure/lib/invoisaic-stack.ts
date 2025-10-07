import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';
import { BedrockAgentConstruct } from './bedrock-agent-construct';
import { KnowledgeBaseConstruct } from './knowledge-base-construct';

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
    const knowledgeBase = new KnowledgeBaseConstruct(this, 'KnowledgeBase', {
      environment,
    });

    // Bedrock Agent Construct
    const bedrockAgent = new BedrockAgentConstruct(this, 'BedrockAgent', {
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
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
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
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
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
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
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

    // Step Functions temporarily removed to fix circular dependency
    // TODO: Add back after deployment with proper dependency management

    // ========================================
    // API Gateway
    // ========================================

    const api = new apigateway.RestApi(this, 'InvoisaicAPI', {
      restApiName: `invoisaic-api-${environment}`,
      description: 'Invoisaic AI Invoice Automation API',
      deployOptions: {
        stageName: 'prod',
        description: `Production API for ${environment}`,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

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

    // TEXTRACT - OCR Processing endpoints
    const textract = api.root.addResource('textract');
    const textractProcess = textract.addResource('process');
    textractProcess.addMethod('POST', new apigateway.LambdaIntegration(textractFunction));
    
    const textractUpload = textract.addResource('upload');
    textractUpload.addMethod('POST', new apigateway.LambdaIntegration(textractFunction));

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
