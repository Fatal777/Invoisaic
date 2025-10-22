# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Invoisaic** is an AI-powered invoice processing platform built on AWS serverless architecture. It leverages Amazon Bedrock's multi-agent orchestration with Claude models to automatically extract, validate, and approve invoices with real-time compliance checking against global tax regulations.

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Node.js 18+ + TypeScript + AWS Lambda
- **AI/ML**: Amazon Bedrock Agents, Bedrock Knowledge Base, Claude 3 Sonnet, Amazon Textract
- **Infrastructure**: AWS CDK, API Gateway, DynamoDB, S3, OpenSearch Serverless
- **State Management**: Zustand
- **Animations**: Framer Motion

## Common Commands

### Development

```bash
# Install all dependencies (root + frontend + backend + infrastructure)
npm run install:all

# Run frontend and backend concurrently
npm run dev

# Run frontend only (on port 5173)
npm run dev:frontend
# OR
cd frontend && npm run dev

# Run backend only
npm run dev:backend
# OR
cd backend && npm run dev
```

### Building

```bash
# Build all (backend + frontend)
npm run build

# Build frontend only
npm run build:frontend
# OR
cd frontend && npm run build

# Build backend only
npm run build:backend
# OR
cd backend && npm run build
```

### Testing

```bash
# Run all tests
npm run test

# Test frontend (uses vitest)
npm run test:frontend
# OR
cd frontend && npm run test

# Test backend (uses jest)
npm run test:backend
# OR
cd backend && npm run test
```

### Linting & Formatting

```bash
# Lint all
npm run lint

# Lint frontend
npm run lint:frontend
# OR
cd frontend && npm run lint

# Lint backend
npm run lint:backend
# OR
cd backend && npm run lint

# Format all with Prettier
npm run format

# Format frontend
npm run format:frontend

# Format backend
npm run format:backend
```

### Infrastructure & Deployment

```bash
# Bootstrap CDK (first time only)
npm run bootstrap
# OR
cd infrastructure && cdk bootstrap

# Deploy to development
npm run deploy:dev
# OR
cd infrastructure && cdk deploy --all --context environment=dev

# Deploy to production
npm run deploy:prod
# OR
cd infrastructure && cdk deploy --all --context environment=prod --require-approval never

# Deploy frontend only (to S3)
npm run deploy:frontend

# Preview infrastructure changes
npm run diff
# OR
cd infrastructure && cdk diff

# Synthesize CloudFormation templates
npm run synth
# OR
cd infrastructure && cdk synth

# Destroy all infrastructure
npm run destroy
# OR
cd infrastructure && cdk destroy --all

# Verify deployment
npm run verify
# OR
bash scripts/verify-deployment.sh
```

### Monitoring

```bash
# Watch Lambda logs
npm run logs:agentic     # Agentic demo handler logs
npm run logs:agent       # Agent actions handler logs
npm run logs:search      # Search handler logs
```

### Cleanup

```bash
# Clean all build artifacts and node_modules
npm run clean

# Clean frontend only
npm run clean:frontend

# Clean backend only
npm run clean:backend

# Clean infrastructure only
npm run clean:infrastructure
```

## Architecture Overview

### Multi-Agent System

The system uses 4 specialized Bedrock agents orchestrated through BedrockAgentRuntimeClient:

1. **Orchestrator Agent** (ID: `HCARGCEHMP`, Alias: `SIYBOSZY2J`)
   - Coordinates entire workflow
   - Delegates to specialized agents
   - Manages workflow state

2. **Extraction Agent** (ID: `K93HN5QKPX`, Alias: `73C03KQA7J`)
   - Extracts structured data from invoices
   - Uses AWS Textract for OCR
   - Handles multiple invoice formats

3. **Compliance Agent** (ID: `K2GYUI5YOK`, Alias: `3FWUQIYHUN`)
   - Validates against tax regulations
   - Queries Knowledge Base for compliance rules
   - Supports US, Germany, UK, India tax regulations

4. **Validation Agent** (ID: `GTNAFH8LWX`, Alias: `ZSN4XIISJG`)
   - Performs final quality checks
   - Validates data completeness
   - Formats final output

### Knowledge Base Integration

- **Knowledge Base ID**: `2DW2JBM2MN`
- **OpenSearch Collection**: `bedrock-knowledge-base-vmt2uv`
- **Documents**: 4 tax regulation documents (US, Germany, UK, India)
- **Vector Search**: Semantic retrieval of compliance rules during agent processing

### Agent Invocation Flow

```
User Request
    ↓
API Gateway (REST/WebSocket)
    ↓
Lambda Handler (agenticDemoHandler.ts)
    ↓
BedrockAgentRuntimeClient.InvokeAgentCommand
    ↓
1. Orchestrator Agent initiates workflow
2. Extraction Agent extracts data
3. Compliance Agent validates (queries KB)
4. Validation Agent performs final checks
    ↓
Aggregated Results
    ↓
Frontend Dashboard (real-time updates)
```

### Key Backend Files

- **Agent Handlers**: `backend/src/lambda/agenticDemoHandler.ts` - Main entry point for agent workflows
- **Agent Classes**: `backend/src/agents/` - Wrapper classes for each specialized agent
  - `supervisorAgent.ts` - Coordination logic
  - `pricingAgent.ts` - Pricing calculations
  - `complianceAgent.ts` - Compliance validation
  - `customerIntelligenceAgent.ts` - Customer behavior analysis
- **Action Groups**: `backend/src/lambda/actions/` - Lambda action group implementations
  - `extraction-actions.ts` - Data extraction actions
  - `compliance-actions.ts` - Compliance checking actions
  - `validation-actions.ts` - Validation actions
  - `orchestration-actions.ts` - Workflow coordination actions

### Key Frontend Files

- **Agent Dashboard**: `frontend/src/pages/AgentDashboard.tsx` - Real-time agent monitoring UI
- **Live Demo**: `frontend/src/pages/demos/LiveDocDemo.tsx` - Interactive invoice upload demo
- **Agent Components**:
  - `AgentActivityStream.tsx` - Real-time activity logs
  - `PDFViewer.tsx` - PDF rendering with live annotations
  - `FraudHeatMap.tsx` - Fraud visualization
  - `TaxBreakdownPanel.tsx` - Tax compliance details

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://xpdhtqhxfa.execute-api.ap-south-1.amazonaws.com/prod
VITE_WEBSOCKET_URL=wss://lbrbkmd3s0.execute-api.ap-south-1.amazonaws.com/prod
VITE_AWS_REGION=ap-south-1
VITE_AWS_USER_POOL_ID=ap-south-1_22ZdrSEVz
VITE_AWS_USER_POOL_CLIENT_ID=2dmut3kvpd2tefdrhjbpuls25t
VITE_S3_BUCKET=invoisaic-documents-dev-202533497839
```

### Backend (Lambda Environment Variables)
```
ORCHESTRATOR_AGENT_ID=HCARGCEHMP
ORCHESTRATOR_ALIAS_ID=SIYBOSZY2J
EXTRACTION_AGENT_ID=K93HN5QKPX
EXTRACTION_ALIAS_ID=73C03KQA7J
COMPLIANCE_AGENT_ID=K2GYUI5YOK
COMPLIANCE_ALIAS_ID=3FWUQIYHUN
VALIDATION_AGENT_ID=GTNAFH8LWX
VALIDATION_ALIAS_ID=ZSN4XIISJG
KNOWLEDGE_BASE_ID=2DW2JBM2MN
AWS_REGION=ap-south-1
S3_DOCUMENTS_BUCKET=invoisaic-documents-dev-202533497839
WEBSOCKET_API_ENDPOINT=wss://lbrbkmd3s0.execute-api.ap-south-1.amazonaws.com/prod
```

## Development Workflow

### Adding a New Agent

1. Create agent configuration in AWS Bedrock Console or via CDK
2. Add agent ID and alias ID to environment variables
3. Create wrapper class in `backend/src/agents/`
4. Implement invocation logic using `BedrockAgentRuntimeClient`
5. Update orchestrator to include new agent in workflow
6. Add UI components in frontend to display agent results

### Working with Bedrock Agents

- Use `@aws-sdk/client-bedrock-agent-runtime` for agent invocation
- Always use `InvokeAgentCommand` with streaming enabled for real-time updates
- Session IDs are required for maintaining context between agent calls
- Agent responses are streamed chunks that need to be assembled

### WebSocket Real-Time Updates

- Backend publishes events via API Gateway WebSocket connections
- Frontend listens via custom `useWebSocket` hook
- Event types: `processing_started`, `field_extracted`, `agent_activity`, `processing_complete`

### Testing with Sample Invoices

Sample invoices are located in the `/knowledge-base` directory and S3 bucket. The system supports:
- PDF invoices
- JPG/PNG images
- Invoices from US, Germany, UK, India with respective tax regulations

## Important Notes

### AWS Service Limits
- Bedrock Agents are in free preview (as of implementation)
- Lambda timeout is set to 300 seconds for agent processing
- API Gateway has default throttling limits (modify if needed)

### PowerShell on Windows
Since you're using PowerShell on Windows, note:
- Use `npm run` commands instead of bash scripts where possible
- CDK commands work the same in PowerShell
- AWS CLI commands are compatible with PowerShell

### Cost Optimization
- DynamoDB uses on-demand billing
- Lambda uses pay-per-invocation model
- Bedrock charges per 1000 input/output tokens
- S3 charges for storage and requests

### Security
- Never commit AWS credentials or API keys
- Use IAM roles with least privilege
- Environment variables should be stored securely (AWS Secrets Manager for production)
- CORS is enabled for frontend-backend communication

## Troubleshooting

### Agent Invocation Failures
- Check agent IDs and alias IDs are correct
- Verify IAM roles have `bedrock:InvokeAgent` permission
- Check CloudWatch logs: `npm run logs:agentic`
- Ensure agents are in "ACTIVE" state in Bedrock console

### Knowledge Base Issues
- Verify KB sync status in Bedrock console
- Check OpenSearch Serverless collection is active
- Ensure compliance documents are uploaded to S3
- Re-sync data source if documents were updated

### Frontend Not Connecting
- Verify API Gateway URLs in frontend `.env`
- Check CORS settings in API Gateway
- Ensure WebSocket connection URL is correct
- Check browser console for connection errors

### Lambda Timeout Issues
- Agent processing can take 5-10 seconds per workflow
- Increase timeout if processing complex invoices
- Consider implementing async processing with SQS for long operations

## Documentation

Refer to these files for detailed information:
- `README.md` - Project overview and features
- `QUICKSTART.md` - 5-minute quick start guide
- `docs/ARCHITECTURE.md` - Detailed architecture documentation
- `docs/BEDROCK-AGENTS-SETUP.md` - Step-by-step agent setup
- `docs/DEPLOYMENT-GUIDE.md` - Production deployment instructions
- `docs/COMPLETE-IMPLEMENTATION.md` - Full implementation details
- `docs/QUICK-KB-SETUP.md` - Knowledge Base setup guide
- `DEBUGGING-GUIDE.md` - Debugging tips
