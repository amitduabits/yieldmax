const fs = require('fs');

// Fix contracts package.json to use compatible versions
const contractsPackage = {
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
    "@nomicfoundation/hardhat-toolbox": "^2.0.2",
    "@openzeppelin/contracts": "^4.9.0",
    "@openzeppelin/contracts-upgradeable": "^4.9.0",
    "hardhat": "^2.19.0",
    "ethers": "^5.7.2",
    "@nomiclabs/hardhat-ethers": "^2.2.3",
    "@nomiclabs/hardhat-waffle": "^2.0.6",
    "@nomiclabs/hardhat-etherscan": "^3.1.8",
    "chai": "^4.3.0",
    "ethereum-waffle": "^3.4.4",
    "dotenv": "^16.0.0",
    "@types/mocha": "^10.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0",
    "solidity-coverage": "^0.8.5",
    "@typechain/ethers-v5": "^10.2.1",
    "@typechain/hardhat": "^6.1.6",
    "typechain": "^8.3.2"
  }
};

fs.writeFileSync('contracts/package.json', JSON.stringify(contractsPackage, null, 2));
console.log('✅ Fixed contracts/package.json');