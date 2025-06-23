#!/bin/bash

echo "🚀 YieldMax Complete Deployment Script"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f contracts/.env ]; then
    echo -e "${RED}❌ Error: contracts/.env file not found${NC}"
    echo "Please create contracts/.env from contracts/.env.example"
    exit 1
fi

# Deploy to Sepolia
echo -e "\n${GREEN}📦 Deploying to Sepolia...${NC}"
cd contracts
npx hardhat run scripts/deploy/deploy-sepolia.ts --network sepolia

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Sepolia deployment failed${NC}"
    exit 1
fi

# Deploy to Arbitrum Sepolia
echo -e "\n${GREEN}📦 Deploying to Arbitrum Sepolia...${NC}"
npx hardhat run scripts/deploy/deploy-arbitrum.ts --network arbitrumSepolia

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Arbitrum deployment failed${NC}"
    exit 1
fi

# Setup Chainlink services
echo -e "\n${GREEN}🔗 Setting up Chainlink services...${NC}"
npx hardhat run scripts/setup/setup-automation.ts --network sepolia
npx hardhat run scripts/setup/setup-ccip.ts --network sepolia

# Verify contracts
echo -e "\n${GREEN}✅ Verifying contracts...${NC}"
npx hardhat run scripts/verify/verify-all.ts --network sepolia

echo -e "\n${GREEN}✨ Deployment complete!${NC}"
echo "Check deployments/ folder for contract addresses"