const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Complete YieldMax System to Testnet...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH\n");
  
  // Deploy Mock USDC
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.deployed();
  console.log("✅ Mock USDC:", usdc.address);
  
  // Deploy Mock Chainlink Services
  const MockAutomation = await hre.ethers.getContractFactory("MockAutomation");
  const automation = await MockAutomation.deploy();
  await automation.deployed();
  console.log("✅ Mock Automation:", automation.address);
  
  const MockFunctions = await hre.ethers.getContractFactory("MockFunctions");
  const functions = await MockFunctions.deploy();
  await functions.deployed();
  console.log("✅ Mock Functions:", functions.address);
  
  const MockDataStreams = await hre.ethers.getContractFactory("MockDataStreams");
  const dataStreams = await MockDataStreams.deploy();
  await dataStreams.deployed();
  console.log("✅ Mock Data Streams:", dataStreams.address);
  
  // Deploy Mock CCIP Router
  const MockCCIPRouter = await hre.ethers.getContractFactory("MockCCIPRouter");
  const ccipRouter = await MockCCIPRouter.deploy();
  await ccipRouter.deployed();
  console.log("✅ Mock CCIP Router:", ccipRouter.address);
  
  // Deploy Core Contracts
  const StrategyEngine = await hre.ethers.getContractFactory("StrategyEngine");
  const strategyEngine = await StrategyEngine.deploy();
  await strategyEngine.deployed();
  console.log("✅ Strategy Engine:", strategyEngine.address);
  
  const YieldMaxVault = await hre.ethers.getContractFactory("YieldMaxVault");
  const vault = await YieldMaxVault.deploy(
    usdc.address,
    strategyEngine.address,
    deployer.address // keeper
  );
  await vault.deployed();
  console.log("✅ YieldMax Vault:", vault.address);
  
  // Setup initial data
  console.log("\n📝 Setting up initial data...");
  
  // Mint USDC to deployer
  await usdc.mint(deployer.address, ethers.utils.parseUnits("100000", 6));
  console.log("✅ Minted 100,000 USDC to deployer");
  
  // Register automation
  await automation.registerUpkeep(vault.address);
  console.log("✅ Registered vault for automation");
  
  // Save deployment info
  const deployment = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    contracts: {
      usdc: usdc.address,
      vault: vault.address,
      strategyEngine: strategyEngine.address,
      automation: automation.address,
      functions: functions.address,
      dataStreams: dataStreams.address,
      ccipRouter: ccipRouter.address
    }
  };
  
  const fs = require("fs");
  fs.writeFileSync(
    "deployments/sepolia-complete.json",
    JSON.stringify(deployment, null, 2)
  );
  
  console.log("\n✅ Deployment complete! Saved to deployments/sepolia-complete.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });