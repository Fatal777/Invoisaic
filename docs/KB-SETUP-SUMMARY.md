# Knowledge Base Setup - Quick Summary

## 🎯 The Problem
You've been getting **403 Forbidden** errors when trying to create a Bedrock Knowledge Base. This happens because:

1. **OpenSearch Serverless** requires explicit data access policies
2. Using an **existing collection** requires manual index creation
3. IAM role needs proper **trust relationship** with `bedrock.amazonaws.com`

## ✅ The Solution
**Use "Quick create" instead of "Use existing vector store"**

This lets AWS automatically:
- Create a new OpenSearch collection
- Configure all permissions correctly
- Create the vector index with proper mappings
- Set up data access policies

## 📋 Step-by-Step Process

### PART A: Pre-Setup (5 minutes)

1. **Sign in as IAM user** (NOT root):
   - Account: `202533497839`
   - User: `invoisaic-admin`
   - Region: `ap-south-1`

2. **Fix IAM Role Trust Policy**:
   - Go to IAM → Roles → `InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI`
   - Trust relationships → Edit
   - Ensure it has:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Principal": {
           "Service": "bedrock.amazonaws.com"
         },
         "Action": "sts:AssumeRole"
       }]
     }
     ```

3. **Verify IAM Role Permissions**:
   - Ensure these policies are attached:
     - `AmazonOpenSearchServiceFullAccess`
     - `AmazonS3ReadOnlyAccess`
     - `AWSLambdaBasicExecutionRole`

4. **Update S3 Bucket Policy**:
   - Bucket: `invoisaic-knowledge-base-202533497839`
   - Permissions → Bucket policy → Add:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [{
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::202533497839:role/InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI"
         },
         "Action": ["s3:GetObject", "s3:ListBucket"],
         "Resource": [
           "arn:aws:s3:::invoisaic-knowledge-base-202533497839",
           "arn:aws:s3:::invoisaic-knowledge-base-202533497839/*"
         ]
       }]
     }
     ```

### PART B: Create Knowledge Base (10 minutes)

1. **Go to Bedrock Console**:
   - https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/knowledge-bases
   - Click "Create knowledge base"

2. **Knowledge Base Details**:
   - Name: `Invoisaic-Compliance-KB`
   - Description: `Tax and compliance regulations for US, Germany, UK, and India`
   - IAM role: Select existing → `InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI`
   - Data source: `Amazon S3`
   - Click "Next"

3. **Configure Data Source**:
   - Name: `ComplianceDocuments`
   - S3 URI: `s3://invoisaic-knowledge-base-202533497839/compliance/`
   - Chunking: Default (300 tokens, 20% overlap)
   - Click "Next"

4. **Select Embeddings**:
   - Model: `Titan Text Embeddings V2`
   - Type: Floating-point
   - Dimensions: 1024
   - Click "Next"

5. **Configure Vector Store** ⚠️ **CRITICAL**:
   - **SELECT**: `Quick create a new vector store - Recommended`
   - **DO NOT SELECT**: `Use an existing vector store`
   - Vector store type: `Amazon OpenSearch Serverless`
   - Click "Next"

6. **Review and Create**:
   - Verify all settings
   - Click "Create Knowledge Base"
   - **Wait 2-5 minutes** (don't refresh)

### PART C: Sync Data (5 minutes)

1. **After KB is Active**:
   - Go to "Data sources" tab
   - Click "ComplianceDocuments"
   - Click "Sync"
   - Wait 3-5 minutes

2. **Verify Sync**:
   - Status: "Sync completed"
   - Documents: 4
   - Chunks: ~50-100

### PART D: Test (2 minutes)

1. **Go to "Test" tab**
2. **Try query**: `What are the GST requirements for India?`
3. **Verify**: Should return relevant GST information

### PART E: Save Configuration (2 minutes)

1. **Copy Knowledge Base ID** (shown at top of page)
2. **Update** `backend/.env.agents`:
   ```env
   KNOWLEDGE_BASE_ID=<your-kb-id>
   ```

## 🚨 Common Issues

### Issue: Role doesn't appear in dropdown
**Fix**: Update trust relationship (Step A2), wait 2 minutes, refresh browser

### Issue: Still getting 403
**Fix**: 
1. Ensure you're using "Quick create" (not existing collection)
2. Wait 2-3 minutes for permissions to propagate
3. Try in incognito browser window

### Issue: Sync fails
**Fix**: Verify S3 bucket policy (Step A4), check files exist in S3

## ✅ Success Checklist

- [ ] Signed in as IAM user (not root)
- [ ] IAM role trust relationship updated
- [ ] IAM role has required permissions
- [ ] S3 bucket policy configured
- [ ] Used "Quick create" for vector store
- [ ] Knowledge Base status: Active
- [ ] Data source synced successfully
- [ ] Test queries return results
- [ ] KB ID saved in .env.agents

## 📖 Full Documentation

See `docs/QUICK-KB-SETUP.md` for complete step-by-step guide with screenshots and troubleshooting.

## 🎉 Next Steps

After successful setup:
1. Integrate KB with Bedrock Agents
2. Test with real invoice queries
3. Monitor usage in CloudWatch
4. Add more compliance documents as needed
