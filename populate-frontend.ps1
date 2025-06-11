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
