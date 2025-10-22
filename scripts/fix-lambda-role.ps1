# Fix Lambda IAM Role Issue
# This script creates the correct IAM role for Lambda functions

$ErrorActionPreference = "Stop"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Fixing Lambda IAM Role" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$AccountId = (aws sts get-caller-identity --query Account --output text)
$Region = "ap-south-1"

Write-Host "Account ID: $AccountId" -ForegroundColor Green
Write-Host "Region: $Region" -ForegroundColor Green
Write-Host ""

# Check if the role exists
Write-Host "Checking for existing role..." -ForegroundColor Yellow

$roleExists = $false
try {
    aws iam get-role --role-name InvoisaicLambdaExecutionRole 2>$null | Out-Null
    $roleExists = $true
    Write-Host "[OK] InvoisaicLambdaExecutionRole already exists" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Role doesn't exist, will create it" -ForegroundColor Yellow
}

if (-not $roleExists) {
    Write-Host ""
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
        --description "Execution role for Invoisaic Lambda functions"

    # Clean up temp file
    Remove-Item $trustPolicyFile -Force -ErrorAction SilentlyContinue

    Write-Host "[OK] Role created" -ForegroundColor Green

    # Attach AWS managed policies
    Write-Host "Attaching policies..." -ForegroundColor Yellow

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess"

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/AmazonTextractFullAccess"

    aws iam attach-role-policy `
        --role-name InvoisaicLambdaExecutionRole `
        --policy-arn "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"

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
        --policy-document file://$inlinePolicyFile

    Remove-Item $inlinePolicyFile -Force -ErrorAction SilentlyContinue

    Write-Host "[OK] Inline policy added" -ForegroundColor Green

    # Wait for role to propagate
    Write-Host ""
    Write-Host "Waiting 10 seconds for role to propagate..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Role Ready!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Role ARN: arn:aws:iam::${AccountId}:role/InvoisaicLambdaExecutionRole" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update deploy-complete-system.ps1 line 243:" -ForegroundColor White
Write-Host "   --role `"arn:aws:iam::`${AccountId}:role/InvoisaicLambdaExecutionRole`" ``" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Delete failed Lambda functions:" -ForegroundColor White
Write-Host "   aws lambda delete-function --function-name InvoisaicExtractionActions --region $Region" -ForegroundColor Cyan
Write-Host "   aws lambda delete-function --function-name InvoisaicComplianceActions --region $Region" -ForegroundColor Cyan
Write-Host "   aws lambda delete-function --function-name InvoisaicValidationActions --region $Region" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Run deploy-complete-system.ps1 again" -ForegroundColor White
Write-Host ""
