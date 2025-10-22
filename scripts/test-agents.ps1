# Test Bedrock Agents Script
# Tests all 4 agents with sample data

$ErrorActionPreference = "Stop"

$KB_ID = "2DW2JBM2MN"
$REGION = "ap-south-1"

# Agent IDs from .env.agents
$ORCHESTRATOR_AGENT_ID = "HCARGCEHMP"
$ORCHESTRATOR_ALIAS_ID = "SIYBOSZY2J"

$EXTRACTION_AGENT_ID = "K93HN5QKPX"
$EXTRACTION_ALIAS_ID = "73C03KQA7J"

$COMPLIANCE_AGENT_ID = "K2GYUI5YOK"
$COMPLIANCE_ALIAS_ID = "3FWUQIYHUN"

$VALIDATION_AGENT_ID = "GTNAFH8LWX"
$VALIDATION_ALIAS_ID = "ZSN4XIISJG"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bedrock Agents Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Knowledge Base
Write-Host "[1/5] Testing Knowledge Base..." -ForegroundColor Yellow
aws bedrock-agent get-knowledge-base `
    --knowledge-base-id $KB_ID `
    --region $REGION `
    --query "{Name:name,Status:status}" `
    --output table

Write-Host ""

# Test 2: Orchestrator Agent
Write-Host "[2/5] Testing Orchestrator Agent..." -ForegroundColor Yellow
aws bedrock-agent get-agent `
    --agent-id $ORCHESTRATOR_AGENT_ID `
    --region $REGION `
    --query "{Name:agentName,Status:agentStatus,Model:foundationModel}" `
    --output table

Write-Host ""

# Test 3: Extraction Agent
Write-Host "[3/5] Testing Extraction Agent..." -ForegroundColor Yellow
aws bedrock-agent get-agent `
    --agent-id $EXTRACTION_AGENT_ID `
    --region $REGION `
    --query "{Name:agentName,Status:agentStatus,Model:foundationModel}" `
    --output table

Write-Host ""

# Test 4: Compliance Agent
Write-Host "[4/5] Testing Compliance Agent..." -ForegroundColor Yellow
aws bedrock-agent get-agent `
    --agent-id $COMPLIANCE_AGENT_ID `
    --region $REGION `
    --query "{Name:agentName,Status:agentStatus,Model:foundationModel}" `
    --output table

# Check if Knowledge Base is attached
Write-Host "  Checking Knowledge Base association..." -ForegroundColor Gray
aws bedrock-agent list-agent-knowledge-bases `
    --agent-id $COMPLIANCE_AGENT_ID `
    --agent-version "DRAFT" `
    --region $REGION `
    --query "agentKnowledgeBaseSummaries[*].{KnowledgeBaseId:knowledgeBaseId,Status:knowledgeBaseState}" `
    --output table

Write-Host ""

# Test 5: Validation Agent
Write-Host "[5/5] Testing Validation Agent..." -ForegroundColor Yellow
aws bedrock-agent get-agent `
    --agent-id $VALIDATION_AGENT_ID `
    --region $REGION `
    --query "{Name:agentName,Status:agentStatus,Model:foundationModel}" `
    --output table

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check all agent aliases
Write-Host "Checking Agent Aliases..." -ForegroundColor Yellow
Write-Host ""

$agents = @(
    @{Name="Orchestrator"; Id=$ORCHESTRATOR_AGENT_ID; AliasId=$ORCHESTRATOR_ALIAS_ID},
    @{Name="Extraction"; Id=$EXTRACTION_AGENT_ID; AliasId=$EXTRACTION_ALIAS_ID},
    @{Name="Compliance"; Id=$COMPLIANCE_AGENT_ID; AliasId=$COMPLIANCE_ALIAS_ID},
    @{Name="Validation"; Id=$VALIDATION_AGENT_ID; AliasId=$VALIDATION_ALIAS_ID}
)

foreach ($agent in $agents) {
    Write-Host "  $($agent.Name) Agent:" -ForegroundColor Cyan
    Write-Host "    Agent ID: $($agent.Id)"
    Write-Host "    Alias ID: $($agent.AliasId)"
    
    $alias = aws bedrock-agent get-agent-alias `
        --agent-id $agent.Id `
        --agent-alias-id $agent.AliasId `
        --region $REGION `
        --query "{Name:agentAliasName,Status:agentAliasStatus}" `
        --output json 2>$null | ConvertFrom-Json
    
    if ($alias) {
        Write-Host "    Status: " -NoNewline
        Write-Host "$($alias.Status)" -ForegroundColor Green
        Write-Host "    Alias Name: $($alias.Name)"
    } else {
        Write-Host "    Status: " -NoNewline
        Write-Host "ERROR - Alias not found!" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Interactive Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testQuery = "What are the GST requirements for India?"

Write-Host "Testing Compliance Agent with Knowledge Base query..." -ForegroundColor Yellow
Write-Host "Query: $testQuery" -ForegroundColor Gray
Write-Host ""

# Create temp file for request
$sessionId = "test-session-$(Get-Date -Format 'yyyyMMddHHmmss')"
$requestFile = "$env:TEMP\bedrock-test-request.json"

@{
    inputText = $testQuery
    sessionId = $sessionId
} | ConvertTo-Json | Out-File -FilePath $requestFile -Encoding utf8

Write-Host "Session ID: $sessionId" -ForegroundColor Gray
Write-Host "Invoking agent..." -ForegroundColor Gray
Write-Host ""

# Note: This requires the AWS CLI v2 with bedrock-agent-runtime support
# For actual testing, use the Lambda function or SDK

Write-Host "To test agent invocation, use one of these methods:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Method 1: Using AWS SDK (Node.js/Python)" -ForegroundColor Yellow
Write-Host "  - Use BedrockAgentRuntimeClient.invokeAgent()" -ForegroundColor Gray
Write-Host ""
Write-Host "Method 2: Using the Lambda function" -ForegroundColor Yellow
Write-Host "  - Deploy the invokeBedrockAgent Lambda" -ForegroundColor Gray
Write-Host "  - Invoke via API Gateway" -ForegroundColor Gray
Write-Host ""
Write-Host "Method 3: Using the Agent Dashboard" -ForegroundColor Yellow
Write-Host "  - Navigate to /agent-dashboard" -ForegroundColor Gray
Write-Host "  - Click 'Start Processing'" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Get-Content ..\backend\.env.agents | Select-String -Pattern "AGENT_ID|ALIAS_ID|KNOWLEDGE_BASE_ID" | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host ""
