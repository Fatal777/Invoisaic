# 🔧 Complete Debugging & Testing Guide

## 🚀 Quick Start - Test Everything

### Step 1: Test /textract Endpoint (File Upload)

**Using curl:**
```bash
curl -X POST https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod/textract \
  -F "file=@/path/to/invoice.pdf" \
  -v
```

**Expected Response (200):**
```json
{
  "success": true,
  "text": "Invoice Number: INV-1760866882747\nTotal: ₹412,882.00\n...",
  "s3Key": "uploads/uuid.pdf",
  "blockCount": 45
}
```

**If you get CORS error:**
- ❌ `No 'Access-Control-Allow-Origin' header`
- **Fix:** Lambda must return CORS headers in response
- **Check:** CloudWatch logs for Lambda errors

### Step 2: Test /invoke-agent Endpoint (Agent Processing)

**Using curl:**
```bash
curl -X POST https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod/invoke-agent \
  -H "Content-Type: application/json" \
  -d '{
    "inputText": "Process this invoice: Invoice Number INV-123, Total: 1000",
    "agentType": "orchestrator",
    "enableTrace": true
  }' \
  -v
```

**Expected Response (200):**
```json
{
  "response": "I have processed the invoice...",
  "trace": [...],
  "sessionId": "session-xxx",
  "agentId": "HCARGCEHMP",
  "agentType": "orchestrator",
  "metadata": {
    "processingTime": 2500,
    "traceEventsCount": 4
  }
}
```

**If you get 500 error:**
- Check CloudWatch logs
- Verify agent IDs are set correctly
- Verify Bedrock permissions

---

## 📊 Checking CloudWatch Logs

### View Textract Lambda Logs
```powershell
aws logs tail /aws/lambda/invoisaic-textract-processor-dev --follow --region ap-south-1
```

### View Invoke Agent Lambda Logs
```powershell
aws logs tail /aws/lambda/invoisaic-invoke-bedrock-agent-dev --follow --region ap-south-1
```

### View API Gateway Logs
```powershell
aws logs tail /aws/apigateway/invoisaic-dev --follow --region ap-south-1
```

---

## 🐛 Common Issues & Fixes

### Issue 1: CORS Error on /textract

**Error:**
```
Access to fetch at 'https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod/textract' 
from origin 'https://invoisaic.xyz' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:**
- Lambda is throwing an error before returning response
- Response headers not being set

**Fix:**
1. Check Lambda logs for actual error
2. Verify S3 bucket name is set: `S3_DOCUMENTS_BUCKET`
3. Verify Textract permissions are granted
4. Rebuild and redeploy:
```powershell
cd backend
npm run build
cd ../infrastructure
cdk deploy --all --require-approval never
```

---

### Issue 2: 500 Error on /invoke-agent

**Error:**
```
Failed to load resource: the server responded with a status of 500
```

**Root Cause:**
- Agent IDs not configured
- Bedrock permissions missing
- Agent not found in Bedrock

**Fix:**
1. Check Lambda logs:
```powershell
aws logs tail /aws/lambda/invoisaic-invoke-bedrock-agent-dev --follow --region ap-south-1
```

2. Verify agent IDs in Lambda environment:
```powershell
aws lambda get-function-configuration \
  --function-name invoisaic-invoke-bedrock-agent-dev \
  --region ap-south-1 | jq '.Environment.Variables'
```

Expected output:
```json
{
  "ORCHESTRATOR_AGENT_ID": "HCARGCEHMP",
  "ORCHESTRATOR_ALIAS_ID": "SIYBOSZY2J",
  "EXTRACTION_AGENT_ID": "K93HN5QKPX",
  "COMPLIANCE_AGENT_ID": "K2GYUI5YOK",
  "VALIDATION_AGENT_ID": "GTNAFH8LWX"
}
```

3. Verify Bedrock permissions:
```powershell
aws iam get-role-policy \
  --role-name invoisaic-invoke-bedrock-agent-dev-ServiceRole-xxx \
  --policy-name bedrock-permissions \
  --region ap-south-1
```

---

### Issue 3: Chat Not Working

**Error:**
```
❌ Error: Failed to send message
```

**Root Cause:**
- Same as Issue 1 or 2 (CORS or 500 error)
- Frontend not sending correct payload

**Fix:**
1. Check browser console (F12) for actual error
2. Check network tab to see request/response
3. Verify API URL is correct in Vercel:
```bash
VITE_API_URL=https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod
```

---

### Issue 4: Agent Returns Empty Response

**Error:**
```
Agent: "Please provide the invoice document for processing"
```

**Root Cause:**
- Frontend not passing extracted text to agent
- Only passing S3 key, not actual content

**Fix:**
- Already fixed in latest code
- Make sure frontend is updated:
```bash
git pull origin main
```

---

## 🧪 Manual Testing Workflow

### Test 1: Upload Invoice
```bash
# 1. Upload file
curl -X POST https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod/textract \
  -F "file=@invoice.pdf" \
  -v

# 2. Save the s3Key and extractedText from response
# Example: s3Key = "uploads/abc123.pdf"
```

### Test 2: Invoke Agent with Extracted Text
```bash
curl -X POST https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod/invoke-agent \
  -H "Content-Type: application/json" \
  -d '{
    "inputText": "Process this invoice document:\n\nInvoice Number: INV-123\nTotal: 1000\n\nExtract all fields and validate.",
    "agentType": "orchestrator",
    "enableTrace": true,
    "sessionAttributes": {
      "s3Key": "uploads/abc123.pdf"
    }
  }' \
  -v
```

### Test 3: Check Response
- Should get 200 with agent response
- Should see trace events
- Should see processing time

---

## 📋 Verification Checklist

Before testing in UI, verify:

- [ ] Backend built: `npm run build` in backend/
- [ ] Infrastructure deployed: `cdk deploy --all` in infrastructure/
- [ ] Lambda functions updated with new code
- [ ] Environment variables set in Lambda:
  - `S3_DOCUMENTS_BUCKET`
  - `ORCHESTRATOR_AGENT_ID`
  - `ORCHESTRATOR_ALIAS_ID`
  - etc.
- [ ] IAM permissions granted:
  - Textract permissions
  - Bedrock permissions
  - S3 read/write
  - DynamoDB read/write
- [ ] API Gateway CORS configured
- [ ] Frontend environment variables set:
  - `VITE_API_URL`
- [ ] Frontend deployed on Vercel
- [ ] Browser cache cleared (Ctrl+F5)

---

## 🔍 Detailed Log Analysis

### What to look for in Textract logs:

```
✅ Good logs:
📄 Textract Handler: Processing document...
Content-Type: multipart/form-data; boundary=...
Processing multipart form data...
File buffer length: 8384500
📄 Uploading file to S3: uploads/uuid.pdf
🔍 Processing PDF document with Textract...
✅ Extracted 45 blocks, 2847 characters from PDF
✅ Textract processing complete.
Response headers: { 'Access-Control-Allow-Origin': '*', ... }

❌ Bad logs:
Error parsing form data: Error: ...
No file found in form data
S3_DOCUMENTS_BUCKET environment variable is not set
```

### What to look for in Invoke Agent logs:

```
✅ Good logs:
🤖 Invoke Bedrock Agent Handler Started
Event method: POST
Event body length: 1234
Agent ID: HCARGCEHMP
Agent Alias: TSTALIASID
Invoking agent...
Agent response received
Response headers: { 'Access-Control-Allow-Origin': '*', ... }

❌ Bad logs:
Invalid agent type: orchestrator. Agent not configured.
Agent ID is empty
Error invoking Bedrock agent: ValidationException
```

---

## 🚨 Emergency Fixes

### If nothing works, try this sequence:

1. **Clear cache and hard refresh:**
```bash
# Browser: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
```

2. **Rebuild backend:**
```powershell
cd backend
npm run build
cd ../infrastructure
```

3. **Redeploy infrastructure:**
```powershell
cdk deploy --all --require-approval never
```

4. **Wait for Vercel to redeploy frontend** (automatic on git push)

5. **Test with curl first** (before testing in UI):
```bash
curl -X POST https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod/textract \
  -F "file=@test.pdf" \
  -v
```

6. **Check CloudWatch logs** for actual errors

---

## 📞 Support

If you still have issues:

1. **Check CloudWatch logs** - they have the actual error
2. **Test with curl** - isolate frontend vs backend issues
3. **Verify environment variables** - in Lambda and Vercel
4. **Check IAM permissions** - in AWS console
5. **Verify agent IDs** - in Bedrock console

---

## 🎯 Expected Behavior After Fixes

### Successful Flow:

1. **Upload Invoice**
   - File selected: ✅
   - File uploaded: ✅
   - Extracted text shown: ✅

2. **Process Invoice**
   - Orchestrator starts: ✅
   - Agent receives full text: ✅
   - Agent processes: ✅
   - Response shown: ✅

3. **Chat**
   - Type message: ✅
   - Send message: ✅
   - Agent responds: ✅
   - Conversation continues: ✅

---

**All systems should be working now!** 🚀
