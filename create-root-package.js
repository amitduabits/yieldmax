const fs = require('fs');

const rootPackage = {
  "name": "yieldmax-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["frontend", "contracts"],
  "scripts": {
    "dev": "cd frontend && npm run dev",
    "dev:all": "concurrently \"npm run dev:frontend\" \"npm run dev:contracts\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:contracts": "cd contracts && npx hardhat node",
    "build": "cd frontend && npm run build",
    "test": "npm run test:contracts && npm run test:frontend",
    "test:contracts": "cd contracts && npm test",
    "test:frontend": "cd frontend && npm test",
    "compile": "cd contracts && npx hardhat compile"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
};

fs.writeFileSync('package.json', JSON.stringify(rootPackage, null, 2));
console.log('✅ Created fresh package.json');