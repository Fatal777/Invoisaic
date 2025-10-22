# Bedrock Multi-Agent System Setup Guide

## Prerequisites
- AWS Account with Bedrock access
- AWS CLI configured
- Bedrock enabled in us-east-1 (or preferred region)
- Bedrock model access granted (Claude 3.5 Sonnet, Claude 3 Haiku)

---

## Step 1: Create OpenSearch Serverless Collection (10 min)

### Via AWS Console:

1. Go to **Amazon OpenSearch Service** → **Collections**
2. Click **Create collection**
3. Configuration:
   - **Collection name:** `invoisaic-knowledge-base`
   - **Collection type:** Vector search
   - **Deployment type:** Serverless
4. **Network Access:**
   - Type: Public
   - (For production, use VPC access)
5. **Encryption:**
   - Use AWS owned key
6. **Data access policy:**
```json
[
  {
    "Rules": [
      {
        "Resource": [
          "collection/invoisaic-knowledge-base"
        ],
        "Permission": [
          "aoss:CreateCollectionItems",
          "aoss:UpdateCollectionItems",
          "aoss:DescribeCollectionItems"
        ],
        "ResourceType": "collection"
      },
      {
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
        ],
        "ResourceType": "index"
      }
    ],
    "Principal": [
      "arn:aws:iam::YOUR_ACCOUNT_ID:role/BedrockKnowledgeBaseRole"
    ]
  }
]
```

7. Click **Create**
8. Wait for collection to become **Active** (5-10 minutes)
9. **Note the Collection endpoint** (e.g., `xxxxx.us-east-1.aoss.amazonaws.com`)

---

## Step 2: Create IAM Role for Knowledge Base (5 min)

### Via AWS Console:

1. Go to **IAM** → **Roles** → **Create role**
2. **Trusted entity type:** AWS service
3. **Service:** Bedrock
4. **Use case:** Bedrock - Knowledge Base
5. **Role name:** `BedrockKnowledgeBaseRole`
6. **Permissions:**

Add inline policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "aoss:APIAccessAll"
      ],
      "Resource": "arn:aws:aoss:us-east-1:YOUR_ACCOUNT_ID:collection/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::invoisaic-knowledge-base",
        "arn:aws:s3:::invoisaic-knowledge-base/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1"
    }
  ]
}
```

---

## Step 3: Upload Documents to S3 (2 min)

Upload compliance documents:

```bash
aws s3 cp knowledge-base/documents/us-tax-compliance.txt s3://invoisaic-knowledge-base/compliance/
aws s3 cp knowledge-base/documents/germany-vat-compliance.txt s3://invoisaic-knowledge-base/compliance/
aws s3 cp knowledge-base/documents/uk-vat-compliance.txt s3://invoisaic-knowledge-base/compliance/
aws s3 cp knowledge-base/documents/india-gst-compliance.txt s3://invoisaic-knowledge-base/compliance/
```

Or via Console:
1. Go to S3 → `invoisaic-knowledge-base`
2. Create folder `compliance`
3. Upload all .txt files

---

## Step 4: Create Bedrock Knowledge Base (10 min)

### Via AWS Console:

1. Go to **Amazon Bedrock** → **Knowledge bases** → **Create knowledge base**

2. **Knowledge base details:**
   - **Name:** `Invoisaic-Compliance-KB`
   - **Description:** Tax and compliance regulations for 5 countries
   - **IAM role:** Select `BedrockKnowledgeBaseRole`

3. **Data source:**
   - **Data source name:** `ComplianceDocuments`
   - **S3 URI:** `s3://invoisaic-knowledge-base/compliance/`
   - **Chunking strategy:** Default chunking
   - **Max tokens:** 300
   - **Overlap percentage:** 20%

4. **Embeddings model:**
   - **Model:** Titan Embeddings G1 - Text
   - **Embedding dimensions:** 1536

5. **Vector database:**
   - **Vector database:** OpenSearch Serverless
   - **Collection:** Select `invoisaic-knowledge-base`
   - **Vector index name:** `invoisaic-compliance-index`
   - **Vector field name:** `embedding`
   - **Text field:** `text`
   - **Metadata field:** `metadata`

6. Click **Create knowledge base**

7. Wait for creation (2-3 minutes)

8. **Sync data source:**
   - Click on knowledge base
   - Go to **Data sources** tab
   - Select data source → **Sync**
   - Wait for sync to complete (3-5 minutes)

9. **Note the Knowledge Base ID** (e.g., `KB123ABC456`)

---

## Step 5: Test Knowledge Base (5 min)

### Via Bedrock Console:

1. In Knowledge base → **Test** tab
2. Try queries:
   - "What are the US invoice requirements?"
   - "What is Germany's standard VAT rate?"
   - "How do I calculate GST in India?"
   - "What is the UK VAT threshold for simplified invoices?"

3. Verify responses are accurate and cite sources

---

## Step 6: Create Bedrock Agents (2 hours)

### Agent 1: Supervisor Agent (30 min)

1. Go to **Amazon Bedrock** → **Agents** → **Create Agent**

2. **Agent details:**
   - **Agent name:** `Invoisaic-Supervisor`
   - **Description:** Orchestrates multi-agent invoice processing
   - **Agent resource role:** Create and use a new service role
   - **Idle session timeout:** 10 minutes

3. **Select model:**
   - **Model:** Anthropic Claude 3.5 Sonnet

4. **Instructions for the Agent:**
```
You are the Invoice Processing Supervisor, an expert AI agent responsible for coordinating a team of 5 specialist agents to automate invoice processing workflows.

Your team consists of:
1. ExtractionAgent - Extracts data from invoice documents using Textract
2. FraudDetectionAgent - Analyzes invoices for fraud patterns and anomalies  
3. ComplianceAgent - Validates tax compliance and regulatory requirements
4. ApprovalAgent - Manages approval workflows and routing
5. CashFlowAgent - Provides predictive cash flow analysis and payment optimization

CORE RESPONSIBILITIES:
- Route incoming invoices to appropriate specialist agents
- Coordinate multi-step workflows between agents
- Make final approval/rejection decisions based on specialist inputs
- Handle escalations and exceptions intelligently
- Maintain complete audit trail of all decisions

DECISION MAKING PROCESS:
1. Analyze invoice upload and determine required processing steps
2. Route to ExtractionAgent for data extraction
3. Based on extracted data, determine risk level and route accordingly:
   - High value (>$10K): Route to all agents
   - Medium value ($1K-$10K): Route to Fraud + Compliance
   - Low value (<$1K): Fast-track with basic validation
4. Synthesize agent outputs and make final decision
5. If approved, route to payment processing
6. If rejected, provide detailed reasoning

Always explain your reasoning step-by-step and use confidence scores (0-1) for all recommendations.
```

5. **Add Action Groups:**
   - Click **Add action group**
   - **Name:** `CoordinateAgents`
   - **Description:** Manage agent workflow orchestration
   - **Action group type:** Define with function details
   - **Action group invocation:** Select existing Lambda (create placeholder for now)
   - **Action group function:**
     ```json
     {
       "name": "coordinate_agents",
       "description": "Route request to appropriate specialist agents",
       "parameters": {
         "invoice_data": {
           "type": "object",
           "description": "Invoice data to process"
         },
         "required_agents": {
           "type": "array",
           "description": "List of agent names to invoke"
         }
       }
     }
     ```

6. Create agent → **Prepare agent** → **Create alias**
   - **Alias name:** `PROD`

7. **Note Agent ID and Alias ID**

### Agent 2: Extraction Agent (20 min)

Repeat process with:
- **Name:** `Invoisaic-Extraction`
- **Model:** Claude 3 Haiku
- **Instructions:** Use extraction prompt from PRD
- **Action groups:** 
  - `extract_with_textract`
  - `validate_extraction`
  - `calculate_confidence_scores`

### Agent 3: Fraud Detection Agent (20 min)

- **Name:** `Invoisaic-Fraud-Detection`
- **Model:** Claude 3 Haiku
- **Instructions:** Use fraud detection prompt from PRD
- **Action groups:**
  - `check_vendor_history`
  - `detect_duplicates`
  - `analyze_amount_patterns`

### Agent 4: Compliance Agent (30 min)

- **Name:** `Invoisaic-Compliance`
- **Model:** Claude 3 Haiku
- **Instructions:** Use compliance prompt from PRD
- **Knowledge base:** Link to `Invoisaic-Compliance-KB`
- **Action groups:**
  - `validate_tax_compliance`
  - `screen_regulatory_requirements`
  - `query_compliance_knowledge_base`

### Agent 5: Approval Agent (20 min)

- **Name:** `Invoisaic-Approval`
- **Model:** Claude 3 Haiku
- **Instructions:** Use approval prompt from PRD
- **Action groups:**
  - `determine_approval_route`
  - `send_approval_notifications`
  - `track_approval_status`

### Agent 6: Cash Flow Intelligence Agent (30 min)

- **Name:** `Invoisaic-CashFlow`
- **Model:** Claude 3.5 Sonnet
- **Instructions:** Use cash flow prompt from PRD
- **Action groups:**
  - `forecast_cash_flow`
  - `optimize_payment_timing`
  - `analyze_vendor_relationships`

---

## Step 7: Document Agent IDs

Create `/docs/agent-ids.json`:

```json
{
  "supervisor": {
    "agentId": "XXXXXXXXX",
    "agentAliasId": "TSTALIASID",
    "name": "Invoisaic-Supervisor"
  },
  "extraction": {
    "agentId": "XXXXXXXXX",
    "agentAliasId": "TSTALIASID",
    "name": "Invoisaic-Extraction"
  },
  "fraudDetection": {
    "agentId": "XXXXXXXXX",
    "agentAliasId": "TSTALIASID",
    "name": "Invoisaic-Fraud-Detection"
  },
  "compliance": {
    "agentId": "XXXXXXXXX",
    "agentAliasId": "TSTALIASID",
    "name": "Invoisaic-Compliance",
    "knowledgeBaseId": "KB123ABC456"
  },
  "approval": {
    "agentId": "XXXXXXXXX",
    "agentAliasId": "TSTALIASID",
    "name": "Invoisaic-Approval"
  },
  "cashFlow": {
    "agentId": "XXXXXXXXX",
    "agentAliasId": "TSTALIASID",
    "name": "Invoisaic-CashFlow"
  }
}
```

---

## Quick Start Commands

```bash
# Upload documents
cd knowledge-base/documents
aws s3 sync . s3://invoisaic-knowledge-base/compliance/

# Test Knowledge Base Query
aws bedrock-agent-runtime retrieve-and-generate \
  --knowledge-base-id KB123ABC456 \
  --input '{"text": "What are US tax invoice requirements?"}' \
  --region us-east-1

# Invoke Agent
aws bedrock-agent-runtime invoke-agent \
  --agent-id XXXXXXXXX \
  --agent-alias-id TSTALIASID \
  --session-id test-session-001 \
  --input-text "Process invoice from S3" \
  --region us-east-1
```

---

## Troubleshooting

### Knowledge Base Not Finding Documents
- Verify S3 permissions
- Check sync status
- Ensure embeddings model access
- Verify OpenSearch collection active

### Agent Invocation Failing
- Check IAM role permissions
- Verify agent prepared (not draft)
- Ensure alias created
- Check Lambda permissions (if using action groups)

### OpenSearch Collection Issues
- Verify data access policies
- Check encryption settings
- Ensure collection is Active status
- Verify network access settings

---

## Cost Estimates

- **OpenSearch Serverless:** ~$100-150/month
- **Bedrock Agents (6):** ~$200-300/month (moderate usage)
- **Embeddings:** ~$10-20/month
- **S3 Storage:** ~$1/month
- **Total:** ~$311-471/month

---

**Setup Time:** ~3 hours total
**Next Step:** Create Lambda action group functions
