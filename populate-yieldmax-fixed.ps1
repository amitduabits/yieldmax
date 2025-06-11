# populate-yieldmax-fixed.ps1
Write-Host "Populating YieldMax with all code files..." -ForegroundColor Green

# Helper function to write content to file
function Write-FileContent {
    param(
        [string]$Path,
        [string]$Content
    )
    # Create directory if it doesn't exist
    $dir = Split-Path -Parent $Path
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    # Write content
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "Created: $Path" -ForegroundColor Yellow
}

# ==================== ROOT FILES ====================

# Root package.json
$rootPackageContent = '{
  "name": "yieldmax-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "contracts", "backend"],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "test": "npm run test:contracts && npm run test:frontend",
    "test:contracts": "cd contracts && npm test",
    "test:frontend": "cd frontend && npm test",
    "build": "npm run build:contracts && npm run build:frontend",
    "build:contracts": "cd contracts && npm run compile",
    "build:frontend": "cd frontend && npm run build"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}'
Write-FileContent -Path "package.json" -Content $rootPackageContent

# .gitignore
$gitignoreContent = '# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Production
build/
dist/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Hardhat
cache/
artifacts/
typechain/
typechain-types/

# Next.js
.next/
next-env.d.ts

# Deployment
deployments/localhost/'
Write-FileContent -Path ".gitignore" -Content $gitignoreContent

# .env.example
$envExampleContent = '# Blockchain RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
OPTIMISM_RPC_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY

# Private Keys (NEVER commit real keys!)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
KEEPER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# API Keys
ETHERSCAN_API_KEY=YOUR_KEY
ARBISCAN_API_KEY=YOUR_KEY
POLYGONSCAN_API_KEY=YOUR_KEY
OPTIMISM_API_KEY=YOUR_KEY

# Chainlink
CHAINLINK_DATA_STREAMS_URL=https://api.chain.link/v1/data-streams
CHAINLINK_FUNCTIONS_URL=https://api.chain.link/v1/functions
CHAINLINK_AUTOMATION_URL=https://api.chain.link/v1/automation

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

# API Configuration
API_PORT=3001
API_BASE_URL=http://localhost:3001'
Write-FileContent -Path ".env.example" -Content $envExampleContent

# ==================== SEPARATE FILE CREATION SCRIPTS ====================

Write-Host "`nBase files created. Now run these separate scripts for each section:" -ForegroundColor Cyan

# Create separate script for frontend files
$frontendScript = @'
# populate-frontend.ps1
Write-Host "Creating frontend files..." -ForegroundColor Green

function Write-FileContent {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "Created: $Path" -ForegroundColor Yellow
}

# Frontend package.json
$packageJson = @"
{
  "name": "yieldmax-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:e2e": "playwright test",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "styled-components": "^6.1.0",
    "framer-motion": "^10.16.0",
    "recharts": "^2.9.0",
    "lucide-react": "^0.292.0",
    "ethers": "^5.7.2",
    "wagmi": "^1.4.0",
    "viem": "^1.19.0",
    "@rainbow-me/rainbowkit": "^1.3.0",
    "axios": "^1.6.0",
    "@tanstack/react-query": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "@types/styled-components": "^5.1.0",
    "typescript": "^5.0.0",
    "@playwright/test": "^1.40.0",
    "@chainsafe/dappeteer": "^5.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
"@
Write-FileContent -Path "frontend\package.json" -Content $packageJson

# Create other frontend config files
Write-Host "Frontend files created!" -ForegroundColor Green
'@
Set-Content -Path "populate-frontend.ps1" -Value $frontendScript -Encoding UTF8

# Create separate script for contract files
$contractsScript = @'
# populate-contracts.ps1
Write-Host "Creating contract files..." -ForegroundColor Green

function Write-FileContent {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "Created: $Path" -ForegroundColor Yellow
}

# Contracts package.json
$packageJson = @"
{
  "name": "yieldmax-contracts",
  "version": "1.0.0",
  "scripts": {
    "compile": "hardhat compile",
    "test": "hardhat test",
    "deploy": "hardhat run scripts/deploy.js",
    "deploy:testnet": "hardhat run scripts/deploy-testnet.js",
    "verify": "hardhat verify",
    "coverage": "hardhat coverage"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^3.0.0",
    "@chainlink/hardhat-chainlink": "^0.0.1",
    "@chainlink/contracts": "^0.8.0",
    "@openzeppelin/contracts": "^4.9.0",
    "@openzeppelin/contracts-upgradeable": "^4.9.0",
    "hardhat": "^2.19.0",
    "ethers": "^5.7.0",
    "chai": "^4.3.0",
    "dotenv": "^16.0.0",
    "@types/mocha": "^10.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
"@
Write-FileContent -Path "contracts\package.json" -Content $packageJson

# Create MockERC20.sol
$mockERC20 = @"
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) public {
        _burn(from, amount);
    }
}
"@
Write-FileContent -Path "contracts\contracts\mocks\MockERC20.sol" -Content $mockERC20

Write-Host "Contract files created!" -ForegroundColor Green
'@
Set-Content -Path "populate-contracts.ps1" -Value $contractsScript -Encoding UTF8

# Create separate script for source files
$sourceScript = @'
# populate-source.ps1
Write-Host "Creating source files..." -ForegroundColor Green

function Write-FileContent {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "Created: $Path" -ForegroundColor Yellow
}

# Create app layout
$layoutContent = @"
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YieldMax - Cross-Chain DeFi Yield Optimizer',
  description: 'Maximize your DeFi yields across multiple chains with AI-powered optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
"@
Write-FileContent -Path "frontend\src\app\layout.tsx" -Content $layoutContent

# Create app page
$pageContent = @"
export default function Home() {
  return (
    <div>
      <h1>YieldMax Dashboard</h1>
      <p>Cross-Chain DeFi Yield Optimizer</p>
    </div>
  );
}
"@
Write-FileContent -Path "frontend\src\app\page.tsx" -Content $pageContent

Write-Host "Source files created!" -ForegroundColor Green
'@
Set-Content -Path "populate-source.ps1" -Value $sourceScript -Encoding UTF8

Write-Host "`nScripts created successfully!" -ForegroundColor Green
Write-Host "`nNow run these in order:" -ForegroundColor Cyan
Write-Host "1. .\populate-frontend.ps1" -ForegroundColor Yellow
Write-Host "2. .\populate-contracts.ps1" -ForegroundColor Yellow
Write-Host "3. .\populate-source.ps1" -ForegroundColor Yellow