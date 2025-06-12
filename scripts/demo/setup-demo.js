// scripts/demo/setup-demo.js
const { ethers } = require('ethers');
const chalk = require('chalk');

// Demo configuration
const DEMO_CONFIG = {
  wallet: '0x1Ae0947c15b5d9dc74ad69E07A82725E71740603', // Your deployer wallet
  initialDeposit: '10000', // $10,000 USDC
  contracts: {
    usdc: '0x31D0c90C471F756FBC8a5E4f839d05bAF9a368dd',
    vault: '0xb8fBfe078fE486fD638478dC8C234003cEf8B452',
    strategyEngine: '0x6186d8180E85213fDEE20eb9f96ae94288Ff543d'
  },
  positions: [
    {
      protocol: 'Compound',
      chain: 'ethereum',
      amount: '10000',
      apy: 8.2
    }
  ]
};

async function setupDemo() {
  console.log(chalk.bold.cyan('\n🎯 Setting up YieldMax Demo Environment\n'));

  try {
    // Connect to provider
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log(chalk.yellow('Connected to Sepolia testnet'));
    console.log('Demo wallet:', signer.address);

    // Step 1: Mint demo USDC
    console.log(chalk.yellow('\n1. Minting demo USDC...'));
    await mintDemoTokens(signer);

    // Step 2: Approve contracts
    console.log(chalk.yellow('\n2. Approving contracts...'));
    await approveContracts(signer);

    // Step 3: Create initial position
    console.log(chalk.yellow('\n3. Creating initial position...'));
    await createInitialPosition(signer);

    // Step 4: Set up yield data
    console.log(chalk.yellow('\n4. Setting up yield data...'));
    await setupYieldData();

    console.log(chalk.bold.green('\n✅ Demo setup complete!'));
    console.log(chalk.cyan('\nDemo checklist:'));
    console.log('  ✓ 10,000 USDC in wallet');
    console.log('  ✓ Contracts approved');
    console.log('  ✓ Initial position created');
    console.log('  ✓ Yield data configured');
    console.log(chalk.bold('\n🚀 Ready for demo!'));

  } catch (error) {
    console.error(chalk.red('Setup failed:'), error);
    process.exit(1);
  }
}

async function mintDemoTokens(signer) {
  const usdcAbi = [
    'function mint(address to, uint256 amount) external',
    'function balanceOf(address account) view returns (uint256)'
  ];

  const usdc = new ethers.Contract(DEMO_CONFIG.contracts.usdc, usdcAbi, signer);
  
  // Mint 10,000 USDC (6 decimals)
  const amount = ethers.utils.parseUnits(DEMO_CONFIG.initialDeposit, 6);
  const tx = await usdc.mint(signer.address, amount);
  await tx.wait();

  const balance = await usdc.balanceOf(signer.address);
  console.log(chalk.green(`  ✓ Minted ${ethers.utils.formatUnits(balance, 6)} USDC`));
}

async function approveContracts(signer) {
  const usdcAbi = ['function approve(address spender, uint256 amount) external'];
  const usdc = new ethers.Contract(DEMO_CONFIG.contracts.usdc, usdcAbi, signer);

  // Approve vault
  const maxAmount = ethers.constants.MaxUint256;
  const tx = await usdc.approve(DEMO_CONFIG.contracts.vault, maxAmount);
  await tx.wait();

  console.log(chalk.green('  ✓ Approved YieldMax Vault'));
}

async function createInitialPosition(signer) {
  const vaultAbi = [
    'function deposit(uint256 assets, address receiver) external returns (uint256)'
  ];

  const vault = new ethers.Contract(DEMO_CONFIG.contracts.vault, vaultAbi, signer);
  
  // Deposit initial amount
  const amount = ethers.utils.parseUnits(DEMO_CONFIG.initialDeposit, 6);
  const tx = await vault.deposit(amount, signer.address);
  await tx.wait();

  console.log(chalk.green('  ✓ Deposited to YieldMax Vault'));
}

async function setupYieldData() {
  // This would update your backend/database with demo yield data
  const demoYields = {
    'ethereum': {
      'Compound': { apy: 8.2, tvl: 5e9, risk: 0.1 },
      'Aave': { apy: 7.8, tvl: 8e9, risk: 0.1 },
      'Yearn': { apy: 12.5, tvl: 1.2e9, risk: 0.2 }
    },
    'arbitrum': {
      'Aave V3': { apy: 8.5, tvl: 2.5e9, risk: 0.1 },
      'GMX': { apy: 15.7, tvl: 450e6, risk: 0.3 }, // Will spike to 21.2%
      'Curve': { apy: 9.2, tvl: 800e6, risk: 0.15 }
    },
    'polygon': {
      'Aave': { apy: 9.1, tvl: 1.8e9, risk: 0.1 },
      'Curve': { apy: 11.3, tvl: 1.2e9, risk: 0.15 }
    }
  };

  // Save to your backend
  console.log(chalk.green('  ✓ Yield data configured'));
}

// Run setup
setupDemo();

// scripts/demo/trigger-spike.js
const axios = require('axios');
const chalk = require('chalk');

async function triggerYieldSpike() {
  console.log(chalk.bold.yellow('\n⚡ Triggering Yield Spike!\n'));

  try {
    const response = await axios.post('http://localhost:3000/api/demo/trigger-yield-spike', {
      protocol: 'GMX',
      chain: 'Arbitrum',
      previousApy: 15.7,
      newApy: 21.2,
      confidence: 94
    });

    if (response.data.success) {
      console.log(chalk.green('✅ Yield spike triggered successfully!'));
      console.log(chalk.cyan('\nSpike Details:'));
      console.log(`  Protocol: ${response.data.spike.protocol}`);
      console.log(`  Chain: ${response.data.spike.chain}`);
      console.log(`  APY: ${response.data.spike.previousApy}% → ${response.data.spike.newApy}%`);
      console.log(`  Increase: +${(response.data.spike.newApy - response.data.spike.previousApy).toFixed(1)}%`);
      console.log(`  AI Confidence: ${response.data.spike.confidence}%`);
    }
  } catch (error) {
    console.error(chalk.red('Failed to trigger spike:'), error.message);
  }
}

// Add delay option
const delay = process.argv[2] ? parseInt(process.argv[2]) * 1000 : 0;

if (delay > 0) {
  console.log(chalk.yellow(`Waiting ${delay/1000} seconds before triggering...`));
  setTimeout(triggerYieldSpike, delay);
} else {
  triggerYieldSpike();
}

// scripts/demo/monitor-demo.js
const chalk = require('chalk');
const Table = require('cli-table3');

class DemoMonitor {
  constructor() {
    this.metrics = {
      totalValue: 10000,
      currentApy: 8.2,
      profit: 0,
      gasSpent: 0,
      rebalances: 0
    };
  }

  start() {
    console.clear();
    console.log(chalk.bold.cyan('YieldMax Demo Monitor\n'));

    // Update every second
    setInterval(() => {
      this.update();
      this.display();
    }, 1000);
  }

  update() {
    // Simulate profit accumulation
    const dailyRate = this.metrics.currentApy / 365 / 100;
    const secondlyProfit = (this.metrics.totalValue * dailyRate) / 86400;
    this.metrics.profit += secondlyProfit;
  }

  display() {
    console.clear();
    console.log(chalk.bold.cyan('YieldMax Demo Monitor\n'));

    const table = new Table({
      head: ['Metric', 'Value'],
      style: { head: ['cyan'] }
    });

    table.push(
      ['Total Value', chalk.green(`$${this.metrics.totalValue.toFixed(2)}`)],
      ['Current APY', chalk.yellow(`${this.metrics.currentApy.toFixed(2)}%`)],
      ['Profit', chalk.green(`+$${this.metrics.profit.toFixed(2)}`)],
      ['Gas Spent', chalk.red(`$${this.metrics.gasSpent.toFixed(2)}`)],
      ['Net Profit', chalk.bold.green(`+$${(this.metrics.profit - this.metrics.gasSpent).toFixed(2)}`)],
      ['Rebalances', this.metrics.rebalances]
    );

    console.log(table.toString());

    // Show tips
    console.log(chalk.dim('\nTips:'));
    console.log(chalk.dim('- Run "npm run demo:spike" to trigger yield opportunity'));
    console.log(chalk.dim('- Press Ctrl+C to exit'));
  }

  simulateRebalance() {
    this.metrics.rebalances++;
    this.metrics.gasSpent += 23.45; // Mock gas cost
    this.metrics.currentApy = 21.2; // New APY after rebalance
    this.metrics.totalValue += 50; // Instant profit from arbitrage
  }
}

// Start monitor
const monitor = new DemoMonitor();
monitor.start();

// Listen for spike events
process.on('message', (msg) => {
  if (msg.type === 'REBALANCE') {
    monitor.simulateRebalance();
  }
});