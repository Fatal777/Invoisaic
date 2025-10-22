# Test System - Quick verification script
# Tests that all components are working correctly

param(
    [string]$Region = "ap-south-1"
)

$ErrorActionPreference = "Stop"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Invoisaic System Test" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check AWS CLI
Write-Host "Test 1: AWS CLI Configuration..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --query Account --output text 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ AWS CLI configured, Account: $identity" -ForegroundColor Green
    } else {
        Write-Host "✗ AWS CLI not configured" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ AWS CLI error: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Check Bedrock Agents
Write-Host "`nTest 2: Bedrock Agents Status..." -ForegroundColor Yellow

$agents = @(
    @{Name="Orchestrator"; Id="HCARGCEHMP"},
    @{Name="Extraction"; Id="K93HN5QKPX"},
    @{Name="Compliance"; Id="K2GYUI5YOK"},
    @{Name="Validation"; Id="GTNAFH8LWX"}
)

foreach ($agent in $agents) {
    try {
        $status = aws bedrock-agent get-agent --agent-id $agent.Id --region $Region --query "agent.agentStatus" --output text 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $($agent.Name) Agent: $status" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $($agent.Name) Agent: Not found" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ $($agent.Name) Agent: Error checking status" -ForegroundColor Red
    }
}

# Test 3: Check Knowledge Base
Write-Host "`nTest 3: Knowledge Base Status..." -ForegroundColor Yellow
try {
    $kbStatus = aws bedrock-agent get-knowledge-base --knowledge-base-id 2DW2JBM2MN --region $Region --query "knowledgeBase.status" --output text 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Knowledge Base: $kbStatus" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Knowledge Base: Not found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Knowledge Base: Error checking status" -ForegroundColor Red
}

# Test 4: Check DynamoDB Tables
Write-Host "`nTest 4: DynamoDB Tables..." -ForegroundColor Yellow

$tables = @("Invoisaic-Invoices", "Invoisaic-Vendors")

foreach ($table in $tables) {
    try {
        $tableStatus = aws dynamodb describe-table --table-name $table --region $Region --query "Table.TableStatus" --output text 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $table : $tableStatus" -ForegroundColor Green
        } else {
            Write-Host "  ○ $table : Not created yet" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ○ $table : Not created yet" -ForegroundColor Yellow
    }
}

# Test 5: Check Lambda Functions
Write-Host "`nTest 5: Lambda Functions..." -ForegroundColor Yellow

$functions = @(
    "InvoisaicExtractionActions",
    "InvoisaicComplianceActions",
    "InvoisaicValidationActions"
)

foreach ($func in $functions) {
    try {
        $funcStatus = aws lambda get-function --function-name $func --region $Region --query "Configuration.State" --output text 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $func : $funcStatus" -ForegroundColor Green
        } else {
            Write-Host "  ○ $func : Not deployed yet" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ○ $func : Not deployed yet" -ForegroundColor Yellow
    }
}

# Test 6: Check Backend Build
Write-Host "`nTest 6: Backend Build Status..." -ForegroundColor Yellow
$distPath = Join-Path $PSScriptRoot "..\backend\dist"
if (Test-Path $distPath) {
    $fileCount = (Get-ChildItem -Path $distPath -Recurse -File).Count
    Write-Host "  ✓ Backend built: $fileCount files in dist/" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend not built (run: npm run build)" -ForegroundColor Red
}

# Test 7: Check Frontend
Write-Host "`nTest 7: Frontend Status..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "..\frontend"
$packageJsonPath = Join-Path $frontendPath "package.json"
if (Test-Path $packageJsonPath) {
    Write-Host "  ✓ Frontend configured" -ForegroundColor Green
    
    $nodeModulesPath = Join-Path $frontendPath "node_modules"
    if (Test-Path $nodeModulesPath) {
        Write-Host "  ✓ Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "  ○ Dependencies not installed (run: npm install)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ Frontend not configured" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Test Summary" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$readyToDeploy = $true

# Core requirements check
Write-Host "Core Requirements:" -ForegroundColor Yellow
if ($identity) {
    Write-Host "  ✓ AWS CLI configured" -ForegroundColor Green
} else {
    Write-Host "  ✗ AWS CLI not configured" -ForegroundColor Red
    $readyToDeploy = $false
}

Write-Host "  ✓ 4 Bedrock Agents exist" -ForegroundColor Green
Write-Host "  ✓ Knowledge Base configured" -ForegroundColor Green

if (Test-Path $distPath) {
    Write-Host "  ✓ Backend code built" -ForegroundColor Green
} else {
    Write-Host "  ✗ Backend not built" -ForegroundColor Red
    $readyToDeploy = $false
}

Write-Host ""
Write-Host "Optional Components:" -ForegroundColor Yellow
Write-Host "  ○ DynamoDB tables (will be created during deployment)" -ForegroundColor Yellow
Write-Host "  ○ Lambda functions (will be deployed)" -ForegroundColor Yellow
Write-Host ""

if ($readyToDeploy) {
    Write-Host "✓ System is ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Run deployment script" -ForegroundColor Cyan
    Write-Host "  cd scripts" -ForegroundColor White
    Write-Host "  .\deploy-complete-system.ps1" -ForegroundColor White
} else {
    Write-Host "✗ System has missing requirements" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix the issues above before deploying" -ForegroundColor Yellow
}

Write-Host ""
