@echo off
REM Check Knowledge Base and Data Source Status
set KB_ID=2DW2JBM2MN
set REGION=ap-south-1

echo ========================================
echo Checking Knowledge Base Status
echo ========================================
echo.
echo Knowledge Base ID: %KB_ID%
echo Region: %REGION%
echo.

echo Step 1: Knowledge Base Details
echo --------------------------------
aws bedrock-agent get-knowledge-base --knowledge-base-id %KB_ID% --region %REGION% --query "{Name:name,Status:status,Description:description}" --output table

echo.
echo Step 2: Data Sources
echo --------------------------------
aws bedrock-agent list-data-sources --knowledge-base-id %KB_ID% --region %REGION% --query "dataSourceSummaries[*].{Name:name,Status:status,DataSourceId:dataSourceId}" --output table

echo.
echo Step 3: Get Data Source Details
echo --------------------------------
for /f "tokens=*" %%i in ('aws bedrock-agent list-data-sources --knowledge-base-id %KB_ID% --region %REGION% --query "dataSourceSummaries[0].dataSourceId" --output text') do set DATA_SOURCE_ID=%%i

if not "%DATA_SOURCE_ID%"=="" (
    echo Data Source ID: %DATA_SOURCE_ID%
    echo.
    echo Latest Ingestion Job:
    aws bedrock-agent list-ingestion-jobs --knowledge-base-id %KB_ID% --data-source-id %DATA_SOURCE_ID% --region %REGION% --max-results 1 --query "ingestionJobSummaries[0].{Status:status,StartedAt:startedAt,Statistics:statistics}" --output table
) else (
    echo No data source found
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo If sync is NOT completed:
echo   1. Go to Bedrock Console
echo   2. Click on your Knowledge Base
echo   3. Go to Data sources tab
echo   4. Click Sync button
echo.
echo If sync IS completed:
echo   - Proceed to create Bedrock Agents
echo.

pause
