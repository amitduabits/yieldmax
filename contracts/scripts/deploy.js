const hre = require("hardhat");

async function main() {
  console.log("Deploying YieldMax contracts...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy Mock USDC
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const usdc = await MockERC20.deploy("USD Coin", "USDC", 6);
  await usdc.deployed();
  console.log("Mock USDC deployed to:", usdc.address);
  
  // Deploy Mock CCIP Router
  const MockCCIPRouter = await hre.ethers.getContractFactory("MockCCIPRouter");
  const ccipRouter = await MockCCIPRouter.deploy();
  await ccipRouter.deployed();
  console.log("Mock CCIP Router deployed to:", ccipRouter.address);
  
  console.log("\nDeployment complete!");
  console.log("Save these addresses in your .env file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
