# Deployment Guide

## Prerequisites

### Required Tools
- Node.js 18+ and npm
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Docker Desktop (for building Lambda layers)
- Git

### AWS Account Requirements
- AWS Account with Bedrock access enabled
- Sufficient IAM permissions to create resources
- AWS credits or billing enabled

### Enable AWS Bedrock

1. Navigate to AWS Bedrock console
2. Enable model access for:
   - Amazon Nova Micro
   - Amazon Nova Lite
3. Request access if not already enabled (usually instant)

## Step-by-Step Deployment

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd windsurf-project

# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Verify configuration
aws sts get-caller-identity
```

### 3. Configure Environment Variables

```bash
# Frontend configuration
cd frontend
cp .env.example .env

# Edit .env with your values
# VITE_AWS_REGION=us-east-1
# (Other values will be populated after deployment)

# Backend configuration
cd ../backend
cp .env.example .env

# Edit .env with your values
```

### 4. Build Backend

```bash
cd backend
npm run build

# Verify build
ls dist/
```

### 5. Bootstrap CDK (First Time Only)

```bash
cd infrastructure

# Bootstrap CDK in your AWS account
cdk bootstrap aws://ACCOUNT-ID/REGION

# Example:
# cdk bootstrap aws://123456789012/us-east-1
```

### 6. Deploy Infrastructure

```bash
# Deploy to development environment
npm run deploy:dev

# Or deploy to production
npm run deploy:prod

# Or deploy with default settings
npm run deploy
```

**Deployment takes approximately 5-10 minutes.**

### 7. Capture Deployment Outputs

After deployment, CDK will output important values:

```
Outputs:
InvoisaicStack-dev.ApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/
InvoisaicStack-dev.UserPoolId = us-east-1_xxxxxxxxx
InvoisaicStack-dev.UserPoolClientId = xxxxxxxxxxxxxxxxxxxxxxxxxx
InvoisaicStack-dev.DocumentsBucketName = invoisaic-documents-dev-123456789012
```

### 8. Update Frontend Configuration

```bash
cd frontend

# Update .env with deployment outputs
VITE_API_URL=<ApiUrl from outputs>
VITE_AWS_USER_POOL_ID=<UserPoolId from outputs>
VITE_AWS_USER_POOL_CLIENT_ID=<UserPoolClientId from outputs>
VITE_S3_BUCKET=<DocumentsBucketName from outputs>
VITE_AWS_REGION=us-east-1
```

### 9. Build and Test Frontend

```bash
# Development mode
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### 10. Create Test User

```bash
# Create a test user in Cognito
aws cognito-idp admin-create-user \
  --user-pool-id <UserPoolId> \
  --username demo@invoisaic.com \
  --user-attributes Name=email,Value=demo@invoisaic.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id <UserPoolId> \
  --username demo@invoisaic.com \
  --password Demo123! \
  --permanent
```

## Deployment Verification

### 1. Test API Endpoints

```bash
# Get API URL from outputs
API_URL=<your-api-url>

# Test health check (if implemented)
curl $API_URL/health

# Test invoices endpoint (requires authentication)
curl -H "Authorization: Bearer <token>" $API_URL/invoices
```

### 2. Test Frontend

1. Open browser to `http://localhost:3000`
2. Login with test credentials
3. Verify dashboard loads
4. Test invoice creation
5. Check agent monitoring

### 3. Verify AWS Resources

```bash
# List Lambda functions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `invoisaic`)].FunctionName'

# List DynamoDB tables
aws dynamodb list-tables --query 'TableNames[?contains(@, `invoisaic`)]'

# List S3 buckets
aws s3 ls | grep invoisaic

# Check API Gateway
aws apigateway get-rest-apis --query 'items[?name==`invoisaic-api-dev`]'
```

## Production Deployment

### Additional Steps for Production

1. **Custom Domain Setup**
```bash
# Create ACM certificate
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --validation-method DNS

# Configure custom domain in API Gateway
# Update CDK stack with custom domain configuration
```

2. **CloudFront Distribution** (Optional)
```bash
# Add CloudFront to CDK stack for frontend
# Configure SSL certificate
# Set up custom domain
```

3. **Monitoring and Alerts**
```bash
# Set up CloudWatch alarms
# Configure SNS notifications
# Enable X-Ray tracing
```

4. **Backup Configuration**
```bash
# Enable DynamoDB point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name invoisaic-invoices-prod \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

## Updating Deployment

### Update Backend

```bash
cd backend
npm run build

cd ../infrastructure
cdk deploy
```

### Update Frontend Only

```bash
cd frontend
npm run build

# Deploy to S3 (if using S3 hosting)
aws s3 sync dist/ s3://your-frontend-bucket/ --delete
```

## Rollback Procedure

### Rollback Infrastructure

```bash
cd infrastructure

# View previous versions
cdk diff

# Rollback to previous version
git checkout <previous-commit>
cdk deploy
```

### Rollback Database

```bash
# Restore DynamoDB table from backup
aws dynamodb restore-table-to-point-in-time \
  --source-table-name invoisaic-invoices-prod \
  --target-table-name invoisaic-invoices-prod-restored \
  --restore-date-time <timestamp>
```

## Troubleshooting

### Common Issues

**1. CDK Bootstrap Error**
```bash
# Solution: Bootstrap the account/region
cdk bootstrap
```

**2. Lambda Deployment Fails**
```bash
# Solution: Check build output
cd backend
npm run build
ls dist/

# Verify handler exists
```

**3. API Gateway 403 Errors**
```bash
# Solution: Check Cognito configuration
# Verify JWT token is valid
# Check IAM permissions
```

**4. Bedrock Access Denied**
```bash
# Solution: Enable Bedrock model access
# Go to AWS Console → Bedrock → Model Access
# Request access to Nova models
```

**5. DynamoDB Throttling**
```bash
# Solution: Switch to on-demand billing mode
# Or increase provisioned capacity
```

### Logs and Debugging

```bash
# View Lambda logs
aws logs tail /aws/lambda/invoisaic-invoice-dev --follow

# View API Gateway logs
aws logs tail API-Gateway-Execution-Logs_<api-id>/prod --follow

# Check CloudWatch Insights
# Use AWS Console for advanced log analysis
```

## Cost Estimation

### Development Environment
- Lambda: ~$0.50/month (free tier eligible)
- DynamoDB: ~$1-2/month (free tier eligible)
- API Gateway: ~$0.50/month (free tier eligible)
- S3: ~$0.50/month
- Bedrock AgentCore: FREE (preview until Oct 6, 2025)
- **Total: ~$3-5/month**

### Production Environment (estimated)
- Lambda: $10-20/month
- DynamoDB: $20-50/month
- API Gateway: $5-10/month
- S3: $5-10/month
- Bedrock: Usage-based pricing
- **Total: $40-90/month** (varies with usage)

## Cleanup

### Remove All Resources

```bash
cd infrastructure

# Destroy all resources
cdk destroy --all

# Confirm deletion
# Type 'y' when prompted

# Manual cleanup (if needed)
# - Empty S3 buckets
# - Delete CloudWatch log groups
# - Remove Cognito user pool
```

### Verify Cleanup

```bash
# Check for remaining resources
aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE

# Verify no Lambda functions remain
aws lambda list-functions | grep invoisaic

# Check DynamoDB tables
aws dynamodb list-tables | grep invoisaic
```

## Support

For deployment issues:
1. Check CloudWatch logs
2. Review CDK synthesis output
3. Verify AWS credentials and permissions
4. Check AWS service quotas
5. Review documentation

## Next Steps

After successful deployment:
1. Configure monitoring and alerts
2. Set up CI/CD pipeline
3. Implement backup strategy
4. Configure custom domain
5. Enable production features
6. Conduct security audit
7. Performance testing
8. User acceptance testing
