@echo off
REM Upload Compliance Documents to S3 for Bedrock Knowledge Base
REM Region: ap-south-1 (Mumbai)
REM Account: 202533497839

set REGION=ap-south-1
set ACCOUNT_ID=202533497839
set BUCKET_NAME=invoisaic-knowledge-base-%ACCOUNT_ID%
set DOCS_PATH=..\knowledge-base\documents

echo ========================================
echo Invoisaic Knowledge Base Setup
echo Region: %REGION%
echo Bucket: %BUCKET_NAME%
echo ========================================
echo.

echo Step 1: Creating S3 bucket...
aws s3 mb s3://%BUCKET_NAME% --region %REGION% 2>nul
if %errorlevel% equ 0 (
    echo   [OK] Bucket created successfully
) else (
    echo   [WARN] Bucket may already exist - this is OK
)

echo.
echo Step 2: Enabling versioning...
aws s3api put-bucket-versioning --bucket %BUCKET_NAME% --versioning-configuration Status=Enabled --region %REGION%
if %errorlevel% equ 0 (
    echo   [OK] Versioning enabled
) else (
    echo   [ERROR] Versioning failed
)

echo.
echo Step 3: Uploading compliance documents...
echo   Source: %DOCS_PATH%

aws s3 cp "%DOCS_PATH%\us-tax-compliance.txt" "s3://%BUCKET_NAME%/compliance/us-tax-compliance.txt" --region %REGION%
echo   [OK] us-tax-compliance.txt uploaded

aws s3 cp "%DOCS_PATH%\germany-vat-compliance.txt" "s3://%BUCKET_NAME%/compliance/germany-vat-compliance.txt" --region %REGION%
echo   [OK] germany-vat-compliance.txt uploaded

aws s3 cp "%DOCS_PATH%\uk-vat-compliance.txt" "s3://%BUCKET_NAME%/compliance/uk-vat-compliance.txt" --region %REGION%
echo   [OK] uk-vat-compliance.txt uploaded

aws s3 cp "%DOCS_PATH%\india-gst-compliance.txt" "s3://%BUCKET_NAME%/compliance/india-gst-compliance.txt" --region %REGION%
echo   [OK] india-gst-compliance.txt uploaded

echo.
echo Step 4: Verifying uploads...
aws s3 ls s3://%BUCKET_NAME%/compliance/ --region %REGION%

echo.
echo ========================================
echo Upload Complete!
echo ========================================
echo Bucket: s3://%BUCKET_NAME%
echo Region: %REGION%
echo Documents uploaded: 4
echo.
echo Next Steps:
echo 1. Create OpenSearch Serverless collection in ap-south-1
echo 2. Create Bedrock Knowledge Base
echo 3. Link to S3 bucket: %BUCKET_NAME%
echo 4. Use data source path: s3://%BUCKET_NAME%/compliance/
echo.
echo For detailed instructions, see: docs\opensearch-setup-ap-south-1.md
echo ========================================
echo.
