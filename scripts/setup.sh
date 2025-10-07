#!/bin/bash

# Invoisaic Setup Script
# This script sets up the development environment

set -e

echo "🛠️  Setting up Invoisaic Development Environment..."
echo "=================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Copy environment file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created frontend/.env - Please update with your values${NC}"
fi

cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Copy environment file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created backend/.env - Please update with your values${NC}"
fi

cd ..

# Install infrastructure dependencies
echo "📦 Installing infrastructure dependencies..."
cd infrastructure
npm install
echo -e "${GREEN}✓ Infrastructure dependencies installed${NC}"

cd ..

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Configure AWS credentials: aws configure"
echo "2. Update environment files with your AWS values"
echo "3. Run './scripts/deploy.sh' to deploy to AWS"
echo "4. Or run 'npm run dev' for local development"
echo ""
