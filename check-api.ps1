# Check API Gateway deployment
Write-Host "Checking API Gateway..." -ForegroundColor Cyan

$stackName = "InvoisaicStack-dev"

try {
    $stack = aws cloudformation describe-stacks --stack-name $stackName --output json | ConvertFrom-Json
    $outputs = $stack.Stacks[0].Outputs
    
    $apiUrl = ($outputs | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue
    
    if ($apiUrl) {
        Write-Host "`n✅ API Gateway Found!" -ForegroundColor Green
        Write-Host "`nAPI URL: $apiUrl" -ForegroundColor Yellow
        Write-Host "`nTesting API Gateway..." -ForegroundColor Cyan
        
        # Test the API
        try {
            $response = Invoke-WebRequest -Uri $apiUrl -Method GET -UseBasicParsing -TimeoutSec 5
            Write-Host "✅ API Gateway is accessible!" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  API Gateway exists but may not be responding" -ForegroundColor Yellow
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        Write-Host "`nUpdate Vercel with:" -ForegroundColor Cyan
        Write-Host "VITE_API_URL=$apiUrl" -ForegroundColor White
    } else {
        Write-Host "`n❌ API URL not found in stack outputs" -ForegroundColor Red
    }
    
    # List all outputs
    Write-Host "`n📋 All Stack Outputs:" -ForegroundColor Cyan
    foreach ($output in $outputs) {
        Write-Host "  $($output.OutputKey): $($output.OutputValue)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the stack is deployed: cd infrastructure && cdk deploy --all" -ForegroundColor Yellow
}
