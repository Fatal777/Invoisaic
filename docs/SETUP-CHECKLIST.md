# Invoisaic Bedrock Setup - Quick Checklist

## ✅ Completed
- [x] Knowledge Base created: `2DW2JBM2MN`
- [x] OpenSearch collection: `bedrock-knowledge-base-vmt2uv`
- [x] Environment variables updated in `.env.agents`

---

## 🚀 Do This Now (In Order)

### 1. Verify KB Sync (5 minutes)
- [ ] Go to: https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/knowledge-bases
- [ ] Click on `Invoisaic-Compliance-KB`
- [ ] Go to "Data sources" tab
- [ ] If not synced, click "Sync" button and wait 3-5 minutes
- [ ] Verify: 4 documents, ~50-100 chunks, 0 errors

### 2. Create IAM Role (3 minutes)
- [ ] Go to: https://console.aws.amazon.com/iam/
- [ ] Create role → AWS service → Bedrock → Agent
- [ ] Attach policies: `AmazonBedrockFullAccess`, `AWSLambdaBasicExecutionRole`
- [ ] Name: `InvoisaicBedrockAgentRole`
- [ ] Copy ARN: `arn:aws:iam::202533497839:role/InvoisaicBedrockAgentRole`

### 3. Create Orchestrator Agent (5 minutes)
- [ ] Go to: https://ap-south-1.console.aws.amazon.com/bedrock/home?region=ap-south-1#/agents
- [ ] Click "Create Agent"
- [ ] Name: `Invoisaic-Orchestrator-Agent`
- [ ] Copy instruction from `BEDROCK-AGENTS-SETUP.md` (Agent 1)
- [ ] Model: Claude 3 Sonnet
- [ ] Role: `InvoisaicBedrockAgentRole`
- [ ] Create agent
- [ ] Create alias: `prod`
- [ ] Save Agent ID: __________
- [ ] Save Alias ID: __________

### 4. Create Extraction Agent (5 minutes)
- [ ] Click "Create Agent"
- [ ] Name: `Invoisaic-Extraction-Agent`
- [ ] Copy instruction from `BEDROCK-AGENTS-SETUP.md` (Agent 2)
- [ ] Model: Claude 3 Sonnet
- [ ] Role: `InvoisaicBedrockAgentRole`
- [ ] Create agent
- [ ] Create alias: `prod`
- [ ] Save Agent ID: __________
- [ ] Save Alias ID: __________

### 5. Create Compliance Agent (7 minutes)
- [ ] Click "Create Agent"
- [ ] Name: `Invoisaic-Compliance-Agent`
- [ ] Copy instruction from `BEDROCK-AGENTS-SETUP.md` (Agent 3)
- [ ] Model: Claude 3 Sonnet
- [ ] Role: `InvoisaicBedrockAgentRole`
- [ ] **IMPORTANT**: Add Knowledge Base `Invoisaic-Compliance-KB`
- [ ] Add KB instruction from guide
- [ ] Create agent
- [ ] Create alias: `prod`
- [ ] Save Agent ID: __________
- [ ] Save Alias ID: __________

### 6. Create Validation Agent (5 minutes)
- [ ] Click "Create Agent"
- [ ] Name: `Invoisaic-Validation-Agent`
- [ ] Copy instruction from `BEDROCK-AGENTS-SETUP.md` (Agent 4)
- [ ] Model: Claude 3 Sonnet
- [ ] Role: `InvoisaicBedrockAgentRole`
- [ ] Create agent
- [ ] Create alias: `prod`
- [ ] Save Agent ID: __________
- [ ] Save Alias ID: __________

### 7. Update Environment Variables (2 minutes)
- [ ] Open `backend/.env.agents`
- [ ] Update all agent IDs and alias IDs
- [ ] Save file

### 8. Test Agents (5 minutes)
- [ ] Test Compliance Agent: "What are GST requirements for India?"
- [ ] Test Extraction Agent: Use sample invoice from guide
- [ ] Verify both return expected results

---

## 📊 Progress Tracker

**Total Time**: ~35-40 minutes
**Current Step**: _____ of 8

---

## 🎯 Agent IDs to Fill In

```
ORCHESTRATOR_AGENT_ID=__________
ORCHESTRATOR_ALIAS_ID=__________

EXTRACTION_AGENT_ID=__________
EXTRACTION_ALIAS_ID=__________

COMPLIANCE_AGENT_ID=__________
COMPLIANCE_ALIAS_ID=__________

VALIDATION_AGENT_ID=__________
VALIDATION_ALIAS_ID=__________
```

---

## 🚨 Quick Troubleshooting

**Issue**: Can't create agent
- **Fix**: Ensure IAM role exists and has correct trust policy

**Issue**: KB not attached to Compliance Agent
- **Fix**: Edit agent → Add Knowledge Base → Select `Invoisaic-Compliance-KB`

**Issue**: Can't create alias
- **Fix**: Ensure agent has at least one version (check agent details)

**Issue**: Agent test fails
- **Fix**: Check IAM role has `AmazonBedrockFullAccess`

---

## ✅ When Complete

You should have:
- ✅ 4 agents created and working
- ✅ All IDs saved in `.env.agents`
- ✅ Compliance agent successfully querying Knowledge Base
- ✅ Ready to integrate with backend API

**Next**: Test the complete flow with a real invoice!
