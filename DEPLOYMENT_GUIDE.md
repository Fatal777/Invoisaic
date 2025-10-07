# 🚀 Invoisaic - Complete Deployment Guide

## **Production-Ready Platform Summary**

### **✅ What's Built:**

#### **Frontend Pages (8 Complete)**
1. ✅ **Dashboard** - Real-time metrics, AI insights, activity feed
2. ✅ **Invoices** - Full CRUD with AI scoring and fraud detection
3. ✅ **Document Upload** - AWS Textract OCR integration
4. ✅ **Vendors** - Relationship management with Neptune graph
5. ✅ **Analytics** - Predictive analytics with charts
6. ✅ **Settings** - Workflows, compliance, integrations
7. ✅ **Demo Simulator** - Real Bedrock Agent showcase
8. ✅ **Landing/Features/Login** - Public pages

#### **Backend Services (7 Lambda Functions)**
1. ✅ **agenticDemoHandler** - Bedrock Agent orchestration
2. ✅ **documentProcessHandler** - Textract OCR processing
3. ✅ **searchHandler** - Titan Embeddings semantic search
4. ✅ **agentActionsHandler** - 10+ AI action groups
5. ✅ **invoiceHandler** - Invoice CRUD operations
6. ✅ **customerHandler** - Customer management
7. ✅ **analyticsHandler** - Dashboard metrics

#### **Infrastructure (AWS CDK)**
1. ✅ **Bedrock Agent** with action groups
2. ✅ **Knowledge Base** with OpenSearch Serverless
3. ✅ **DynamoDB** tables
4. ✅ **S3** buckets
5. ✅ **API Gateway** REST API
6. ✅ **Cognito** authentication
7. ✅ **IAM** roles and policies

---

## **📋 Prerequisites**

```bash
# Required Tools
- Node.js 20.x
- npm or yarn
- AWS CLI v2
- AWS CDK 2.x
- Git

# AWS Account Setup
- Active AWS account
- AWS credentials configured
- Bedrock model access enabled
- Appropriate IAM permissions
```

---

## **🔧 Step-by-Step Deployment**

### **Step 1: Clone and Install**

```bash
# Clone repository
git clone <your-repo-url>
cd windsurf-project

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
npm run build
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install infrastructure dependencies
cd infrastructure
npm install
cd ..
```

### **Step 2: Configure Environment Variables**

#### **Frontend (.env)**
```env
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXX
```

#### **Infrastructure Environment**
```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1
export ENVIRONMENT=prod
```

### **Step 3: Enable Bedrock Models**

```bash
# Go to AWS Console → Bedrock → Model Access
# Enable these models:
- Amazon Nova Micro
- Amazon Nova Pro  
- Amazon Titan Embeddings V2
- Anthropic Claude 3.5 Sonnet (optional)

# Or via CLI:
aws bedrock list-foundation-models --region us-east-1
```

### **Step 4: Deploy Knowledge Base Documents**

```bash
# The CDK will create S3 bucket and upload files
# Verify knowledge base files exist:
ls -la knowledge-base/tax-rules/

# Expected files:
- india-gst.md
- germany-vat.md
- usa-sales-tax.md
```

### **Step 5: Deploy Infrastructure**

```bash
cd infrastructure

# Bootstrap CDK (first time only)
cdk bootstrap aws://${AWS_ACCOUNT_ID}/${AWS_REGION}

# Synthesize CloudFormation template
cdk synth

# Deploy stack
cdk deploy --all --require-approval never

# This will create:
- DynamoDB tables
- S3 buckets
- Lambda functions
- API Gateway
- Bedrock Agent
- Knowledge Base
- OpenSearch Serverless collection
- Cognito User Pool

# Deployment takes ~15-20 minutes
```

### **Step 6: Get Stack Outputs**

```bash
# After deployment, save these outputs:
aws cloudformation describe-stacks \
  --stack-name InvoisaicStack-prod \
  --query 'Stacks[0].Outputs' \
  --output table

# Key outputs:
- ApiUrl
- UserPoolId
- UserPoolClientId
- AgentId
- KnowledgeBaseBucketName
- CollectionEndpoint
```

### **Step 7: Update Frontend Config**

```bash
cd ../frontend

# Update .env with actual values from Step 6
cat > .env <<EOF
VITE_API_URL=<ApiUrl from stack output>
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=<UserPoolId>
VITE_COGNITO_CLIENT_ID=<UserPoolClientId>
EOF
```

### **Step 8: Build Frontend**

```bash
# Build production bundle
npm run build

# Output will be in dist/
ls -la dist/

# Test locally (optional)
npm run preview
```

### **Step 9: Deploy Frontend to S3 + CloudFront**

```bash
# Create S3 bucket for frontend
aws s3 mb s3://invoisaic-frontend-prod

# Enable static website hosting
aws s3 website s3://invoisaic-frontend-prod \
  --index-document index.html \
  --error-document index.html

# Upload build
aws s3 sync dist/ s3://invoisaic-frontend-prod --delete

# Create CloudFront distribution (optional but recommended)
aws cloudfront create-distribution \
  --origin-domain-name invoisaic-frontend-prod.s3.amazonaws.com \
  --default-root-object index.html
```

### **Step 10: Create First User**

```bash
# Create admin user via Cognito
aws cognito-idp sign-up \
  --client-id <UserPoolClientId> \
  --username admin@invoisaic.com \
  --password YourSecurePassword123! \
  --user-attributes Name=email,Value=admin@invoisaic.com

# Confirm user (bypass email verification)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id <UserPoolId> \
  --username admin@invoisaic.com
```

### **Step 11: Test the Platform**

```bash
# Test API endpoint
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/invoices

# Test Bedrock Agent
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/agentic-demo \
  -H "Content-Type: application/json" \
  -d '{
    "action": "process-purchase",
    "data": {
      "productName": "iPhone 15",
      "amount": 79900,
      "location": "Mumbai, India"
    }
  }'

# Test search
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "India GST rules",
    "type": "knowledge"
  }'
```

---

## **🔍 Verification Checklist**

### **Infrastructure**
- [ ] DynamoDB tables created (invoices, customers, agents)
- [ ] S3 buckets created (documents, knowledge-base)
- [ ] Lambda functions deployed (7 total)
- [ ] API Gateway created with all endpoints
- [ ] Bedrock Agent created with action groups
- [ ] Knowledge Base collection created
- [ ] Cognito User Pool created
- [ ] CloudWatch logs enabled

### **Frontend**
- [ ] Build completed successfully
- [ ] Deployed to S3
- [ ] CloudFront distribution created (optional)
- [ ] Environment variables configured
- [ ] Can access landing page
- [ ] Can log in
- [ ] Dashboard loads correctly

### **Backend Services**
- [ ] Agentic demo working
- [ ] Document upload/processing working
- [ ] Semantic search returning results
- [ ] Invoice CRUD operations working
- [ ] Knowledge Base queries working
- [ ] Textract processing PDFs/images

---

## **⚙️ Configuration**

### **Bedrock Agent Configuration**

The agent is pre-configured with 10 action groups:
1. `/detect-purchase` - AI purchase analysis
2. `/analyze-market-price` - Market intelligence
3. `/detect-fraud` - Anomaly detection
4. `/optimize-tax` - Tax optimization
5. `/verify-entities` - Entity verification
6. `/calculate-tax` - Tax calculation
7. `/generate-invoice` - Invoice generation
8. `/validate-invoice` - Compliance validation
9. `/categorize-product` - Product categorization
10. `/reconcile-payment` - Payment matching

### **Knowledge Base Configuration**

Documents indexed:
- India GST rules (89 lines)
- Germany VAT rules (85 lines)
- USA Sales Tax rules (120 lines)

To add more documents:
```bash
# Add new markdown files to knowledge-base/tax-rules/
# Then sync to S3:
aws s3 sync knowledge-base/ s3://<KnowledgeBaseBucket>/tax-rules/

# Trigger re-indexing (done automatically every hour)
```

---

## **📊 Monitoring**

### **CloudWatch Dashboards**

```bash
# View Lambda logs
aws logs tail /aws/lambda/invoisaic-agentic-demo-prod --follow

# View API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=invoisaic-api-prod \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### **Key Metrics to Monitor**
- Lambda invocation count
- Lambda duration (should be <3s)
- API Gateway 4xx/5xx errors
- DynamoDB read/write capacity
- Bedrock model invocations
- Textract API calls

---

## **💰 Cost Estimation**

### **Monthly Costs (Estimated for 1,000 invoices/month)**

```
Lambda Executions:
- 10,000 invocations × $0.20 per 1M = $0.002

Bedrock:
- Nova Micro: 1M tokens × $0.075 = $0.075
- Titan Embeddings: 500K tokens × $0.02 = $0.010

Textract:
- 1,000 pages × $1.50 per 1K = $1.50

DynamoDB:
- On-demand pricing: ~$5

S3:
- 100GB storage: ~$2.30

API Gateway:
- 100K requests: ~$0.35

OpenSearch Serverless:
- OCU hours: ~$50

CloudWatch:
- Logs + Metrics: ~$10

TOTAL: ~$70/month for 1,000 invoices
       ~$0.07 per invoice
```

### **Scaling**
- **10K invoices/month**: ~$250/month
- **100K invoices/month**: ~$1,200/month
- **1M invoices/month**: ~$8,000/month

---

## **🔒 Security Best Practices**

1. **Enable MFA** for AWS root account
2. **Use IAM roles** instead of access keys
3. **Enable CloudTrail** for audit logs
4. **Encrypt S3 buckets** (already enabled)
5. **Use Secrets Manager** for API keys
6. **Enable WAF** on API Gateway
7. **Set up VPC** for Lambda functions
8. **Enable GuardDuty** for threat detection

---

## **🚨 Troubleshooting**

### **Common Issues**

#### **Bedrock Agent not responding**
```bash
# Check agent status
aws bedrock-agent get-agent --agent-id <AgentId>

# Verify action Lambda
aws lambda invoke --function-name invoisaic-agent-actions-prod output.json

# Check IAM permissions
aws iam get-role --role-name InvoisaicStack-prod-BedrockAgentRole
```

#### **Knowledge Base queries failing**
```bash
# Check OpenSearch collection
aws opensearchserverless list-collections

# Verify data indexed
aws s3 ls s3://<KnowledgeBaseBucket>/tax-rules/
```

#### **Textract errors**
```bash
# Check Textract limits
aws service-quotas list-service-quotas \
  --service-code textract

# Test Textract directly
aws textract analyze-document \
  --document '{"S3Object":{"Bucket":"<bucket>","Name":"<key>"}}' \
  --feature-types TABLES FORMS
```

---

## **📈 Next Steps**

### **Phase 2 Enhancements**
- [ ] Add real-time WebSocket notifications
- [ ] Implement batch invoice processing
- [ ] Add export to PDF/Excel
- [ ] Create mobile app
- [ ] Add more integrations (Stripe, QuickBooks, etc.)

### **Phase 3 Scale**
- [ ] Multi-tenant support
- [ ] White-label solution
- [ ] Enterprise SSO
- [ ] Advanced fraud detection with SageMaker
- [ ] Custom model fine-tuning

---

## **🎓 Support**

- **Documentation**: https://docs.invoisaic.com
- **API Reference**: https://api.invoisaic.com/docs
- **Status Page**: https://status.invoisaic.com
- **Email Support**: support@invoisaic.com
- **Slack Community**: https://invoisaic.slack.com

---

## **✅ Deployment Complete!**

Your platform is now live at:
- **Frontend**: https://invoisaic-frontend-prod.s3-website-us-east-1.amazonaws.com
- **API**: https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

Login with your admin credentials and start using the platform! 🚀
