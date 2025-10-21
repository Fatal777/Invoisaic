Write-Host "Starting deployment..." -ForegroundColor Green
Set-Location infrastructure
cdk deploy --require-approval never
Write-Host "Deployment complete!" -ForegroundColor Green
