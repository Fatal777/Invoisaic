# Check if WebSocket API is deployed
Write-Host "Checking WebSocket deployment..." -ForegroundColor Cyan

# Check CloudFormation Stack
$stackName = "InvoisaicStack-dev"
try {
    $stack = aws cloudformation describe-stacks --stack-name $stackName --output json | ConvertFrom-Json
    $outputs = $stack.Stacks[0].Outputs
    
    $websocketUrl = ($outputs | Where-Object { $_.OutputKey -eq "WebSocketUrl" }).OutputValue
    
    if ($websocketUrl) {
        Write-Host "`n✅ WebSocket API is deployed!" -ForegroundColor Green
        Write-Host "`nWebSocket URL: $websocketUrl" -ForegroundColor Yellow
        Write-Host "`nAdd this to your Vercel environment variables:" -ForegroundColor Cyan
        Write-Host "VITE_WEBSOCKET_URL=$websocketUrl" -ForegroundColor White
    } else {
        Write-Host "`n❌ WebSocket URL not found in outputs" -ForegroundColor Red
        Write-Host "Run: cd infrastructure && cdk deploy --all" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`n❌ Stack not found or error occurred" -ForegroundColor Red
    Write-Host "Deploy the stack with: cd infrastructure && cdk deploy --all" -ForegroundColor Yellow
}
