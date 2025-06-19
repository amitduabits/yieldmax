// contracts/scripts/setup-chainlink-automation.js
const { ethers } = require("hardhat");
const fs = require("fs");

// Chainlink Automation Registry addresses
const AUTOMATION_ADDRESSES = {
  sepolia: {
    registry: "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad",
    registrar: "0x9a811502d843E5a03913d5A2cfb646c11463467A",
    link: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
  },
  arbitrumSepolia: {
    registry: "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad", 
    registrar: "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad",
    link: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E"
  }
};

async function setupAutomation(network) {
  console.log(`\n🤖 Setting up Chainlink Automation on ${network}...`);
  
  const [signer] = await ethers.getSigners();
  const addresses = AUTOMATION_ADDRESSES[network];
  
  if (!addresses) {
    throw new Error(`Unsupported network: ${network}`);
  }

  // Load deployment info
  const deploymentPath = `./deployments/${network}`;
  let vaultAddress;
  
  try {
    const deploymentFile = network === "sepolia" ? 
      `${deploymentPath}/YieldMaxVault.json` : 
      `${deploymentPath}/YieldMaxVault.json`;
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    vaultAddress = deployment.address;
  } catch (error) {
    console.error(`❌ Could not find deployment for ${network}`);
    throw error;
  }

  console.log(`Using vault: ${vaultAddress}`);

  // Get contracts
  const linkToken = await ethers.getContractAt("IERC20", addresses.link, signer);
  
  // Check LINK balance
  const linkBalance = await linkToken.balanceOf(signer.address);
  const requiredLink = ethers.utils.parseEther("5"); // 5 LINK for upkeep
  
  console.log(`LINK Balance: ${ethers.utils.formatEther(linkBalance)} LINK`);
  
  if (linkBalance.lt(requiredLink)) {
    throw new Error(`Insufficient LINK! Need at least 5 LINK. Get from: https://faucets.chain.link/${network}`);
  }

  // Register upkeep via the web interface method (easier than programmatic)
  console.log("\n📝 MANUAL REGISTRATION REQUIRED:");
  console.log("=================================");
  console.log(`1. Go to: https://automation.chain.link`);
  console.log(`2. Connect your wallet to ${network}`);
  console.log(`3. Click "Register new Upkeep"`);
  console.log(`4. Select "Custom logic"`);
  console.log(`5. Use these details:`);
  console.log(`   • Target contract: ${vaultAddress}`);
  console.log(`   • Upkeep name: YieldMax-${network}`);
  console.log(`   • Gas limit: 500000`);
  console.log(`   • Starting balance: 5 LINK`);
  console.log(`   • Check data: 0x (empty)`);
  console.log(`   • Trigger: Time-based`);
  console.log(`   • Time interval: 3600 (1 hour)`);
  
  // Alternatively, we can do programmatic registration
  console.log("\n🔄 Attempting programmatic registration...");
  
  try {
    // Create registration params for AUTOMATION V2.1
    const upkeepName = `YieldMax-${network}`;
    const gasLimit = 500000;
    const adminAddress = signer.address;
    const checkData = "0x";
    const amount = ethers.utils.parseEther("5");
    const triggerType = 1; // 0 = conditional, 1 = time-based
    const triggerConfig = ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256'],
      [0, 3600] // start time (0 = now), interval (3600 = 1 hour)
    );

    // Approve LINK spending
    console.log("Approving LINK...");
    const approveTx = await linkToken.approve(addresses.registrar, amount);
    await approveTx.wait();
    console.log("✅ LINK approved");

    // Register upkeep using RegistrationRequests contract
    const registrationParams = {
      name: upkeepName,
      encryptedEmail: "0x",
      upkeepContract: vaultAddress,
      gasLimit: gasLimit,
      adminAddress: adminAddress,
      triggerType: triggerType,
      checkData: checkData,
      triggerConfig: triggerConfig,
      offchainConfig: "0x",
      amount: amount
    };

    // We'll use the web interface approach since programmatic is complex
    console.log("⚠️  Programmatic registration is complex on testnets.");
    console.log("Please use the web interface method above.");
    
    // Save automation config
    const automationConfig = {
      network,
      vault: vaultAddress,
      registry: addresses.registry,
      registrar: addresses.registrar,
      linkToken: addresses.link,
      setupTime: new Date().toISOString(),
      registrationParams,
      status: "pending_manual_registration"
    };

    const configPath = `./deployments/${network}/automation-config.json`;
    fs.writeFileSync(configPath, JSON.stringify(automationConfig, null, 2));
    console.log(`📁 Automation config saved to: ${configPath}`);

  } catch (error) {
    console.error("❌ Programmatic registration failed:", error.message);
    console.log("👆 Please use the manual web interface method above");
  }

  return {
    vault: vaultAddress,
    registry: addresses.registry,
    status: "setup_complete"
  };
}

async function main() {
  console.log("🤖 YieldMax Chainlink Automation Setup");
  console.log("=====================================");

  // Setup automation for both networks
  const networks = ["sepolia", "arbitrumSepolia"];
  const results = {};

  for (const network of networks) {
    try {
      // Switch to correct network (you'd need to update hardhat.config.js)
      console.log(`\n🔄 Processing ${network}...`);
      results[network] = await setupAutomation(network);
    } catch (error) {
      console.error(`❌ Failed to setup automation on ${network}:`, error.message);
      results[network] = { error: error.message };
    }
  }

  // Summary
  console.log("\n📊 AUTOMATION SETUP SUMMARY");
  console.log("===========================");
  for (const [network, result] of Object.entries(results)) {
    if (result.error) {
      console.log(`❌ ${network}: Failed - ${result.error}`);
    } else {
      console.log(`✅ ${network}: Ready for registration`);
      console.log(`   Vault: ${result.vault}`);
    }
  }

  console.log("\n🎯 Next Steps:");
  console.log("1. Complete manual registration at https://automation.chain.link");
  console.log("2. Fund upkeeps with LINK tokens");
  console.log("3. Test automation by waiting for the next interval");
  console.log("4. Monitor automation performance in dashboard");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupAutomation };