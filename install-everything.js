const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Installing YieldMax - Complete Setup\n');

// Function to run commands
function runCommand(command, cwd = '.') {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    console.log('✅ Success\n');
  } catch (error) {
    console.log('❌ Failed, trying with --legacy-peer-deps\n');
    execSync(command + ' --legacy-peer-deps', { cwd, stdio: 'inherit' });
  }
}

// Step 1: Install root dependencies
console.log('📦 Installing root dependencies...');
runCommand('npm install --legacy-peer-deps');

// Step 2: Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
runCommand('npm install', 'frontend');

// Step 3: Install contracts dependencies
console.log('📦 Installing contracts dependencies...');
runCommand('npm install', 'contracts');

// Step 4: Create .env files if they don't exist
console.log('📝 Creating environment files...');

const envContent = `# Get your API keys from:
# Alchemy: https://alchemy.com
# WalletConnect: https://cloud.walletconnect.com

# Frontend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID_HERE
NEXT_PUBLIC_ALCHEMY_API_KEY=YOUR_ALCHEMY_KEY_HERE

# Contracts
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY_HERE
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env');
}

if (!fs.existsSync('frontend/.env')) {
  fs.writeFileSync('frontend/.env', envContent);
  console.log('✅ Created frontend/.env');
}

if (!fs.existsSync('contracts/.env')) {
  fs.writeFileSync('contracts/.env', envContent);
  console.log('✅ Created contracts/.env');
}

console.log('\n✅ Installation complete!');
console.log('\n📋 Next steps:');
console.log('1. Edit .env files with your API keys');
console.log('2. Run: npm run dev');
console.log('3. Open http://localhost:3000');