# Test Multi-Agent Pipeline
# This script tests the complete agent orchestration flow

$ErrorActionPreference = "Continue"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Testing Multi-Agent Invoice Processing Pipeline" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$Region = "ap-south-1"
$OrchestratorAgentId = "B74ZJP982U"
$OrchestratorAliasId = "TSTALIASID"  # Default test alias

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Region: $Region" -ForegroundColor White
Write-Host "  Orchestrator Agent ID: $OrchestratorAgentId" -ForegroundColor White
Write-Host ""

# Sample invoice data for testing
$testPrompt = @"
Process this invoice:

Invoice Number: INV-2024-001
Date: 2024-10-22
Vendor: Tech Solutions Pvt Ltd
GSTIN: 29AABCT1332L1Z1

Items:
- Software License: $1000
- Annual Support: $500

Subtotal: $1500
GST (18%): $270
Total: $1770

Please extract the data, validate compliance, and provide final approval.
"@

Write-Host "Test Prompt:" -ForegroundColor Yellow
Write-Host $testPrompt -ForegroundColor Gray
Write-Host ""
Write-Host "Invoking Orchestrator Agent..." -ForegroundColor Yellow
Write-Host ""

# Create a session ID
$SessionId = "test-session-$(Get-Date -Format 'yyyyMMddHHmmss')"

# Invoke the agent
try {
    $response = aws bedrock-agent-runtime invoke-agent `
        --agent-id $OrchestratorAgentId `
        --agent-alias-id $OrchestratorAliasId `
        --session-id $SessionId `
        --input-text $testPrompt `
        --region $Region `
        --output json 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Agent invoked successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Cyan
        Write-Host $response -ForegroundColor White
    } else {
        Write-Host "[ERROR] Failed to invoke agent" -ForegroundColor Red
        Write-Host $response -ForegroundColor Red
        
        # Check if it's an alias issue
        if ($response -like "*alias*" -or $response -like "*not found*") {
            Write-Host ""
            Write-Host "Trying to get correct alias ID..." -ForegroundColor Yellow
            
            $aliases = aws bedrock-agent list-agent-aliases `
                --agent-id $OrchestratorAgentId `
                --region $Region `
                --query 'agentAliasSummaries[0].agentAliasId' `
                --output text 2>&1
            
            if ($LASTEXITCODE -eq 0 -and $aliases) {
                Write-Host "Found alias: $aliases" -ForegroundColor Green
                Write-Host ""
                Write-Host "Retrying with correct alias..." -ForegroundColor Yellow
                
                $response = aws bedrock-agent-runtime invoke-agent `
                    --agent-id $OrchestratorAgentId `
                    --agent-alias-id $aliases `
                    --session-id $SessionId `
                    --input-text $testPrompt `
                    --region $Region `
                    --output json 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "[SUCCESS] Agent invoked successfully!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Response:" -ForegroundColor Cyan
                    Write-Host $response -ForegroundColor White
                }
            } else {
                Write-Host ""
                Write-Host "No agent alias found. Creating one..." -ForegroundColor Yellow
                Write-Host ""
                Write-Host "Run this command to create an alias:" -ForegroundColor Cyan
                Write-Host "aws bedrock-agent create-agent-alias --agent-id $OrchestratorAgentId --agent-alias-name test-alias --region $Region" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "[ERROR] Exception occurred: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Alternative Test Methods" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Method 1: Test via AWS Console" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.aws.amazon.com/bedrock/home?region=ap-south-1#/agents" -ForegroundColor White
Write-Host "2. Click on Orchestrator Agent (B74ZJP982U)" -ForegroundColor White
Write-Host "3. Click 'Test' button in the right panel" -ForegroundColor White
Write-Host "4. Paste the test prompt above" -ForegroundColor White
Write-Host "5. Watch agents execute in real-time" -ForegroundColor White
Write-Host ""

Write-Host "Method 2: Test Lambda Functions Directly" -ForegroundColor Yellow
Write-Host "Run these commands to test each Lambda:" -ForegroundColor White
Write-Host ""

Write-Host "# Test Extraction Lambda:" -ForegroundColor Cyan
Write-Host 'aws lambda invoke --function-name InvoisaicExtractionActions --payload ''{"invoiceId":"test-001","documentUrl":"s3://bucket/test.pdf"}'' --region ap-south-1 response.json' -ForegroundColor Gray
Write-Host ""

Write-Host "# Test Compliance Lambda:" -ForegroundColor Cyan
Write-Host 'aws lambda invoke --function-name InvoisaicComplianceActions --payload ''{"invoiceData":{"total":1770},"country":"India"}'' --region ap-south-1 response.json' -ForegroundColor Gray
Write-Host ""

Write-Host "# Test Validation Lambda:" -ForegroundColor Cyan
Write-Host 'aws lambda invoke --function-name InvoisaicValidationActions --payload ''{"extractedData":{},"complianceResults":{}}'' --region ap-south-1 response.json' -ForegroundColor Gray
Write-Host ""

Write-Host "Method 3: Check Agent Configuration" -ForegroundColor Yellow
Write-Host "aws bedrock-agent get-agent --agent-id $OrchestratorAgentId --region $Region" -ForegroundColor Gray
Write-Host ""

Write-Host "Method 4: View CloudWatch Logs" -ForegroundColor Yellow
Write-Host "aws logs tail /aws/lambda/InvoisaicExtractionActions --follow --region $Region" -ForegroundColor Gray
Write-Host ""
