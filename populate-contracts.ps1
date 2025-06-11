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
