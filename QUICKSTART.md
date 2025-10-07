# Invoisaic - Quick Start Guide

Get Invoisaic up and running in under 10 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] AWS Account created
- [ ] AWS CLI installed and configured (`aws --version`)
- [ ] AWS Bedrock access enabled (Nova models)

## Step 1: Clone and Setup (2 minutes)

```bash
# Clone the repository
git clone <repository-url>
cd windsurf-project

# Install all dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
cd ../infrastructure && npm install
cd ..
```

## Step 2: Configure AWS (3 minutes)

### Enable AWS Bedrock

1. Go to AWS Console → Bedrock
2. Click "Model access" in left sidebar
3. Click "Enable specific models"
4. Enable:
   - Amazon Nova Micro
   - Amazon Nova Lite
5. Click "Save changes"

### Configure AWS CLI

```bash
aws configure
# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

## Step 3: Deploy to AWS (5 minutes)

```bash
# Build backend
cd backend
npm run build
cd ..

# Deploy infrastructure
cd infrastructure
npm install -g aws-cdk  # If not already installed
cdk bootstrap           # First time only
cdk deploy --require-approval never
cd ..
```

**Wait for deployment to complete (~5 minutes)**

## Step 4: Configure Frontend

After deployment, CDK will output important values. Copy them:

```bash
# Edit frontend/.env
cd frontend
cp .env.example .env

# Update with your values from CDK output:
# VITE_API_URL=<ApiUrl from CDK output>
# VITE_AWS_USER_POOL_ID=<UserPoolId from CDK output>
# VITE_AWS_USER_POOL_CLIENT_ID=<UserPoolClientId from CDK output>
# VITE_S3_BUCKET=<DocumentsBucketName from CDK output>
# VITE_AWS_REGION=us-east-1
```

## Step 5: Create Test User

```bash
# Replace <UserPoolId> with your value
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

## Step 6: Start Frontend

```bash
cd frontend
npm run dev
```

Open browser to: **http://localhost:3000**

## Step 7: Login and Explore

**Login Credentials:**
- Email: `demo@invoisaic.com`
- Password: `Demo123!`

**Try These Features:**
1. View Dashboard with AI insights
2. Create a new invoice
3. Monitor AI agents in real-time
4. Check analytics and reports

## Troubleshooting

### Issue: CDK Bootstrap Error
```bash
# Solution: Bootstrap your AWS account
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Issue: Bedrock Access Denied
```bash
# Solution: Enable Bedrock model access in AWS Console
# Go to Bedrock → Model Access → Enable Nova models
```

### Issue: Frontend Can't Connect to API
```bash
# Solution: Verify .env file has correct API URL
# Check CDK output for ApiUrl value
```

### Issue: Login Fails
```bash
# Solution: Verify user was created successfully
aws cognito-idp admin-get-user \
  --user-pool-id <UserPoolId> \
  --username demo@invoisaic.com
```

## Next Steps

- Read [ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details
- Check [API.md](docs/API.md) for API documentation
- Review [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) for demo scenarios
- See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment

## Quick Commands

```bash
# Start development
npm run dev

# Build everything
npm run build

# Deploy to AWS
npm run deploy

# Run tests
npm run test

# Clean everything
npm run clean
```

## Support

Having issues? Check:
1. CloudWatch logs for Lambda errors
2. Browser console for frontend errors
3. AWS Bedrock service status
4. Your AWS credentials and permissions

## Success!

You now have a fully functional AI-powered invoice automation platform running on AWS! 🎉

**What's Next?**
- Create your first invoice
- Explore AI agent recommendations
- Monitor agent performance
- Customize for your business needs

---

**Need Help?** Open an issue or check the documentation in the `docs/` folder.
