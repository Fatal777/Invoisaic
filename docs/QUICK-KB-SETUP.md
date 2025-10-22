# Complete Bedrock Knowledge Base Setup Guide

## 🎯 Problem Summary
The 403 Forbidden error occurs because:
1. OpenSearch Serverless requires explicit data access policies
2. IAM role needs proper trust relationship with bedrock.amazonaws.com
3. The existing collection approach requires manual index creation
4. **Solution: Use "Quick create" to let AWS handle everything automatically**

---

## ✅ Prerequisites (Already Done)
- [x] S3 bucket created: `invoisaic-knowledge-base-202533497839`
- [x] 4 compliance documents uploaded to S3
- [x] IAM user: `invoisaic-admin` (with AdministratorAccess)
- [x] IAM role: `InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI`

---

## 🚀 Complete Setup Process (20 minutes)

### PART A: Pre-Setup Checks

#### Step A1: Sign In as IAM User (NOT Root)
1. **Sign out** if logged in as root user
2. **Go to**: https://console.aws.amazon.com/
3. **Sign in as IAM user**:
   - Account ID: `202533497839`
   - IAM username: `invoisaic-admin`
   - Password: (your IAM user password)
4. **Verify region**: Top-right corner should show `ap-south-1` (Mumbai)

> ⚠️ **CRITICAL**: Bedrock Knowledge Base creation does NOT work with root user!

---

#### Step A2: Verify IAM Role Trust Relationship
1. **Go to IAM Console**: https://console.aws.amazon.com/iam/
2. **Click "Roles"** in left sidebar
3. **Search for**: `InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI`
4. **Click on the role**
5. **Go to "Trust relationships" tab**
6. **Click "Edit trust policy"**
7. **Ensure it contains**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "bedrock.amazonaws.com"
         },
         "Action": "sts:AssumeRole"
       }
     ]
   }
   ```
8. **If different, replace with above** and click "Update policy"

---

#### Step A3: Verify IAM Role Permissions
1. **Stay on the same role page**
2. **Go to "Permissions" tab**
3. **Verify these policies are attached**:
   - `AmazonOpenSearchServiceFullAccess`
   - `AmazonS3ReadOnlyAccess` (or `AmazonS3FullAccess`)
   - `AWSLambdaBasicExecutionRole`
4. **If missing, click "Add permissions" → "Attach policies"**
5. **Search and select the missing policies**
6. **Click "Attach policies"**

---

#### Step A4: Verify S3 Bucket Access
1. **Go to S3 Console**: https://s3.console.aws.amazon.com/s3/buckets
2. **Click on**: `invoisaic-knowledge-base-202533497839`
3. **Go to "Permissions" tab**
4. **Click "Edit" under "Bucket policy"**
5. **Ensure this policy exists** (add if missing):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": {
                   "AWS": "arn:aws:iam::202533497839:role/InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI"
               },
               "Action": [
                   "s3:GetObject",
                   "s3:ListBucket"
               ],
               "Resource": [
                   "arn:aws:s3:::invoisaic-knowledge-base-202533497839",
                   "arn:aws:s3:::invoisaic-knowledge-base-202533497839/*"
               ]
           }
       ]
   }
   ```
6. **Click "Save changes"**

---

### PART B: Create Knowledge Base

#### Step B1: Navigate to Bedrock
1. **Go to**: https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/knowledge-bases
2. **Click "Create knowledge base"** (orange button)

---

#### Step B2: Provide Knowledge Base Details

**You will see these fields:**

1. **Knowledge Base name**:
   ```
   Invoisaic-Compliance-KB
   ```

2. **Knowledge Base description** (optional):
   ```
   Tax and compliance regulations for US, Germany, UK, and India
   ```

3. **IAM permissions** - Runtime role:
   - **Select**: `Use an existing service role`
   - **From dropdown, choose**: `InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI`
   - ⚠️ **If role doesn't appear**: Go back to Step A2 and fix trust relationship

4. **Choose data source type**:
   - **Select**: `Amazon S3`

5. **Tags** (optional):
   - **Leave empty** or add if needed

6. **Log deliveries** (optional):
   - **Leave empty** (skip for now)

7. **Click "Next"** (bottom right)

---

#### Step B3: Configure Data Source

**You will see these fields:**

1. **Data source name**:
   ```
   ComplianceDocuments
   ```

2. **S3 URI**:
   ```
   s3://invoisaic-knowledge-base-202533497839/compliance/
   ```
   - **Click "Browse S3"** if you want to verify the path
   - Should show 4 files: us-tax, germany-vat, uk-vat, india-gst

3. **Chunking strategy**:
   - **Select**: `Default chunking`
   - **Max tokens**: `300` (default)
   - **Overlap percentage**: `20%` (default)

4. **Parsing strategy**:
   - **Leave as**: `Default` (Foundation model parsing)

5. **Data deletion policy**:
   - **Leave as**: `DELETE` (default)

6. **Click "Next"**

---

#### Step B4: Select Embeddings Model

**You will see these fields:**

1. **Embeddings model**:
   - **Select**: `Titan Text Embeddings V2`
   - **Pricing**: On-demand

2. **Additional configurations**:
   - **Embeddings type**: `Floating-point vector embeddings` (default)
   - **Vector dimensions**: `1024` (default for Titan V2)

3. **Click "Next"**

---

#### Step B5: Configure Vector Store (CRITICAL STEP)

**You will see these options:**

1. **Vector store creation method**:
   - ✅ **SELECT**: `Quick create a new vector store - Recommended`
   - ❌ **DO NOT SELECT**: `Use an existing vector store`
   
   > 🎯 **WHY QUICK CREATE?**
   > - AWS automatically creates the collection with correct settings
   > - No manual index creation needed
   > - No 403 permission errors
   > - Proper access policies configured automatically

2. **Vector store type**:
   - **Select**: `Amazon OpenSearch Serverless`

3. **Additional configurations** (optional):
   - **Enable redundancy**: Leave unchecked (for dev/testing)
   - **KMS key**: Leave empty (use AWS managed key)

4. **Click "Next"**

---

#### Step B6: Review and Create

**You will see a summary page:**

1. **Review all settings**:
   - Knowledge Base name: `Invoisaic-Compliance-KB`
   - IAM role: `InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI`
   - Data source: S3 bucket path
   - Embeddings: Titan Text Embeddings V2
   - Vector store: Quick create (new collection)

2. **Click "Create Knowledge Base"** (orange button)

3. **Wait 2-5 minutes**:
   - Status will show: "Creating"
   - AWS is creating the OpenSearch collection
   - AWS is configuring permissions
   - **DO NOT REFRESH** or navigate away

4. **Success indicators**:
   - Status changes to: "Active"
   - You'll see a Knowledge Base ID (format: `XXXXXXXXXX`)

---

### PART C: Sync Data Source

#### Step C1: Navigate to Data Sources
1. **After KB creation completes**, you'll be on the Knowledge Base details page
2. **Click "Data sources" tab** (top of page)
3. **You should see**: `ComplianceDocuments` with status "Available"

---

#### Step C2: Start Data Sync
1. **Click on "ComplianceDocuments"** (the data source name)
2. **Click "Sync" button** (top right, orange button)
3. **Confirm sync** if prompted
4. **Wait 3-5 minutes**:
   - Status will show: "Syncing"
   - AWS is reading files from S3
   - AWS is creating embeddings
   - AWS is storing vectors in OpenSearch

---

#### Step C3: Verify Sync Completion
1. **Wait for status to change to**: "Sync completed"
2. **Check sync details**:
   - Documents processed: Should show 4
   - Chunks created: Should show ~50-100 (varies by document size)
   - Errors: Should be 0

3. **If sync fails**:
   - Check S3 bucket permissions (Step A4)
   - Verify files exist in S3
   - Check CloudWatch logs for errors

---

### PART D: Test Knowledge Base

#### Step D1: Navigate to Test Console
1. **Click "Test" tab** (top of page, next to "Data sources")
2. **You'll see a chat interface**

---

#### Step D2: Run Test Queries

**Test Query 1 - India GST:**
```
What are the GST requirements for India?
```
**Expected Response:**
- Should mention GST rates (5%, 12%, 18%, 28%)
- E-invoicing requirements
- GSTIN format
- Recent 2024-2025 updates

---

**Test Query 2 - Germany VAT:**
```
What is the VAT rate in Germany?
```
**Expected Response:**
- Standard rate: 19%
- Reduced rate: 7%
- Invoice requirements

---

**Test Query 3 - US Tax:**
```
What invoice information is required in the US?
```
**Expected Response:**
- Seller information
- Invoice number and date
- Description of goods/services
- Amounts and taxes

---

**Test Query 4 - UK VAT:**
```
What are the UK VAT registration requirements?
```
**Expected Response:**
- VAT threshold
- Registration process
- Invoice requirements

---

#### Step D3: Verify Source Attribution
1. **Each response should show "Sources"** at the bottom
2. **Click "Show sources"** to see which documents were used
3. **Verify**: Sources should match the relevant compliance document

---

### PART E: Save Configuration

#### Step E1: Copy Knowledge Base ID
1. **At the top of the KB details page**, you'll see:
   ```
   Knowledge Base ID: XXXXXXXXXX
   ```
2. **Copy this ID** (10 characters)

---

#### Step E2: Update Environment Variables
1. **Open**: `backend/.env.agents`
2. **Update these values**:
   ```env
   # Knowledge Base ID (Replace with actual KB ID)
   KNOWLEDGE_BASE_ID=XXXXXXXXXX
   
   # OpenSearch Collection (New collection created by Quick Create)
   OPENSEARCH_COLLECTION_NAME=bedrock-knowledge-base-XXXXXX
   OPENSEARCH_COLLECTION_ENDPOINT=<check-opensearch-console>
   OPENSEARCH_COLLECTION_ARN=<check-opensearch-console>
   ```

---

#### Step E3: Get OpenSearch Collection Details
1. **Go to OpenSearch Serverless Console**: https://ap-south-1.console.aws.amazon.com/aos/home?region=ap-south-1#opensearch/collections
2. **Find the new collection**: `bedrock-knowledge-base-XXXXXX`
3. **Click on it** to see details
4. **Copy**:
   - Collection name
   - Endpoint (without https://)
   - ARN

5. **Update `.env.agents`** with these values

---

### PART F: Cleanup (Optional)

#### Delete Old Collections
If you have old/unused collections:
1. **Go to OpenSearch Serverless Console**
2. **Select old collections** (e.g., `invoisaic-kb-dev`, `bedrock-knowledge-base-ty3dtl`)
3. **Click "Delete"**
4. **Confirm deletion**

> ⚠️ **Only delete if you're sure you don't need them!**

---

## 📋 Quick Reference

### Configuration Summary

**AWS Account:**
- Account ID: `202533497839`
- Region: `ap-south-1` (Mumbai)
- IAM User: `invoisaic-admin`

**S3 Bucket:**
```
s3://invoisaic-knowledge-base-202533497839/compliance/
```

**IAM Role:**
```
InvoisaicStack-dev-KnowledgeBaseKnowledgeBaseRoleDB-Lx1bgvCwuUjI
```

**Knowledge Base:**
- Name: `Invoisaic-Compliance-KB`
- Embeddings: Titan Text Embeddings V2 (1024 dimensions)
- Vector Store: OpenSearch Serverless (Quick create)

**Documents:**
- `us-tax-compliance.txt`
- `germany-vat-compliance.txt`
- `uk-vat-compliance.txt`
- `india-gst-compliance.txt`

---

## 🚨 Troubleshooting

### Issue: 403 Forbidden Error
**Cause**: Missing OpenSearch access policy or incorrect trust relationship

**Solution**:
1. Use "Quick create" instead of existing collection
2. Verify IAM role trust policy (Step A2)
3. Wait 2-3 minutes for permissions to propagate
4. Try in incognito browser window

---

### Issue: Role Not Appearing in Dropdown
**Cause**: Trust relationship doesn't include bedrock.amazonaws.com

**Solution**:
1. Go to IAM → Roles
2. Edit trust relationship (Step A2)
3. Add bedrock.amazonaws.com as trusted service
4. Wait 2 minutes and refresh Bedrock console

---

### Issue: Sync Fails
**Cause**: S3 permissions or file format issues

**Solution**:
1. Verify S3 bucket policy (Step A4)
2. Check files exist in S3
3. Ensure files are .txt format
4. Check CloudWatch logs for detailed errors

---

### Issue: No Results in Test Queries
**Cause**: Sync not completed or embeddings not created

**Solution**:
1. Verify sync status is "Completed"
2. Check number of chunks created (should be > 0)
3. Wait 5 minutes after sync completes
4. Try more specific queries

---

## ✅ Success Checklist

- [ ] Signed in as IAM user (not root)
- [ ] IAM role trust relationship updated
- [ ] IAM role has required permissions
- [ ] S3 bucket policy configured
- [ ] Knowledge Base created successfully
- [ ] Data source synced (4 documents, ~50-100 chunks)
- [ ] Test queries return relevant results
- [ ] Knowledge Base ID saved in `.env.agents`
- [ ] OpenSearch collection details saved

---

## 🎉 Next Steps

After successful setup:
1. **Integrate with Bedrock Agents**: Use the Knowledge Base ID in your agent configuration
2. **Test with Real Queries**: Try invoice-specific questions
3. **Monitor Usage**: Check CloudWatch for API calls and costs
4. **Update Documents**: Upload new compliance docs as needed
5. **Scale**: Add more data sources or increase chunking parameters

---

## 📞 Support

If you encounter issues not covered here:
1. **Check CloudTrail**: Detailed API error logs
2. **Check CloudWatch**: Application and sync logs
3. **AWS Support**: Open a support ticket
4. **Documentation**: https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html
