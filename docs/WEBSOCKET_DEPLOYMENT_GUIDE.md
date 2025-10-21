# WebSocket API Deployment Guide

## 🎯 Overview

Your WebSocket API infrastructure is already coded and ready to deploy! This will enable real-time updates in the LiveDoc demo.

## 📋 Prerequisites

- ✅ AWS CLI configured
- ✅ AWS CDK installed
- ✅ Infrastructure code (already done!)
- ✅ Backend Lambda function (already done!)

## 🚀 Deployment Steps

### Step 1: Check Current Deployment Status

```powershell
.\check-websocket.ps1
```

If WebSocket URL is displayed, **skip to Step 4**.

### Step 2: Build the Backend

```bash
cd backend
npm install
npm run build
cd ..
```

### Step 3: Deploy the Infrastructure

```bash
cd infrastructure
npm install
cdk deploy --all
```

This will deploy:
- ✅ WebSocket API Gateway
- ✅ WebSocket Lambda Handler  
- ✅ DynamoDB Connections Table
- ✅ All necessary IAM roles and permissions

**Wait time**: ~5-10 minutes

### Step 4: Get WebSocket URL

After deployment completes, look for the output:

```
Outputs:
InvoisaicStack-dev.WebSocketUrl = wss://xxxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

Copy this URL!

### Step 5: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add or update:
   ```
   VITE_WEBSOCKET_URL=wss://xxxxxx.execute-api.ap-south-1.amazonaws.com/prod
   ```
5. Click **Save**

### Step 6: Redeploy Vercel

Vercel will auto-redeploy, or manually trigger:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment

### Step 7: Test WebSocket

1. Open your Vercel app: `https://invoisaic.vercel.app`
2. Go to **LiveDoc Intelligence** demo
3. Upload an invoice
4. Watch for real-time updates! 🎉

## 🔍 Verify Deployment

### Check WebSocket API

```bash
aws apigatewayv2 get-apis --query "Items[?Name=='invoisaic-livedoc-ws-dev']"
```

### Check Lambda Function

```bash
aws lambda get-function --function-name invoisaic-websocket-dev
```

### Check DynamoDB Table

```bash
aws dynamodb describe-table --table-name invoisaic-websocket-connections-dev
```

## 📊 What Gets Deployed

### 1. WebSocket API Gateway
- **API Name**: `invoisaic-livedoc-ws-dev`
- **Stage**: `prod`
- **Routes**:
  - `$connect` - Handle new connections
  - `$disconnect` - Handle disconnections
  - `$default` - Default message handler
  - `processInvoice` - Invoice processing trigger

### 2. Lambda Function
- **Name**: `invoisaic-websocket-dev`
- **Runtime**: Node.js 20.x
- **Handler**: `lambda/websocketHandler.handler`
- **Features**:
  - Connection management
  - Real-time message broadcasting
  - Agent orchestration updates

### 3. DynamoDB Table
- **Name**: `invoisaic-websocket-connections-dev`
- **Purpose**: Track active WebSocket connections
- **Key**: `connectionId` (STRING)

## 🎭 What WebSocket Enables

### Real-Time Features:
1. **Live Agent Status** - See agents working in real-time
2. **Field Extraction Updates** - Fields appear as they're extracted
3. **Visual Annotations** - Bounding boxes show extracted regions
4. **Progress Tracking** - Step-by-step processing status
5. **Instant Results** - Get results without polling

### Message Types:
- `agent_activity` - Agent status updates
- `field_extracted` - Extracted field data
- `annotation_added` - Visual annotation coordinates
- `processing_started` - Processing initiated
- `processing_complete` - Processing finished
- `tax_analysis` - Tax compliance results
- `fraud_analysis` - Fraud detection results
- `gl_entries` - General ledger codes
- `error` - Error notifications

## 🔧 Troubleshooting

### WebSocket Won't Connect

**Check 1: Verify URL Format**
```
Correct: wss://xxxxx.execute-api.ap-south-1.amazonaws.com/prod
Wrong: ws://xxxxx... (missing 's')
Wrong: https://xxxxx... (should be wss://)
```

**Check 2: Verify Lambda Permissions**
```bash
aws lambda get-policy --function-name invoisaic-websocket-dev
```

**Check 3: Check CloudWatch Logs**
```bash
aws logs tail /aws/lambda/invoisaic-websocket-dev --follow
```

### Connection Closes Immediately

**Possible causes**:
1. Lambda timeout (default: 6 seconds - should be ~900 for WebSocket)
2. Missing DynamoDB permissions
3. Table doesn't exist

**Fix**:
```bash
cd infrastructure
cdk deploy --all
```

### Messages Not Received

**Check Lambda logs**:
```bash
aws logs tail /aws/lambda/invoisaic-websocket-dev --follow
```

**Test WebSocket manually**:
```bash
npm install -g wscat
wscat -c wss://xxxxx.execute-api.ap-south-1.amazonaws.com/prod
```

## 💰 Cost Estimate

### Free Tier (first 12 months):
- WebSocket API: 1 million messages free
- Lambda: 1 million requests + 400,000 GB-seconds free  
- DynamoDB: 25 GB storage + 25 read/write units free

### After Free Tier:
- WebSocket messages: $1.00 per million
- Lambda invocations: $0.20 per million
- DynamoDB: $0.25 per GB/month

**Estimated cost for 10,000 demos/month**: ~$0.50/month

## 📚 Architecture

```
Frontend (Vercel)
    ↓ WSS
WebSocket API Gateway
    ↓ Invoke
WebSocket Lambda
    ├→ Store connections (DynamoDB)
    ├→ Process invoices (Textract)
    └→ Send updates (API Gateway Management API)
```

## 🎉 Success Checklist

After deployment, verify:
- [ ] WebSocket URL in CloudFormation outputs
- [ ] Lambda function exists and has correct handler
- [ ] DynamoDB table created
- [ ] Environment variable set in Vercel
- [ ] Vercel redeployed
- [ ] Test connection in browser console (should show "Connected")
- [ ] Upload invoice in LiveDoc demo
- [ ] Real-time updates appear

## 🆘 Need Help?

### View Deployment Status
```bash
aws cloudformation describe-stacks --stack-name InvoisaicStack-dev
```

### View Lambda Logs (Real-time)
```bash
aws logs tail /aws/lambda/invoisaic-websocket-dev --follow
```

### Delete and Redeploy
```bash
cd infrastructure
cdk destroy
cdk deploy --all
```

---

**Ready to deploy?** Run `.\check-websocket.ps1` first to see if it's already deployed!
