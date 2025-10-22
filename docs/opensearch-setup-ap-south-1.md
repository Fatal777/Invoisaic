# OpenSearch Serverless Collection Setup
## Region: ap-south-1 (Mumbai, India)

---

## Step 1: Upload Documents to S3 (5 minutes)

### Run the upload script:
```powershell
cd scripts
.\upload-knowledge-base.ps1
```

This will:
- Create bucket: `invoisaic-knowledge-base-202533497839`
- Upload 4 compliance documents
- Enable versioning
- Verify uploads

---

## Step 2: Create OpenSearch Serverless Collection (10 minutes)

### Via AWS Console:

1. **Navigate to Amazon OpenSearch Service**
   - Go to https://ap-south-1.console.aws.amazon.com/aos/home?region=ap-south-1
   - Click "Collections" in the left sidebar
   - Click "Create collection"

2. **Collection Settings:**
   ```
   Collection name: invoisaic-knowledge-base
   Collection type: Vector search
   Description: Vector search for invoice compliance documents
   ```

3. **Network Settings:**
   ```
   Network access type: Public
   ```
   ⚠️ For production, use VPC access

4. **Encryption:**
   ```
   Encryption: AWS owned key
   ```

5. **Data Access Policy:**
   Click "Create" and use this JSON:
   ```json
   {
     "Rules": [
       {
         "ResourceType": "collection",
         "Resource": [
           "collection/invoisaic-knowledge-base"
         ],
         "Permission": [
           "aoss:CreateCollectionItems",
           "aoss:UpdateCollectionItems",
           "aoss:DescribeCollectionItems"
         ]
       },
       {
         "ResourceType": "index",
         "Resource": [
           "index/invoisaic-knowledge-base/*"
         ],
         "Permission": [
           "aoss:CreateIndex",
           "aoss:DescribeIndex",
           "aoss:ReadDocument",
           "aoss:WriteDocument",
           "aoss:UpdateIndex",
           "aoss:DeleteIndex"
         ]
       }
     ],
     "Principal": [
       "arn:aws:iam::202533497839:role/BedrockKnowledgeBaseRole"
     ]
   }
   ```

6. **Click "Create"**
   - Wait 5-10 minutes for collection to become **Active**
   - Collection status will show in the dashboard

7. **Note the Collection Endpoint:**
   - Format: `xxxxx.ap-south-1.aoss.amazonaws.com`
   - You'll need this for Knowledge Base creation

---

## Step 3: Create IAM Role for Knowledge Base (5 minutes)

### Via AWS Console:

1. **Go to IAM → Roles → Create role**
   - Trusted entity type: AWS service
   - Service: Bedrock
   - Use case: Bedrock - Knowledge Base

2. **Role name:** `BedrockKnowledgeBaseRole`

3. **Add inline policy** - `KnowledgeBasePolicy`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "aoss:APIAccessAll"
         ],
         "Resource": "arn:aws:aoss:ap-south-1:202533497839:collection/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::invoisaic-knowledge-base-202533497839",
           "arn:aws:s3:::invoisaic-knowledge-base-202533497839/*"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel"
         ],
         "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/amazon.titan-embed-text-v1"
       }
     ]
   }
   ```

4. **Create the role**

---

## Step 4: Create Bedrock Knowledge Base (15 minutes)

### Via AWS Console:

1. **Go to Amazon Bedrock → Knowledge bases**
   - Navigate to: https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/knowledge-bases
   - Click "Create knowledge base"

2. **Knowledge base details:**
   ```
   Name: Invoisaic-Compliance-KB
   Description: Tax and compliance regulations for US, Germany, UK, and India
   IAM role: BedrockKnowledgeBaseRole (select existing)
   ```

3. **Data source configuration:**
   ```
   Data source name: ComplianceDocuments
   S3 URI: s3://invoisaic-knowledge-base-202533497839/compliance/
   ```

4. **Chunking strategy:**
   ```
   Chunking strategy: Default chunking
   Max tokens: 300
   Overlap percentage: 20%
   ```

5. **Embeddings model:**
   ```
   Embeddings model: Titan Embeddings G1 - Text
   Dimensions: 1536
   ```

6. **Vector database:**
   ```
   Vector database: Amazon OpenSearch Serverless
   Collection: invoisaic-knowledge-base (select from dropdown)
   Vector index name: invoisaic-compliance-index
   Vector field name: embedding
   Text field: text
   Metadata field: metadata
   ```

7. **Create knowledge base**
   - Wait 2-3 minutes for creation

8. **Sync data source:**
   - Go to Data sources tab
   - Click on "ComplianceDocuments"
   - Click "Sync"
   - Wait 3-5 minutes for sync to complete

9. **Test Knowledge Base:**
   - Go to "Test" tab
   - Try query: "What are US invoice requirements?"
   - Verify you get relevant results

10. **Save Knowledge Base ID:**
    - Copy the KB ID (format: `KB123ABC456`)
    - Update in `/backend/.env.agents`:
      ```
      KNOWLEDGE_BASE_ID=your-actual-kb-id
      ```

---

## Verification Checklist

- [ ] S3 bucket created: `invoisaic-knowledge-base-202533497839`
- [ ] 4 compliance documents uploaded to S3
- [ ] OpenSearch collection Active status
- [ ] Collection endpoint noted
- [ ] IAM role created: `BedrockKnowledgeBaseRole`
- [ ] Knowledge Base created successfully
- [ ] Data source synced (100% complete)
- [ ] Test query returns results
- [ ] Knowledge Base ID saved to `.env.agents`

---

## Expected Timeline

| Task | Duration | Status |
|------|----------|--------|
| Upload to S3 | 5 min | ⏳ |
| Create OpenSearch | 10 min | ⏳ |
| Create IAM Role | 5 min | ⏳ |
| Create Knowledge Base | 15 min | ⏳ |
| **Total** | **35 min** | |

---

## Troubleshooting

### OpenSearch Collection Not Active
- Wait 10-15 minutes, collections take time
- Check CloudWatch logs for errors
- Verify region is ap-south-1

### Knowledge Base Sync Failing
- Verify S3 bucket permissions
- Check IAM role has correct policies
- Ensure embeddings model is available in ap-south-1

### Test Queries Return No Results
- Check sync completed 100%
- Verify vector index created in OpenSearch
- Try re-syncing data source

---

## AWS CLI Commands (Alternative)

If you prefer CLI:

```bash
# Set region
export AWS_REGION=ap-south-1

# Upload to S3
aws s3 sync knowledge-base/documents/ s3://invoisaic-knowledge-base-202533497839/compliance/ --region ap-south-1

# List uploaded files
aws s3 ls s3://invoisaic-knowledge-base-202533497839/compliance/ --region ap-south-1
```

---

## Cost Estimate

**One-time setup:**
- S3 storage: ~$0.02/month (< 1 GB)
- Data transfer: Free (within region)

**Running costs:**
- OpenSearch Serverless: ~$100-150/month
- Knowledge Base: ~$0 (pay per query)
- Embeddings: ~$0.10 per sync

**Total monthly: ~$100-150 if left running**

💡 **Tip:** Delete OpenSearch collection after demo to save costs!

---

## Next Steps

After completing this setup:
1. ✅ Proceed to create Bedrock Agents
2. ✅ Link Compliance Agent to this Knowledge Base
3. ✅ Test agent queries against KB

See: `/docs/bedrock-setup-guide.md` for agent creation steps.

---

**Region:** ap-south-1 (Mumbai)  
**Account:** 202533497839  
**Last Updated:** Oct 21, 2025
