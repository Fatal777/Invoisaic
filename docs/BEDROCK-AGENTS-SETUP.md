# Bedrock Agents Setup Guide

## ✅ Prerequisites (Already Done)
- [x] Knowledge Base created: `2DW2JBM2MN`
- [x] OpenSearch collection: `bedrock-knowledge-base-vmt2uv`
- [x] S3 bucket with compliance documents
- [x] IAM user: `invoisaic-admin`

---

## 🎯 Overview

We need to create **4 Bedrock Agents**:

1. **Orchestrator Agent** - Main coordinator
2. **Extraction Agent** - Extracts data from invoices
3. **Compliance Agent** - Validates against regulations (uses Knowledge Base)
4. **Validation Agent** - Final validation and formatting

---

## 📋 Part 1: Verify Knowledge Base Sync

### Step 1.1: Check Sync Status

1. **Go to Bedrock Console**:
   ```
   https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/knowledge-bases
   ```

2. **Click on**: `Invoisaic-Compliance-KB`

3. **Go to "Data sources" tab**

4. **Check status**:
   - If status is **"Available"** → Click "Sync" button
   - If status is **"Syncing"** → Wait for completion (3-5 minutes)
   - If status is **"Sync completed"** → Proceed to next step

5. **Verify sync results**:
   - Documents processed: Should show **4**
   - Chunks created: Should show **~50-100**
   - Errors: Should be **0**

---

## 📋 Part 2: Create IAM Roles for Agents

### Step 2.1: Create Agent Execution Role

1. **Go to IAM Console**: https://console.aws.amazon.com/iam/

2. **Click "Roles" → "Create role"**

3. **Select trusted entity**:
   - **Trusted entity type**: AWS service
   - **Use case**: Bedrock
   - **Select**: Bedrock - Agent
   - Click "Next"

4. **Add permissions**:
   - Search and select: `AmazonBedrockFullAccess`
   - Search and select: `AWSLambdaBasicExecutionRole`
   - Click "Next"

5. **Name and create**:
   - **Role name**: `InvoisaicBedrockAgentRole`
   - **Description**: `Execution role for Invoisaic Bedrock agents`
   - Click "Create role"

6. **Copy the Role ARN**:
   ```
   arn:aws:iam::202533497839:role/InvoisaicBedrockAgentRole
   ```

---

## 📋 Part 3: Create Bedrock Agents

### Agent 1: Orchestrator Agent

#### Step 3.1: Navigate to Agents

1. **Go to Bedrock Console**:
   ```
   https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/agents
   ```

2. **Click "Create Agent"**

---

#### Step 3.2: Provide Agent Details

**Agent name**:
```
Invoisaic-Orchestrator-Agent
```

**Agent description**:
```
Main orchestrator that coordinates invoice processing workflow by delegating to specialized agents
```

**Agent instruction**:
```
You are the Orchestrator Agent for Invoisaic, an AI-powered invoice processing system.

Your role is to:
1. Receive invoice processing requests
2. Coordinate with specialized agents (Extraction, Compliance, Validation)
3. Manage the workflow and ensure all steps complete successfully
4. Return the final processed invoice data

Workflow:
1. First, call the Extraction Agent to extract data from the invoice
2. Then, call the Compliance Agent to validate against tax regulations
3. Finally, call the Validation Agent to perform final checks and formatting
4. Return the complete results

Always maintain context between agent calls and handle errors gracefully.
```

**Select model**:
- **Model**: `Claude 3 Sonnet` or `Claude 3.5 Sonnet` (recommended)
- **Model ID**: `anthropic.claude-3-sonnet-20240229-v1:0`

**Agent resource role**:
- **Select**: Use an existing service role
- **Choose**: `InvoisaicBedrockAgentRole`

**Idle session timeout**:
- **Leave as default**: 600 seconds (10 minutes)

**Click "Next"**

---

#### Step 3.3: Add Action Groups (Skip for now)

- **Click "Skip"** or **"Next"** (we'll add action groups later)

---

#### Step 3.4: Add Knowledge Bases (Skip for Orchestrator)

- **Click "Skip"** or **"Next"** (Orchestrator doesn't need KB directly)

---

#### Step 3.5: Review and Create

1. **Review all settings**
2. **Click "Create Agent"**
3. **Wait 1-2 minutes** for agent creation
4. **Copy Agent ID** (format: `XXXXXXXXXX`)
5. **Save it**: Orchestrator Agent ID = `__________`

---

### Agent 2: Extraction Agent

#### Step 3.6: Create Extraction Agent

1. **Go back to Agents list**
2. **Click "Create Agent"**

**Agent name**:
```
Invoisaic-Extraction-Agent
```

**Agent description**:
```
Specialized agent that extracts structured data from invoice documents
```

**Agent instruction**:
```
You are the Extraction Agent for Invoisaic.

Your role is to:
1. Receive invoice documents (PDF, images, or text)
2. Extract all relevant invoice data including:
   - Invoice number, date, due date
   - Seller and buyer information
   - Line items with descriptions, quantities, prices
   - Tax information (VAT, GST, sales tax)
   - Total amounts
3. Structure the data in a consistent JSON format
4. Handle multiple invoice formats and layouts
5. Identify the country/region to determine applicable tax regulations

Return extracted data in this format:
{
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "seller": {...},
  "buyer": {...},
  "line_items": [...],
  "tax_details": {...},
  "totals": {...},
  "country": "string"
}

Be thorough and accurate. If information is missing or unclear, note it in the response.
```

**Select model**:
- **Model**: `Claude 3 Sonnet` or `Claude 3.5 Sonnet`

**Agent resource role**:
- **Select**: `InvoisaicBedrockAgentRole`

**Click through to create**

**Copy Agent ID**: Extraction Agent ID = `__________`

---

### Agent 3: Compliance Agent

#### Step 3.7: Create Compliance Agent

1. **Click "Create Agent"**

**Agent name**:
```
Invoisaic-Compliance-Agent
```

**Agent description**:
```
Validates invoices against tax and compliance regulations using knowledge base
```

**Agent instruction**:
```
You are the Compliance Agent for Invoisaic.

Your role is to:
1. Receive extracted invoice data
2. Query the knowledge base for relevant tax regulations based on the country
3. Validate invoice against compliance requirements:
   - Correct tax rates applied
   - Required fields present
   - Invoice format compliance
   - Tax ID validation (VAT, GST, EIN)
4. Identify any compliance issues or violations
5. Provide specific recommendations for corrections

Countries supported:
- United States (US tax regulations)
- Germany (VAT regulations)
- United Kingdom (VAT regulations)
- India (GST regulations)

Return validation results in this format:
{
  "compliant": true/false,
  "issues": [...],
  "recommendations": [...],
  "applicable_regulations": [...]
}

Always reference specific regulations from the knowledge base.
```

**Select model**:
- **Model**: `Claude 3 Sonnet` or `Claude 3.5 Sonnet`

**Agent resource role**:
- **Select**: `InvoisaicBedrockAgentRole`

**Click "Next"**

---

#### Step 3.8: Add Knowledge Base to Compliance Agent

**IMPORTANT**: This agent needs access to the Knowledge Base!

1. **On "Add Knowledge Bases" step**:
   - **Click "Add"**
   - **Select**: `Invoisaic-Compliance-KB`
   - **Knowledge base instruction**:
     ```
     Use this knowledge base to retrieve tax and compliance regulations for the United States, Germany, United Kingdom, and India. Query for specific requirements based on the invoice country and tax type.
     ```
   - **Click "Add"**

2. **Click "Next"** to review

3. **Click "Create Agent"**

**Copy Agent ID**: Compliance Agent ID = `__________`

---

### Agent 4: Validation Agent

#### Step 3.9: Create Validation Agent

1. **Click "Create Agent"**

**Agent name**:
```
Invoisaic-Validation-Agent
```

**Agent description**:
```
Performs final validation checks and formats the complete invoice data
```

**Agent instruction**:
```
You are the Validation Agent for Invoisaic.

Your role is to:
1. Receive extracted invoice data and compliance validation results
2. Perform final validation checks:
   - Data completeness
   - Mathematical accuracy (totals, tax calculations)
   - Date validity
   - Format consistency
3. Combine all information into final structured output
4. Flag any remaining issues or warnings
5. Assign confidence scores to extracted data

Return final validation in this format:
{
  "validation_status": "passed/failed/warning",
  "invoice_data": {...},
  "compliance_results": {...},
  "validation_checks": [...],
  "confidence_score": 0.0-1.0,
  "warnings": [...],
  "ready_for_processing": true/false
}

Be thorough and ensure data integrity.
```

**Select model**:
- **Model**: `Claude 3 Sonnet` or `Claude 3.5 Sonnet`

**Agent resource role**:
- **Select**: `InvoisaicBedrockAgentRole`

**Click through to create**

**Copy Agent ID**: Validation Agent ID = `__________`

---

## 📋 Part 4: Create Agent Aliases

For each agent, we need to create an alias for deployment:

### Step 4.1: Create Alias for Each Agent

**For EACH of the 4 agents**:

1. **Go to the agent details page**
2. **Click "Create alias"** (top right)
3. **Alias name**: `prod`
4. **Description**: `Production alias`
5. **Version**: Select the latest version (usually `1`)
6. **Click "Create alias"**
7. **Copy the Alias ID** (format: `XXXXXXXXXX`)

**Save these**:
- Orchestrator Alias ID = `__________`
- Extraction Alias ID = `__________`
- Compliance Alias ID = `__________`
- Validation Alias ID = `__________`

---

## 📋 Part 5: Update Environment Variables

### Step 5.1: Update .env.agents

Open `backend/.env.agents` and update:

```env
# Orchestrator Agent
ORCHESTRATOR_AGENT_ID=<your-orchestrator-agent-id>
ORCHESTRATOR_ALIAS_ID=<your-orchestrator-alias-id>

# Extraction Agent
EXTRACTION_AGENT_ID=<your-extraction-agent-id>
EXTRACTION_ALIAS_ID=<your-extraction-alias-id>

# Compliance Agent  
COMPLIANCE_AGENT_ID=<your-compliance-agent-id>
COMPLIANCE_ALIAS_ID=<your-compliance-alias-id>

# Validation Agent
VALIDATION_AGENT_ID=<your-validation-agent-id>
VALIDATION_ALIAS_ID=<your-validation-alias-id>

# Knowledge Base (Already done)
KNOWLEDGE_BASE_ID=2DW2JBM2MN

# OpenSearch Collection (Already done)
OPENSEARCH_COLLECTION_NAME=bedrock-knowledge-base-vmt2uv
OPENSEARCH_COLLECTION_ENDPOINT=69wn63f5ls25u4l4wtr7.ap-south-1.aoss.amazonaws.com
OPENSEARCH_COLLECTION_ARN=arn:aws:aoss:ap-south-1:202533497839:collection/69wn63f5ls25u4l4wtr7
```

---

## 📋 Part 6: Test the Agents

### Step 6.1: Test Compliance Agent with Knowledge Base

1. **Go to Compliance Agent details page**
2. **Click "Test" button** (top right)
3. **In the test console, enter**:
   ```
   What are the GST requirements for invoices in India?
   ```
4. **Verify**: Should return information from the knowledge base about GST rates, e-invoicing, etc.

---

### Step 6.2: Test Extraction Agent

1. **Go to Extraction Agent details page**
2. **Click "Test"**
3. **Enter**:
   ```
   Extract data from this invoice:
   
   Invoice #: INV-2024-001
   Date: 2024-10-21
   Seller: ABC Corp, 123 Main St, New York, NY
   Buyer: XYZ Ltd, 456 Oak Ave, Mumbai, India
   
   Items:
   - Widget A: 10 units @ $50 = $500
   - Widget B: 5 units @ $100 = $500
   
   Subtotal: $1000
   Tax (18% GST): $180
   Total: $1180
   ```
4. **Verify**: Should extract structured JSON data

---

## 📋 Part 7: Configure Agent Collaboration (Advanced)

To enable agents to call each other, we need to set up action groups. This is optional for initial testing but required for production.

### Step 7.1: Create Lambda Functions for Agent Actions

**This requires**:
1. Lambda functions that invoke other agents
2. IAM permissions for cross-agent invocation
3. Action group schemas

**Skip this for now** - we can test agents individually first, then add collaboration later.

---

## ✅ Success Checklist

- [ ] Knowledge Base sync completed (4 documents, ~50-100 chunks)
- [ ] IAM role created: `InvoisaicBedrockAgentRole`
- [ ] Orchestrator Agent created with alias
- [ ] Extraction Agent created with alias
- [ ] Compliance Agent created with Knowledge Base attached
- [ ] Validation Agent created with alias
- [ ] All agent IDs and alias IDs saved in `.env.agents`
- [ ] Compliance Agent tested with KB query
- [ ] Extraction Agent tested with sample invoice

---

## 🎉 Next Steps

After completing this setup:

1. **Test individual agents** in Bedrock Console
2. **Integrate with backend** - Update FastAPI routes to call agents
3. **Test end-to-end flow** - Upload invoice → Process → Get results
4. **Add action groups** - Enable agent-to-agent communication
5. **Deploy to production** - Set up proper monitoring and logging

---

## 📞 Need Help?

- **Agent not responding**: Check IAM role permissions
- **KB queries failing**: Verify Knowledge Base sync completed
- **Can't create alias**: Ensure agent version exists
- **Permission errors**: Check agent resource role has BedrockFullAccess

---

**Estimated Time**: 30-40 minutes for all agents
**Region**: ap-south-1 (Mumbai)
**Account**: 202533497839
