#!/bin/bash

# Invoisaic Deployment Script
# This script automates the deployment of the Invoisaic platform

set -e

echo "🚀 Starting Invoisaic Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ AWS CLI found: $(aws --version)${NC}"

# Check CDK
if ! command -v cdk &> /dev/null; then
    echo -e "${YELLOW}⚠ CDK not found. Installing...${NC}"
    npm install -g aws-cdk
fi
echo -e "${GREEN}✓ CDK found: $(cdk --version)${NC}"

# Verify AWS credentials
echo "🔐 Verifying AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi
echo -e "${GREEN}✓ AWS credentials verified${NC}"

# Get environment
ENVIRONMENT=${1:-dev}
echo "📦 Deploying to environment: $ENVIRONMENT"

# Install dependencies
echo "📥 Installing dependencies..."
npm run install:all
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Build backend
echo "🔨 Building backend..."
cd backend
npm run build
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Backend build failed${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✓ Backend built successfully${NC}"

# Deploy infrastructure
echo "☁️  Deploying infrastructure to AWS..."
cd infrastructure

# Bootstrap CDK if needed
echo "Checking CDK bootstrap..."
cdk bootstrap || echo "CDK already bootstrapped"

# Deploy stack
if [ "$ENVIRONMENT" == "prod" ]; then
    cdk deploy --all --require-approval never --context environment=prod
else
    cdk deploy --all --require-approval never --context environment=dev
fi

cd ..
echo -e "${GREEN}✓ Infrastructure deployed${NC}"

# Capture outputs
echo "📝 Capturing deployment outputs..."
cd infrastructure
OUTPUTS=$(cdk output --all)
echo "$OUTPUTS" > ../deployment-outputs.txt
cd ..

echo ""
echo "=================================="
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================="
echo ""
echo "📄 Deployment outputs saved to: deployment-outputs.txt"
echo ""
echo "Next steps:"
echo "1. Update frontend/.env with the deployment outputs"
echo "2. Create a test user in Cognito"
echo "3. Run 'cd frontend && npm run dev' to start the frontend"
echo ""
echo "For detailed instructions, see docs/DEPLOYMENT.md"
