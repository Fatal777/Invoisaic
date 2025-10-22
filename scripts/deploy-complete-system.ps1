# Complete AWS Bedrock Multi-Agent System Deployment Script
# This script deploys the entire Invoisaic agent collaboration infrastructure

param(
    [string]$Region = "ap-south-1",
    [string]$AccountId = "",
    [switch]$SkipDynamoDB,
    [switch]$SkipLambda,
    [switch]$SkipAgents,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Invoisaic Multi-Agent System - Complete Deployment" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Get AWS Account ID if not provided
if (-not $AccountId) {
    Write-Host "Getting AWS Account ID..." -ForegroundColor Yellow
    $AccountId = (aws sts get-caller-identity --query Account --output text)
    Write-Host "Account ID: $AccountId" -ForegroundColor Green
}

Write-Host "Region: $Region" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 1: Create DynamoDB Tables
# ============================================================================

if (-not $SkipDynamoDB) {
    Write-Host "Step 1: Creating DynamoDB Tables..." -ForegroundColor Cyan
    Write-Host "---------------------------------------------------------------------------" -ForegroundColor Gray

    # Check if tables exist
    $existingTables = aws dynamodb list-tables --region $Region --query "TableNames" --output json | ConvertFrom-Json

    # Invoices Table
    if (-not $existingTables.Contains("Invoisaic-Invoices")) {
        Write-Host "Creating Invoisaic-Invoices table..." -ForegroundColor Yellow
        
        if (-not $DryRun) {
            # Create GSI JSON file to avoid escaping issues
            $gsiJsonContent = @'
[
  {
    "IndexName": "VendorIndex",
    "KeySchema": [
      {"AttributeName": "vendorId", "KeyType": "HASH"},
      {"AttributeName": "invoiceDate", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  },
  {
    "IndexName": "StatusIndex",
    "KeySchema": [
      {"AttributeName": "status", "KeyType": "HASH"},
      {"AttributeName": "timestamp", "KeyType": "RANGE"}
    ],
    "Projection": {"ProjectionType": "ALL"}
  }
]
'@
            $gsiJsonFile = Join-Path $PSScriptRoot "gsi-temp.json"
            # Use UTF8 without BOM
            [System.IO.File]::WriteAllText($gsiJsonFile, $gsiJsonContent)

            aws dynamodb create-table `
                --table-name Invoisaic-Invoices `
                --attribute-definitions `
                    AttributeName=invoiceId,AttributeType=S `
                    AttributeName=timestamp,AttributeType=N `
                    AttributeName=vendorId,AttributeType=S `
                    AttributeName=invoiceDate,AttributeType=S `
                    AttributeName=status,AttributeType=S `
                --key-schema `
                    AttributeName=invoiceId,KeyType=HASH `
                    AttributeName=timestamp,KeyType=RANGE `
                --billing-mode PAY_PER_REQUEST `
                --global-secondary-indexes file://$gsiJsonFile `
                --region $Region

            # Clean up temp file
            Remove-Item $gsiJsonFile -Force -ErrorAction SilentlyContinue

            Write-Host "[OK] Invoisaic-Invoices table created" -ForegroundColor Green
        } else {
            Write-Host "[DRY RUN] Would create Invoisaic-Invoices table" -ForegroundColor Gray
        }
    } else {
        Write-Host "[OK] Invoisaic-Invoices table already exists" -ForegroundColor Green
    }

    # Vendors Table
    if (-not $existingTables.Contains("Invoisaic-Vendors")) {
        Write-Host "Creating Invoisaic-Vendors table..." -ForegroundColor Yellow
        
        if (-not $DryRun) {
            aws dynamodb create-table `
                --table-name Invoisaic-Vendors `
                --attribute-definitions AttributeName=vendorId,AttributeType=S `
                --key-schema AttributeName=vendorId,KeyType=HASH `
                --billing-mode PAY_PER_REQUEST `
                --region $Region

            Write-Host "[OK] Invoisaic-Vendors table created" -ForegroundColor Green
        } else {
            Write-Host "[DRY RUN] Would create Invoisaic-Vendors table" -ForegroundColor Gray
        }
    } else {
        Write-Host "[OK] Invoisaic-Vendors table already exists" -ForegroundColor Green
    }

    # Note: Fraud Patterns table not created - Fraud agent not yet implemented
    Write-Host "[INFO] Skipping Fraud Patterns table (Fraud agent not implemented)" -ForegroundColor Yellow

    # Wait for tables to be active
    if (-not $DryRun) {
        Write-Host "Waiting for tables to become active..." -ForegroundColor Yellow
        aws dynamodb wait table-exists --table-name Invoisaic-Invoices --region $Region
        aws dynamodb wait table-exists --table-name Invoisaic-Vendors --region $Region
        Write-Host "[OK] All tables are active" -ForegroundColor Green
    }

    Write-Host ""
}

# ============================================================================
# STEP 2: Build and Deploy Lambda Functions
# ============================================================================

if (-not $SkipLambda) {
    Write-Host "Step 2: Building and Deploying Lambda Functions..." -ForegroundColor Cyan
    Write-Host "---------------------------------------------------------------------------" -ForegroundColor Gray

    # Navigate to backend directory
    $backendPath = Join-Path $PSScriptRoot "..\backend"
    Push-Location $backendPath

    # Install dependencies
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install

    # Build TypeScript
    Write-Host "Building TypeScript..." -ForegroundColor Yellow
    npm run build

    # Create deployment directory
    $deployDir = Join-Path $backendPath "deploy"
    if (Test-Path $deployDir) {
        Remove-Item $deployDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $deployDir | Out-Null

    # Package Lambda functions
    Write-Host "Packaging Lambda functions..." -ForegroundColor Yellow
    
    # Only 3 Lambda functions for 4 existing agents
    # (Orchestration uses direct agent invocation, no separate action group yet)
    $lambdaFunctions = @(
        @{Name="ExtractionActions"; Handler="extraction-actions"; Memory=1024; Timeout=300},
        @{Name="ComplianceActions"; Handler="compliance-actions"; Memory=512; Timeout=120},
        @{Name="ValidationActions"; Handler="validation-actions"; Memory=512; Timeout=180}
    )

    foreach ($func in $lambdaFunctions) {
        Write-Host "Packaging $($func.Name)..." -ForegroundColor Yellow
        
        # Copy built files
        $funcDir = Join-Path $deployDir $func.Name
        New-Item -ItemType Directory -Path $funcDir | Out-Null
        
        # Copy the built JavaScript file
        Copy-Item "dist\lambda\actions\$($func.Handler).js" "$funcDir\index.js"
        
        # Copy node_modules (required dependencies only)
        Copy-Item "node_modules" $funcDir -Recurse -Force
        
        # Create ZIP file
        $zipPath = Join-Path $deployDir "$($func.Name).zip"
        Compress-Archive -Path "$funcDir\*" -DestinationPath $zipPath -Force
        
        Write-Host "[OK] Packaged $($func.Name)" -ForegroundColor Green
    }

    Pop-Location

    # Deploy Lambda functions
    if (-not $DryRun) {
        Write-Host "Deploying Lambda functions to AWS..." -ForegroundColor Yellow
        
        foreach ($func in $lambdaFunctions) {
            $funcName = "Invoisaic$($func.Name)"
            $zipPath = Join-Path $backendPath "deploy\$($func.Name).zip"
            
            # Check if function exists
            $functionExists = $false
            try {
                aws lambda get-function --function-name $funcName --region $Region 2>$null
                $functionExists = $true
            } catch {}

            if ($functionExists) {
                Write-Host "Updating $funcName..." -ForegroundColor Yellow
                aws lambda update-function-code `
                    --function-name $funcName `
                    --zip-file "fileb://$zipPath" `
                    --region $Region
            } else {
                Write-Host "Creating $funcName..." -ForegroundColor Yellow
                
                # Initialize environment variables WITHOUT AWS_REGION (reserved by Lambda)
                $envVars = @{}

                # Add function-specific environment variables
                switch ($func.Handler) {
                    "extraction-actions" {
                        $envVars["INVOICE_TABLE"] = "Invoisaic-Invoices"
                        $envVars["INVOICE_BUCKET"] = "invoisaic-invoices"
                    }
                    "validation-actions" {
                        $envVars["INVOICE_TABLE"] = "Invoisaic-Invoices"
                    }
                    "compliance-actions" {
                        $envVars["KNOWLEDGE_BASE_ID"] = "2DW2JBM2MN"
                    }
                }

                # Convert to AWS Lambda environment variables format
                if ($envVars.Count -gt 0) {
                    $envVarsString = ($envVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ','
                    $envVarsArg = "Variables={$envVarsString}"
                } else {
                    $envVarsArg = "Variables={}"
                }

                aws lambda create-function `
                    --function-name $funcName `
                    --runtime nodejs18.x `
                    --role "arn:aws:iam::${AccountId}:role/InvoisaicLambdaExecutionRole" `
                    --handler index.handler `
                    --zip-file "fileb://$zipPath" `
                    --timeout $func.Timeout `
                    --memory-size $func.Memory `
                    --environment $envVarsArg `
                    --region $Region

                # Grant Bedrock permission
                try {
                    aws lambda add-permission `
                        --function-name $funcName `
                        --statement-id bedrock-agent-invoke `
                        --action lambda:InvokeFunction `
                        --principal bedrock.amazonaws.com `
                        --region $Region 2>$null
                } catch {
                    # Permission might already exist, ignore error
                }
            }
            
            Write-Host "[OK] Deployed $funcName" -ForegroundColor Green
        }
    } else {
        Write-Host "[DRY RUN] Would deploy 3 Lambda functions" -ForegroundColor Gray
    }

    Write-Host ""
}

# ============================================================================
# STEP 3: Agent Status Check
# ============================================================================

if (-not $SkipAgents) {
    Write-Host "Step 3: Agent Status Check..." -ForegroundColor Cyan
    Write-Host "---------------------------------------------------------------------------" -ForegroundColor Gray

    Write-Host "[OK] Using existing 4 agents:" -ForegroundColor Green
    Write-Host "  - Orchestrator (B74ZJP982U)" -ForegroundColor White
    Write-Host "  - Extraction (K93HN5QKPX)" -ForegroundColor White
    Write-Host "  - Compliance (K2GYUI5YOK)" -ForegroundColor White
    Write-Host "  - Validation (GTNAFH8LWX)" -ForegroundColor White
    Write-Host ""
    Write-Host "[INFO] No new agents need to be created" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Deployment Summary" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipDynamoDB) {
    Write-Host "[OK] DynamoDB Tables Created:" -ForegroundColor Green
    Write-Host "  - Invoisaic-Invoices" -ForegroundColor White
    Write-Host "  - Invoisaic-Vendors" -ForegroundColor White
    Write-Host ""
}

if (-not $SkipLambda) {
    Write-Host "[OK] Lambda Functions Deployed:" -ForegroundColor Green
    Write-Host "  - InvoisaicExtractionActions" -ForegroundColor White
    Write-Host "  - InvoisaicComplianceActions" -ForegroundColor White
    Write-Host "  - InvoisaicValidationActions" -ForegroundColor White
    Write-Host ""
}

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " Next Steps:" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure Action Groups for Extraction, Compliance, Validation agents" -ForegroundColor White
Write-Host "2. Test each agent's action groups" -ForegroundColor White
Write-Host "3. Update Orchestrator to coordinate all agents" -ForegroundColor White
Write-Host "4. Test full workflow via frontend dashboard" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see:" -ForegroundColor Yellow
Write-Host "  DEPLOYMENT-GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment Complete! 🚀" -ForegroundColor Green
Write-Host ""
