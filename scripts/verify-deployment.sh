#!/bin/bash

# Invoisaic Deployment Verification Script
# Checks all components are deployed and working

echo "🔍 Invoisaic Deployment Verification"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check and report
check_component() {
    local component=$1
    local command=$2
    
    echo -n "Checking $component... "
    
    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

check_warning() {
    local component=$1
    local command=$2
    
    echo -n "Checking $component... "
    
    if eval "$command" &> /dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        ((WARNINGS++))
        return 1
    fi
}

echo "📋 Prerequisites Check"
echo "---------------------"

# Check AWS CLI
check_component "AWS CLI installed" "which aws"

# Check AWS credentials
check_component "AWS credentials configured" "aws sts get-caller-identity"

# Check Node.js
check_component "Node.js 20.x installed" "node --version | grep -E 'v20\.[0-9]+\.[0-9]+'"

# Check CDK
check_component "AWS CDK installed" "which cdk"

echo ""
echo "🏗️ Infrastructure Check"
echo "----------------------"

# Check if stack is deployed
if check_component "CloudFormation stack exists" "aws cloudformation describe-stacks --stack-name InvoisaicStack-prod --region us-east-1"; then
    
    # Get stack outputs
    API_URL=$(aws cloudformation describe-stacks --stack-name InvoisaicStack-prod --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text 2>/dev/null)
    USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name InvoisaicStack-prod --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text 2>/dev/null)
    AGENT_ID=$(aws cloudformation describe-stacks --stack-name InvoisaicStack-prod --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`AgentId`].OutputValue' --output text 2>/dev/null)
    
    if [ ! -z "$API_URL" ]; then
        echo -e "${GREEN}✓${NC} API URL: $API_URL"
    fi
    
    if [ ! -z "$USER_POOL_ID" ]; then
        echo -e "${GREEN}✓${NC} User Pool ID: $USER_POOL_ID"
    fi
    
    if [ ! -z "$AGENT_ID" ]; then
        echo -e "${GREEN}✓${NC} Agent ID: $AGENT_ID"
    fi
fi

# Check DynamoDB tables
check_component "DynamoDB invoices table" "aws dynamodb describe-table --table-name invoisaic-invoices-prod --region us-east-1"
check_component "DynamoDB customers table" "aws dynamodb describe-table --table-name invoisaic-customers-prod --region us-east-1"
check_component "DynamoDB agents table" "aws dynamodb describe-table --table-name invoisaic-agents-prod --region us-east-1"

# Check S3 buckets
check_warning "S3 documents bucket" "aws s3 ls s3://invoisaic-documents-prod-* --region us-east-1"
check_warning "S3 knowledge base bucket" "aws s3 ls s3://invoisaic-kb-prod-* --region us-east-1"

# Check Lambda functions
check_component "Lambda: agenticDemoHandler" "aws lambda get-function --function-name invoisaic-agentic-demo-prod --region us-east-1"
check_component "Lambda: agentActionsHandler" "aws lambda get-function --function-name invoisaic-agent-actions-prod --region us-east-1"

echo ""
echo "🤖 AI Services Check"
echo "-------------------"

# Check Bedrock model access
check_warning "Bedrock Nova Micro access" "aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?modelId==\`amazon.nova-micro-v1:0\`]' --output text"
check_warning "Bedrock Nova Pro access" "aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?modelId==\`amazon.nova-pro-v1:0\`]' --output text"
check_warning "Bedrock Titan Embeddings access" "aws bedrock list-foundation-models --region us-east-1 --query 'modelSummaries[?modelId==\`amazon.titan-embed-text-v2:0\`]' --output text"

# Check Bedrock Agent
if [ ! -z "$AGENT_ID" ]; then
    check_component "Bedrock Agent exists" "aws bedrock-agent get-agent --agent-id $AGENT_ID --region us-east-1"
fi

echo ""
echo "🔗 API Endpoints Check"
echo "---------------------"

if [ ! -z "$API_URL" ]; then
    # Test API health
    check_component "API Gateway responding" "curl -s -o /dev/null -w '%{http_code}' $API_URL/invoices | grep -E '200|403'"
    
    echo ""
    echo "Testing API endpoints:"
    
    # Test individual endpoints
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/invoices" 2>/dev/null)
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "403" ]; then
        echo -e "${GREEN}✓${NC} GET /invoices - $HTTP_CODE"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} GET /invoices - $HTTP_CODE"
        ((FAILED++))
    fi
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/customers" 2>/dev/null)
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "403" ]; then
        echo -e "${GREEN}✓${NC} GET /customers - $HTTP_CODE"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} GET /customers - $HTTP_CODE"
        ((FAILED++))
    fi
fi

echo ""
echo "📦 Frontend Check"
echo "----------------"

# Check if frontend is built
if [ -d "frontend/dist" ]; then
    echo -e "${GREEN}✓${NC} Frontend build directory exists"
    ((PASSED++))
    
    # Check if deployed to S3
    check_warning "Frontend deployed to S3" "aws s3 ls s3://invoisaic-frontend-prod/ --region us-east-1"
else
    echo -e "${RED}✗${NC} Frontend not built (run: cd frontend && npm run build)"
    ((FAILED++))
fi

# Check frontend .env
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env file exists"
    ((PASSED++))
    
    if grep -q "VITE_API_URL" frontend/.env; then
        echo -e "${GREEN}✓${NC} VITE_API_URL configured"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} VITE_API_URL not configured"
        ((FAILED++))
    fi
else
    echo -e "${RED}✗${NC} Frontend .env file missing"
    ((FAILED++))
fi

echo ""
echo "📊 Summary"
echo "=========="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

TOTAL=$((PASSED + WARNINGS + FAILED))
SUCCESS_RATE=$(( (PASSED * 100) / TOTAL ))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment verification PASSED${NC}"
    echo "Success rate: ${SUCCESS_RATE}%"
    echo ""
    echo "🚀 Your platform is ready!"
    echo ""
    if [ ! -z "$API_URL" ]; then
        echo "API URL: $API_URL"
    fi
    exit 0
elif [ $FAILED -lt 5 ]; then
    echo -e "${YELLOW}⚠️  Deployment partially complete${NC}"
    echo "Success rate: ${SUCCESS_RATE}%"
    echo ""
    echo "Review the failed checks above and fix them."
    exit 1
else
    echo -e "${RED}❌ Deployment verification FAILED${NC}"
    echo "Success rate: ${SUCCESS_RATE}%"
    echo ""
    echo "Please review the errors above and run deployment again."
    exit 1
fi
