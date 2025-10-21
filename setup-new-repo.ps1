# Setup New GitHub Repository
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting Up New GitHub Repository" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Remove old remote (if exists)
Write-Host "Step 1: Removing old remote..." -ForegroundColor Green
git remote remove origin 2>$null

# Step 2: Add new remote
Write-Host "Step 2: Adding new remote..." -ForegroundColor Green
git remote add origin https://github.com/Fatal777/Invoisaic.git

# Step 3: Verify remote
Write-Host "Step 3: Verifying remote..." -ForegroundColor Green
git remote -v

Write-Host ""
Write-Host "Step 4: Creating initial commit..." -ForegroundColor Green

# Make sure we're on master branch
git branch -M main

# Add all files (except .env files which are in .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: Invoisaic - AI-powered invoice management"

Write-Host ""
Write-Host "Step 5: Pushing to GitHub..." -ForegroundColor Green

# Push to new repository
git push -u origin main --force

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Repository Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository URL: https://github.com/Fatal777/Invoisaic" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Vercel to use the new repository" -ForegroundColor White
Write-Host "2. Redeploy on Vercel" -ForegroundColor White
Write-Host ""
