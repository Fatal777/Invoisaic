# ✅ Configuration Complete!

## Your AWS Configuration

**Account ID:** 202533497839  
**Region:** ap-south-1 (Mumbai)  
**Bedrock Models:** Nova Micro & Nova Lite ✅ Enabled

## Files Configured

### 1. Backend Configuration
- ✅ `backend/.env.example` - Updated with your AWS details
- Region: ap-south-1
- Account: 202533497839
- Bedrock models configured

### 2. Frontend Configuration  
- ✅ `frontend/.env.example` - Updated with region
- Will need CDK outputs after deployment

### 3. Infrastructure Configuration
- ✅ `infrastructure/bin/app.ts` - Updated with account and region

## Next Steps

### Step 1: Create Environment Files

```powershell
# Backend
cd backend
copy .env.example .env

# Frontend  
cd ../frontend
copy .env.example .env
```

### Step 2: Bootstrap CDK (First Time Only)

```powershell
cd ../infrastructure
cdk bootstrap aws://202533497839/ap-south-1
```

### Step 3: Build Backend

```powershell
cd ../backend
npm run build
```

This will create the `dist` folder needed for Lambda deployment.

### Step 4: Deploy Infrastructure

```powershell
cd ../infrastructure
cdk deploy --require-approval never
```

**This will take 5-10 minutes** and will output:
- ✅ API Gateway URL
- ✅ Cognito User Pool ID
- ✅ Cognito Client ID
- ✅ S3 Bucket Name

### Step 5: Update Frontend with CDK Outputs

After deployment, CDK will show outputs like:

```
Outputs:
InvoisaicStack-dev.ApiUrl = https://xxxxx.execute-api.ap-south-1.amazonaws.com/prod/
InvoisaicStack-dev.UserPoolId = ap-south-1_xxxxxxxxx
InvoisaicStack-dev.UserPoolClientId = xxxxxxxxxxxxxxxxxxxxxxxxxx
InvoisaicStack-dev.DocumentsBucketName = invoisaic-documents-dev-202533497839
```

**Copy these values to `frontend/.env`:**

```bash
VITE_API_URL=<ApiUrl from output>
VITE_AWS_USER_POOL_ID=<UserPoolId from output>
VITE_AWS_USER_POOL_CLIENT_ID=<UserPoolClientId from output>
VITE_S3_BUCKET=<DocumentsBucketName from output>
```

### Step 6: Create Test User

```powershell
aws cognito-idp admin-create-user `
  --user-pool-id <UserPoolId> `
  --username demo@invoisaic.com `
  --user-attributes Name=email,Value=demo@invoisaic.com Name=email_verified,Value=true `
  --temporary-password TempPass123! `
  --message-action SUPPRESS `
  --region ap-south-1

aws cognito-idp admin-set-user-password `
  --user-pool-id <UserPoolId> `
  --username demo@invoisaic.com `
  --password Demo123! `
  --permanent `
  --region ap-south-1
```

### Step 7: Start Frontend

```powershell
cd ../frontend
npm run dev
```

Open browser to: **http://localhost:3000**

Login with:
- Email: demo@invoisaic.com
- Password: Demo123!

## Quick Deploy Commands

```powershell
# From root directory

# 1. Build backend
cd backend && npm run build && cd ..

# 2. Bootstrap CDK (first time only)
cd infrastructure && cdk bootstrap aws://202533497839/ap-south-1

# 3. Deploy
cdk deploy --require-approval never

# 4. Note the outputs and update frontend/.env

# 5. Create test user (use commands above)

# 6. Start frontend
cd ../frontend && npm run dev
```

## Verification Checklist

Before deployment:
- [x] AWS CLI configured
- [x] AWS Account ID: 202533497839
- [x] AWS Region: ap-south-1
- [x] Bedrock access enabled (Nova models)
- [x] Dependencies installed
- [x] Configuration files updated

After deployment:
- [ ] CDK outputs captured
- [ ] Frontend .env updated
- [ ] Test user created
- [ ] Application running on localhost:3000

## Troubleshooting

### If CDK Bootstrap Fails
```powershell
# Ensure AWS credentials are configured
aws configure
aws sts get-caller-identity
```

### If Build Fails
```powershell
# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
npm run build
```

### If Deployment Fails
```powershell
# Check CDK version
cdk --version

# Update CDK if needed
npm install -g aws-cdk@latest
```

## Cost Estimate

With your configuration in ap-south-1:
- Bedrock AgentCore: FREE (preview)
- Lambda: ~$0.50/month (free tier)
- DynamoDB: ~$1-2/month (free tier)
- API Gateway: ~$0.50/month (free tier)
- S3: ~$0.50/month
- **Total: ~$3-5/month**

## Support

If you encounter issues:
1. Check CloudWatch logs
2. Verify Bedrock access in ap-south-1
3. Ensure all environment variables are set
4. Review DEPLOYMENT.md for detailed steps

---

**You're ready to deploy! 🚀**

Run the commands in order and you'll have a fully functional AI-powered invoice automation platform!
