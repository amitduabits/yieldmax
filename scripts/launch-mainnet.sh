#!/bin/bash

echo "🚀 YieldMax Mainnet Launch Script"
echo "================================="

# Pre-flight checks
echo "⏳ Running pre-flight checks..."
node scripts/test-mainnet-fork.js
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Fix issues before deploying."
    exit 1
fi

# Deploy contracts
echo "📦 Deploying contracts to mainnet..."
npx hardhat run scripts/deploy-mainnet.js --network ethereum
npx hardhat run scripts/deploy-mainnet.js --network arbitrum

# Verify contracts
echo "✅ Verifying contracts..."
npx hardhat run scripts/verify-contracts.js --network ethereum
npx hardhat run scripts/verify-contracts.js --network arbitrum

# Setup Chainlink
echo "🔗 Setting up Chainlink services..."
node scripts/setup-chainlink-mainnet.js

# Initialize protocols
echo "🏦 Initializing DeFi protocols..."
npx hardhat run scripts/initialize-protocols.js --network ethereum

# Start monitoring
echo "📊 Starting monitoring services..."
pm2 start scripts/monitoring/event-monitor.js --name yieldmax-monitor

# Update frontend
echo "🎨 Updating frontend configuration..."
node scripts/update-frontend-config.js

echo "✅ Launch complete! YieldMax is LIVE on mainnet!"
echo ""
echo "📋 Next steps:"
echo "1. Monitor at: https://yieldmax.fi/admin"
echo "2. Check Chainlink: https://automation.chain.link"
echo "3. Tweet announcement: Ready to copy in launch-tweet.txt"
echo "4. Enable deposits in 1 hour after monitoring"