# Quick Fix and Redeploy Script
# This script fixes the IAM role issue and redeploys Lambda functions

$ErrorActionPreference = "Continue"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Quick Fix & Redeploy" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$AccountId = (aws sts get-caller-identity --query Account --output text)
$Region = "ap-south-1"

Write-Host "Account ID: $AccountId" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 1: Delete Failed Lambda Functions
# ============================================================================

Write-Host "Step 1: Cleaning up failed Lambda functions..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------------------" -ForegroundColor Gray

$functions = @("InvoisaicExtractionActions", "InvoisaicComplianceActions", "InvoisaicValidationActions")

foreach ($funcName in $functions) {
    try {
        Write-Host "Deleting $funcName..." -ForegroundColor Yellow
        aws lambda delete-function --function-name $funcName --region $Region 2>$null
        Write-Host "[OK] Deleted $funcName" -ForegroundColor Green
    } catch {
        Write-Host "[INFO] $funcName doesn't exist or already deleted" -ForegroundColor Gray
    }
}

Write-Host ""

# ============================================================================
# STEP 2: Create/Verify IAM Role
# ============================================================================

Write-Host "Step 2: Setting up IAM role..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------------------" -ForegroundColor Gray

$roleExists = $false
try {
    $roleCheck = aws iam get-role --role-name InvoisaicLambdaExecutionRole 2>&1
    if ($LASTEXITCODE -eq 0) {
        $roleExists = $true
        Write-Host "[OK] InvoisaicLambdaExecutionRole already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "[INFO] Role doesn't exist, will create it" -ForegroundColor Yellow
}

if (-not $roleExists) {
    Write-Host "Creating Lambda execution role..." -ForegroundColor Yellow
    
    # Create trust policy for Lambda
    $trustPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "bedrock.amazonaws.com"
        ]
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
'@

    # Save trust policy to file
    $trustPolicyFile = Join-Path $PSScriptRoot "trust-policy-temp.json"
    [System.IO.File]::WriteAllText($trustPolicyFile, $trustPolicy)

    # Create the role
    aws iam create-role `
        --role-name InvoisaicLambdaExecutionRole `
        --assume-role-policy-document file://$trustPolicyFile `
        --description "Execution role for Invoisaic Lambda functions" | Out-Null

    # Clean up temp file
    Remove-Item $trustPolicyFile -Force -ErrorAction SilentlyContinue

    Write-Host "[OK] Role created" -ForegroundColor Green

    # Attach AWS managed policies
    Write-Host "Attaching policies..." -ForegroundColor Yellow

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole" | Out-Null

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess" | Out-Null

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess" | Out-Null

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/AmazonTextractFullAccess" | Out-Null

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/AmazonBedrockFullAccess" | Out-Null

    Write-Host "[OK] Policies attached" -ForegroundColor Green

    # Create inline policy for Bedrock
    $inlinePolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeAgent",
        "bedrock:InvokeModel",
        "bedrock:Retrieve"
      ],
      "Resource": "*"
    }
  ]
}
"@

    $inlinePolicyFile = Join-Path $PSScriptRoot "inline-policy-temp.json"
    [System.IO.File]::WriteAllText($inlinePolicyFile, $inlinePolicy)

    aws iam put-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-name BedrockAccess `
        --policy-document file://$inlinePolicyFile | Out-Null

    Remove-Item $inlinePolicyFile -Force -ErrorAction SilentlyContinue

    Write-Host "[OK] Inline policy added" -ForegroundColor Green

    # Wait for role to propagate
    Write-Host "Waiting 10 seconds for role to propagate..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    Write-Host "[OK] Role ready" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# STEP 3: Redeploy Lambda Functions
# ============================================================================

Write-Host "Step 3: Redeploying Lambda functions..." -ForegroundColor Cyan
Write-Host "---------------------------------------------------------------------------" -ForegroundColor Gray

Write-Host "Running deployment script..." -ForegroundColor Yellow
Write-Host ""

# Run the main deployment script (Lambda only)
& "$PSScriptRoot\deploy-complete-system.ps1" -SkipDynamoDB -SkipAgents

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Fix Complete!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lambda functions should now be deployed successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify Lambda functions exist:" -ForegroundColor White
Write-Host "   aws lambda list-functions --region $Region --query 'Functions[?starts_with(FunctionName, ``Invoisaic``)].FunctionName'" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configure action groups in Bedrock console" -ForegroundColor White
Write-Host "3. Test the system via frontend" -ForegroundColor White
Write-Host ""
