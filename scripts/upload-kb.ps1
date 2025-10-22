# Upload Compliance Documents to S3 for Bedrock Knowledge Base
# Region: ap-south-1 (Mumbai)
# Account: 202533497839

$REGION = "ap-south-1"
$ACCOUNT_ID = "202533497839"
$BUCKET_NAME = "invoisaic-knowledge-base-$ACCOUNT_ID"
$DOCS_PATH = "..\knowledge-base\documents"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Invoisaic Knowledge Base Setup" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host "Bucket: $BUCKET_NAME" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create S3 bucket
Write-Host "Step 1: Creating S3 bucket..." -ForegroundColor Green
try {
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Bucket created successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Bucket may already exist (this is OK)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ Bucket creation failed, it may already exist" -ForegroundColor Yellow
}

# Step 2: Enable versioning
Write-Host ""
Write-Host "Step 2: Enabling versioning..." -ForegroundColor Green
aws s3api put-bucket-versioning --bucket $BUCKET_NAME --versioning-configuration Status=Enabled --region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Versioning enabled" -ForegroundColor Green
} else {
    Write-Host "  ✗ Versioning failed" -ForegroundColor Red
}

# Step 3: Upload compliance documents
Write-Host ""
Write-Host "Step 3: Uploading compliance documents..." -ForegroundColor Green
Write-Host "  Source: $DOCS_PATH" -ForegroundColor Yellow

$files = @(
    "us-tax-compliance.txt",
    "germany-vat-compliance.txt",
    "uk-vat-compliance.txt",
    "india-gst-compliance.txt"
)

foreach ($file in $files) {
    Write-Host "  Uploading $file..." -ForegroundColor Cyan
    aws s3 cp "$DOCS_PATH\$file" "s3://$BUCKET_NAME/compliance/$file" --region $REGION
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✓ $file uploaded" -ForegroundColor Green
    } else {
        Write-Host "    ✗ $file upload failed" -ForegroundColor Red
    }
}

# Step 4: Verify uploads
Write-Host ""
Write-Host "Step 4: Verifying uploads..." -ForegroundColor Green
aws s3 ls "s3://$BUCKET_NAME/compliance/" --region $REGION

# Step 5: Display summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Upload Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Bucket: s3://$BUCKET_NAME" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host "Documents uploaded: $($files.Count)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Create OpenSearch Serverless collection in ap-south-1" -ForegroundColor White
Write-Host "2. Create Bedrock Knowledge Base" -ForegroundColor White
Write-Host "3. Link to S3 bucket: $BUCKET_NAME" -ForegroundColor White
Write-Host "4. Use data source path: s3://$BUCKET_NAME/compliance/" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: docs/opensearch-setup-ap-south-1.md" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
