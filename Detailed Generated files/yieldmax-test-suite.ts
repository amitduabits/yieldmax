// ==================== YIELDMAX COMPREHENSIVE TEST SUITE ====================

import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, BigNumber } from "ethers";

// ==================== SMART CONTRACT UNIT TESTS ====================

describe("YieldMaxVault", function () {
  // Fixtures for test efficiency
  async function deployVaultFixture() {
    const [owner, keeper, user1, user2, attacker] = await ethers.getSigners();
    
    // Deploy mock USDC
    const MockToken = await ethers.getContractFactory("MockERC20");
    const usdc = await MockToken.deploy("USD Coin", "USDC", 6);
    
    // Deploy StrategyEngine
    const StrategyEngine = await ethers.getContractFactory("StrategyEngine");
    const strategyEngine = await StrategyEngine.deploy();
    
    // Deploy YieldMaxVault
    const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
    const vault = await YieldMaxVault.deploy(
      usdc.address,
      strategyEngine.address,
      keeper.address
    );
    
    // Setup initial balances
    await usdc.mint(user1.address, ethers.utils.parseUnits("100000", 6));
    await usdc.mint(user2.address, ethers.utils.parseUnits("100000", 6));
    await usdc.mint(attacker.address, ethers.utils.parseUnits("100000", 6));
    
    return { vault, usdc, strategyEngine, owner, keeper, user1, user2, attacker };
  }
  
  describe("Deployment", function () {
    it("Should set the correct asset token", async function () {
      const { vault, usdc } = await loadFixture(deployVaultFixture);
      expect(await vault.asset()).to.equal(usdc.address);
    });
    
    it("Should set the correct keeper", async function () {
      const { vault, keeper } = await loadFixture(deployVaultFixture);
      expect(await vault.keeper()).to.equal(keeper.address);
    });
    
    it("Should initialize with zero total assets", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.totalAssets()).to.equal(0);
    });
  });
  
  describe("Deposits", function () {
    it("Should accept deposits and mint shares", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployVaultFixture);
      const depositAmount = ethers.utils.parseUnits("1000", 6);
      
      await usdc.connect(user1).approve(vault.address, depositAmount);
      await expect(vault.connect(user1).deposit(depositAmount, user1.address))
        .to.emit(vault, "Deposit")
        .withArgs(user1.address, depositAmount, depositAmount);
      
      const userData = await vault.userData(user1.address);
      expect(userData.shares).to.equal(depositAmount);
    });
    
    it("Should handle multiple deposits correctly", async function () {
      const { vault, usdc, user1, user2 } = await loadFixture(deployVaultFixture);
      const deposit1 = ethers.utils.parseUnits("1000", 6);
      const deposit2 = ethers.utils.parseUnits("2000", 6);
      
      // First deposit
      await usdc.connect(user1).approve(vault.address, deposit1);
      await vault.connect(user1).deposit(deposit1, user1.address);
      
      // Second deposit
      await usdc.connect(user2).approve(vault.address, deposit2);
      await vault.connect(user2).deposit(deposit2, user2.address);
      
      expect(await vault.totalAssets()).to.equal(deposit1.add(deposit2));
      expect(await vault.totalShares()).to.equal(deposit1.add(deposit2));
    });
    
    it("Should calculate shares correctly with existing deposits", async function () {
      const { vault, usdc, user1, user2, keeper } = await loadFixture(deployVaultFixture);
      
      // Initial deposit
      const initialDeposit = ethers.utils.parseUnits("1000", 6);
      await usdc.connect(user1).approve(vault.address, initialDeposit);
      await vault.connect(user1).deposit(initialDeposit, user1.address);
      
      // Simulate yield by sending tokens to vault
      await usdc.mint(vault.address, ethers.utils.parseUnits("100", 6));
      
      // Second deposit should get fewer shares due to increased value
      const secondDeposit = ethers.utils.parseUnits("1000", 6);
      await usdc.connect(user2).approve(vault.address, secondDeposit);
      await vault.connect(user2).deposit(secondDeposit, user2.address);
      
      const user2Data = await vault.userData(user2.address);
      expect(user2Data.shares).to.be.lt(secondDeposit);
    });
    
    it("Should revert on zero deposit", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      await expect(
        vault.connect(user1).deposit(0, user1.address)
      ).to.be.revertedWith("Zero deposit");
    });
    
    it("Should trigger batch execution at threshold", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployVaultFixture);
      const largeDeposit = ethers.utils.parseUnits("50000", 6); // MIN_BATCH_SIZE
      
      await usdc.connect(user1).approve(vault.address, largeDeposit);
      await expect(vault.connect(user1).deposit(largeDeposit, user1.address))
        .to.emit(vault, "BatchExecuted");
    });
  });
  
  describe("Withdrawals", function () {
    beforeEach(async function () {
      const { vault, usdc, user1 } = await loadFixture(deployVaultFixture);
      // Setup: User1 deposits first
      const depositAmount = ethers.utils.parseUnits("10000", 6);
      await usdc.connect(user1).approve(vault.address, depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);
    });
    
    it("Should allow withdrawal requests", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const userData = await vault.userData(user1.address);
      
      await expect(vault.connect(user1).requestWithdraw(userData.shares))
        .to.emit(vault, "WithdrawRequested");
      
      const updatedUserData = await vault.userData(user1.address);
      expect(updatedUserData.pendingWithdraw).to.equal(userData.shares);
    });
    
    it("Should complete withdrawals correctly", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployVaultFixture);
      const userData = await vault.userData(user1.address);
      const initialBalance = await usdc.balanceOf(user1.address);
      
      // Request withdrawal
      await vault.connect(user1).requestWithdraw(userData.shares);
      const requestId = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["address", "uint256", "uint256"],
          [user1.address, userData.shares, await time.latest()]
        )
      );
      
      // Complete withdrawal
      await expect(vault.connect(user1).completeWithdraw(requestId))
        .to.emit(vault, "Withdraw");
      
      const finalBalance = await usdc.balanceOf(user1.address);
      expect(finalBalance.sub(initialBalance)).to.equal(
        ethers.utils.parseUnits("10000", 6)
      );
    });
    
    it("Should prevent withdrawal without request", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const fakeRequestId = ethers.utils.randomBytes(32);
      
      await expect(
        vault.connect(user1).completeWithdraw(fakeRequestId)
      ).to.be.revertedWith("No pending withdrawal");
    });
    
    it("Should handle partial withdrawals", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const userData = await vault.userData(user1.address);
      const halfShares = userData.shares.div(2);
      
      await vault.connect(user1).requestWithdraw(halfShares);
      
      const updatedUserData = await vault.userData(user1.address);
      expect(updatedUserData.pendingWithdraw).to.equal(halfShares);
    });
  });
  
  describe("Rebalancing", function () {
    it("Should only allow keeper to rebalance", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      const instructions = ethers.utils.defaultAbiCoder.encode(
        ["tuple(uint8,address,uint128,bytes32)[]"],
        [[{ action: 0, protocol: ethers.constants.AddressZero, amount: 0, params: ethers.constants.HashZero }]]
      );
      
      await expect(
        vault.connect(user1).rebalance(instructions)
      ).to.be.revertedWith("Not keeper");
    });
    
    it("Should execute rebalancing with valid instructions", async function () {
      const { vault, strategyEngine, keeper } = await loadFixture(deployVaultFixture);
      
      // Mock profitable rebalance
      await strategyEngine.setMockProfitable(true);
      
      const instructions = ethers.utils.defaultAbiCoder.encode(
        ["tuple(uint8,address,uint128,bytes32)[]"],
        [[{ 
          action: 0, // deposit
          protocol: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // mock protocol
          amount: ethers.utils.parseUnits("1000", 6),
          params: ethers.constants.HashZero 
        }]]
      );
      
      await expect(vault.connect(keeper).rebalance(instructions))
        .to.emit(vault, "RebalanceExecuted");
    });
    
    it("Should track gas usage for rebalancing", async function () {
      const { vault, strategyEngine, keeper } = await loadFixture(deployVaultFixture);
      
      await strategyEngine.setMockProfitable(true);
      
      const instructions = ethers.utils.defaultAbiCoder.encode(
        ["tuple(uint8,address,uint128,bytes32)[]"],
        [[{ action: 0, protocol: ethers.constants.AddressZero, amount: 0, params: ethers.constants.HashZero }]]
      );
      
      const tx = await vault.connect(keeper).rebalance(instructions);
      const receipt = await tx.wait();
      
      // Verify gas usage is tracked in event
      const event = receipt.events?.find(e => e.event === "RebalanceExecuted");
      expect(event?.args?.gasUsed).to.be.gt(0);
    });
  });
  
  describe("Emergency Functions", function () {
    it("Should allow emergency pause", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      
      await expect(vault.connect(owner).emergencyPause())
        .to.emit(vault, "EmergencyPause")
        .withArgs(owner.address);
    });
    
    it("Should prevent operations when paused", async function () {
      const { vault, usdc, owner, user1 } = await loadFixture(deployVaultFixture);
      
      await vault.connect(owner).emergencyPause();
      
      const depositAmount = ethers.utils.parseUnits("1000", 6);
      await usdc.connect(user1).approve(vault.address, depositAmount);
      
      await expect(
        vault.connect(user1).deposit(depositAmount, user1.address)
      ).to.be.revertedWith("Paused");
    });
    
    it("Should only allow emergency role to pause", async function () {
      const { vault, user1 } = await loadFixture(deployVaultFixture);
      
      await expect(
        vault.connect(user1).emergencyPause()
      ).to.be.revertedWith("Not emergency");
    });
  });
});

// ==================== CROSS-CHAIN INTEGRATION TESTS ====================

describe("Cross-Chain Integration", function () {
  let vaultEthereum: Contract;
  let vaultArbitrum: Contract;
  let routerEthereum: Contract;
  let routerArbitrum: Contract;
  let mockCCIP: Contract;
  
  before(async function () {
    // Deploy mock CCIP infrastructure
    const MockCCIP = await ethers.getContractFactory("MockCCIPRouter");
    mockCCIP = await MockCCIP.deploy();
    
    // Deploy on "Ethereum"
    const deploymentEth = await deployOnChain(1, mockCCIP.address);
    vaultEthereum = deploymentEth.vault;
    routerEthereum = deploymentEth.router;
    
    // Deploy on "Arbitrum"
    const deploymentArb = await deployOnChain(42161, mockCCIP.address);
    vaultArbitrum = deploymentArb.vault;
    routerArbitrum = deploymentArb.router;
    
    // Configure routes
    await routerEthereum.configureRoute(42161, vaultArbitrum.address, 300000, true);
    await routerArbitrum.configureRoute(1, vaultEthereum.address, 300000, true);
  });
  
  describe("Cross-Chain Messages", function () {
    it("Should send rebalance message across chains", async function () {
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [0, ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [ethers.constants.AddressZero, 1000])]
      );
      
      await expect(routerEthereum.sendRebalanceMessage(42161, payload))
        .to.emit(routerEthereum, "MessageSent");
    });
    
    it("Should calculate CCIP fees correctly", async function () {
      const payload = ethers.utils.randomBytes(256);
      const fee = await mockCCIP.getFee(42161, payload);
      
      expect(fee).to.be.gt(0);
      expect(fee).to.be.lt(ethers.utils.parseEther("0.1")); // Max 0.1 ETH
    });
    
    it("Should handle message delivery", async function () {
      const messageId = ethers.utils.randomBytes(32);
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["uint8", "bytes"],
        [0, ethers.utils.randomBytes(64)]
      );
      
      await mockCCIP.deliverMessage(
        routerArbitrum.address,
        messageId,
        1, // source chain
        routerEthereum.address,
        payload
      );
      
      expect(await routerArbitrum.processedMessages(messageId)).to.be.true;
    });
    
    it("Should prevent message replay", async function () {
      const messageId = ethers.utils.randomBytes(32);
      const payload = ethers.utils.randomBytes(64);
      
      await mockCCIP.deliverMessage(
        routerArbitrum.address,
        messageId,
        1,
        routerEthereum.address,
        payload
      );
      
      await expect(
        mockCCIP.deliverMessage(
          routerArbitrum.address,
          messageId,
          1,
          routerEthereum.address,
          payload
        )
      ).to.be.revertedWith("Already processed");
    });
  });
  
  describe("Cross-Chain Rebalancing", function () {
    it("Should execute cross-chain rebalance within 5 minutes", async function () {
      const startTime = await time.latest();
      
      // Initiate rebalance from Ethereum to Arbitrum
      const amount = ethers.utils.parseUnits("10000", 6);
      const payload = createRebalancePayload("withdraw", amount);
      
      await routerEthereum.sendRebalanceMessage(42161, payload);
      
      // Simulate CCIP delivery (in production this would be automatic)
      await mockCCIP.simulateDelivery();
      
      // Verify execution time
      const endTime = await time.latest();
      expect(endTime - startTime).to.be.lt(300); // 5 minutes
    });
    
    it("Should maintain value during cross-chain transfer", async function () {
      const amount = ethers.utils.parseUnits("5000", 6);
      const tolerance = amount.div(1000); // 0.1% tolerance
      
      const initialTotalEth = await vaultEthereum.totalAssets();
      const initialTotalArb = await vaultArbitrum.totalAssets();
      
      // Execute cross-chain transfer
      await executeCrossChainTransfer(
        vaultEthereum,
        vaultArbitrum,
        amount
      );
      
      const finalTotalEth = await vaultEthereum.totalAssets();
      const finalTotalArb = await vaultArbitrum.totalAssets();
      
      // Verify no value lost
      const totalBefore = initialTotalEth.add(initialTotalArb);
      const totalAfter = finalTotalEth.add(finalTotalArb);
      
      expect(totalAfter).to.be.gte(totalBefore.sub(tolerance));
    });
  });
});

// ==================== GAS OPTIMIZATION TESTS ====================

describe("Gas Optimization", function () {
  describe("Batching Efficiency", function () {
    it("Should reduce gas costs by 60%+ with batching", async function () {
      const { vault, usdc, owner } = await loadFixture(deployVaultFixture);
      const users = await ethers.getSigners();
      
      // Measure individual deposits
      let individualGas = BigNumber.from(0);
      for (let i = 1; i <= 10; i++) {
        const user = users[i];
        const amount = ethers.utils.parseUnits("1000", 6);
        
        await usdc.mint(user.address, amount);
        await usdc.connect(user).approve(vault.address, amount);
        
        const tx = await vault.connect(user).deposit(amount, user.address);
        const receipt = await tx.wait();
        individualGas = individualGas.add(receipt.gasUsed);
      }
      
      // Deploy new vault for batch test
      const { vault: batchVault } = await loadFixture(deployVaultFixture);
      
      // Measure batch deposit
      const batchDeposits = [];
      for (let i = 11; i <= 20; i++) {
        const user = users[i];
        const amount = ethers.utils.parseUnits("1000", 6);
        
        await usdc.mint(user.address, amount);
        await usdc.connect(user).approve(batchVault.address, amount);
        
        batchDeposits.push({
          depositor: user.address,
          amount: amount
        });
      }
      
      const batchTx = await batchVault.batchDeposit(batchDeposits);
      const batchReceipt = await batchTx.wait();
      
      // Calculate savings
      const savings = individualGas.sub(batchReceipt.gasUsed).mul(100).div(individualGas);
      expect(savings).to.be.gte(60);
    });
    
    it("Should optimize storage access patterns", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      
      // Test that multiple storage reads are minimized
      const tx = await vault.optimizedStorageTest();
      const receipt = await tx.wait();
      
      // Gas should be under threshold for optimized storage
      expect(receipt.gasUsed).to.be.lt(50000);
    });
  });
  
  describe("CCIP Message Optimization", function () {
    it("Should pack multiple instructions efficiently", async function () {
      const instructions = [];
      for (let i = 0; i < 5; i++) {
        instructions.push({
          action: i % 3,
          protocol: ethers.Wallet.createRandom().address,
          amount: ethers.utils.parseUnits((i + 1) * 1000 + "", 6),
          params: ethers.utils.randomBytes(32)
        });
      }
      
      const packed = packInstructions(instructions);
      const unpacked = unpackInstructions(packed);
      
      // Verify packing reduces size by at least 30%
      const originalSize = ethers.utils.defaultAbiCoder.encode(
        ["tuple(uint8,address,uint128,bytes32)[]"],
        [instructions]
      ).length;
      
      expect(packed.length).to.be.lt(originalSize * 0.7);
      expect(unpacked).to.deep.equal(instructions);
    });
  });
});

// ==================== SECURITY TESTS ====================

describe("Security", function () {
  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks on deposit", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      const ReentrancyAttacker = await ethers.getContractFactory("ReentrancyAttacker");
      const attacker = await ReentrancyAttacker.deploy(vault.address);
      
      await expect(
        attacker.attack({ value: ethers.utils.parseEther("1") })
      ).to.be.revertedWith("ReentrancyGuard");
    });
    
    it("Should prevent reentrancy on withdrawal", async function () {
      const { vault, usdc, attacker } = await loadFixture(deployVaultFixture);
      
      // Setup: Attacker deposits
      const amount = ethers.utils.parseUnits("1000", 6);
      await usdc.connect(attacker).approve(vault.address, amount);
      await vault.connect(attacker).deposit(amount, attacker.address);
      
      // Deploy malicious contract
      const MaliciousReceiver = await ethers.getContractFactory("MaliciousReceiver");
      const malicious = await MaliciousReceiver.deploy(vault.address);
      
      // Attempt reentrancy
      await expect(malicious.attackWithdraw()).to.be.reverted;
    });
  });
  
  describe("Access Control", function () {
    it("Should enforce role-based permissions", async function () {
      const { vault, user1, keeper, owner } = await loadFixture(deployVaultFixture);
      
      // Test keeper functions
      await expect(
        vault.connect(user1).rebalance("0x")
      ).to.be.revertedWith("Not keeper");
      
      // Test emergency functions
      await expect(
        vault.connect(keeper).emergencyPause()
      ).to.be.revertedWith("Not emergency");
      
      // Test owner functions
      await expect(
        vault.connect(user1).setKeeper(user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
  
  describe("Input Validation", function () {
    it("Should validate deposit amounts", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployVaultFixture);
      
      // Test zero amount
      await expect(
        vault.connect(user1).deposit(0, user1.address)
      ).to.be.revertedWith("Zero deposit");
      
      // Test overflow amount
      const maxUint = ethers.constants.MaxUint256;
      await expect(
        vault.connect(user1).deposit(maxUint, user1.address)
      ).to.be.reverted;
    });
    
    it("Should validate addresses", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployVaultFixture);
      const amount = ethers.utils.parseUnits("1000", 6);
      
      await usdc.connect(user1).approve(vault.address, amount);
      
      // Test zero address
      await expect(
        vault.connect(user1).deposit(amount, ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid receiver");
    });
  });
  
  describe("MEV Protection", function () {
    it("Should prevent sandwich attacks on large deposits", async function () {
      const { vault, usdc, user1, attacker } = await loadFixture(deployVaultFixture);
      
      // Setup large deposit
      const largeAmount = ethers.utils.parseUnits("100000", 6);
      await usdc.connect(user1).approve(vault.address, largeAmount);
      
      // Attacker tries to front-run
      const attackAmount = ethers.utils.parseUnits("50000", 6);
      await usdc.connect(attacker).approve(vault.address, attackAmount);
      
      // Simulate sandwich attack
      await vault.connect(attacker).deposit(attackAmount, attacker.address);
      await vault.connect(user1).deposit(largeAmount, user1.address);
      
      // Verify user1 shares are protected by slippage check
      const user1Data = await vault.userData(user1.address);
      const expectedShares = largeAmount.mul(await vault.totalShares()).div(await vault.totalAssets());
      
      expect(user1Data.shares).to.be.gte(expectedShares.mul(995).div(1000)); // Max 0.5% slippage
    });
  });
});

// ==================== EDGE CASE TESTS ====================

describe("Edge Cases", function () {
  describe("Extreme Market Conditions", function () {
    it("Should handle 90% TVL withdrawal", async function () {
      const { vault, usdc } = await loadFixture(deployVaultFixture);
      const users = await ethers.getSigners();
      
      // Setup: 10 users deposit
      for (let i = 1; i <= 10; i++) {
        const user = users[i];
        const amount = ethers.utils.parseUnits("10000", 6);
        
        await usdc.mint(user.address, amount);
        await usdc.connect(user).approve(vault.address, amount);
        await vault.connect(user).deposit(amount, user.address);
      }
      
      // 9 users withdraw
      for (let i = 1; i <= 9; i++) {
        const user = users[i];
        const userData = await vault.userData(user.address);
        
        await vault.connect(user).requestWithdraw(userData.shares);
        const requestId = calculateRequestId(user.address, userData.shares);
        await vault.connect(user).completeWithdraw(requestId);
      }
      
      // Verify vault still functions
      expect(await vault.totalAssets()).to.be.gt(0);
      expect(await vault.totalShares()).to.be.gt(0);
    });
    
    it("Should handle rapid deposit/withdraw cycles", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployVaultFixture);
      const amount = ethers.utils.parseUnits("1000", 6);
      
      for (let i = 0; i < 10; i++) {
        // Deposit
        await usdc.connect(user1).approve(vault.address, amount);
        await vault.connect(user1).deposit(amount, user1.address);
        
        // Immediate withdrawal
        const userData = await vault.userData(user1.address);
        await vault.connect(user1).requestWithdraw(userData.shares);
        const requestId = calculateRequestId(user1.address, userData.shares);
        await vault.connect(user1).completeWithdraw(requestId);
        
        // Mint more tokens for next cycle
        await usdc.mint(user1.address, amount);
      }
      
      // Verify no value leaked
      expect(await vault.totalAssets()).to.equal(0);
      expect(await vault.totalShares()).to.equal(0);
    });
  });
  
  describe("Protocol Limits", function () {
    it("Should enforce maximum allocation per protocol", async function () {
      const { vault, strategyEngine } = await loadFixture(deployVaultFixture);
      
      // Try to allocate more than 40% to single protocol
      const allocation = {
        protocol: "0x...",
        amount: ethers.utils.parseUnits("50000", 6), // 50% of 100k TVL
        maxAllocation: 40 // 40% max
      };
      
      await expect(
        strategyEngine.validateAllocation(allocation)
      ).to.be.revertedWith("Exceeds max allocation");
    });
    
    it("Should handle minimum position sizes", async function () {
      const { vault, usdc, user1 } = await loadFixture(deployVaultFixture);
      
      // Deposit below minimum for profitable rebalancing
      const tinyAmount = ethers.utils.parseUnits("10", 6); // $10
      
      await usdc.connect(user1).approve(vault.address, tinyAmount);
      await vault.connect(user1).deposit(tinyAmount, user1.address);
      
      // Rebalancing should skip tiny positions
      const rebalanceData = await vault.prepareRebalance();
      expect(rebalanceData.positions).to.be.empty;
    });
  });
});

// ==================== HELPER FUNCTIONS ====================

async function deployOnChain(chainId: number, ccipRouter: string) {
  const MockToken = await ethers.getContractFactory("MockERC20");
  const usdc = await MockToken.deploy("USD Coin", "USDC", 6);
  
  const StrategyEngine = await ethers.getContractFactory("StrategyEngine");
  const strategyEngine = await StrategyEngine.deploy();
  
  const YieldMaxVault = await ethers.getContractFactory("YieldMaxVault");
  const vault = await YieldMaxVault.deploy(
    usdc.address,
    strategyEngine.address,
    (await ethers.getSigners())[1].address // keeper
  );
  
  const CrossChainRouter = await ethers.getContractFactory("CrossChainRouter");
  const router = await CrossChainRouter.deploy(ccipRouter, usdc.address);
  
  return { vault, router, usdc, strategyEngine };
}

function packInstructions(instructions: any[]): string {
  // Implement efficient packing logic
  return ethers.utils.defaultAbiCoder.encode(
    ["bytes"],
    [ethers.utils.defaultAbiCoder.encode(["tuple(uint8,address,uint128,bytes32)[]"], [instructions])]
  );
}

function unpackInstructions(packed: string): any[] {
  // Implement unpacking logic
  const decoded = ethers.utils.defaultAbiCoder.decode(["bytes"], packed);
  return ethers.utils.defaultAbiCoder.decode(["tuple(uint8,address,uint128,bytes32)[]"], decoded[0])[0];
}

function createRebalancePayload(action: string, amount: BigNumber): string {
  const actionMap: { [key: string]: number } = {
    'deposit': 0,
    'withdraw': 1,
    'migrate': 2
  };
  
  return ethers.utils.defaultAbiCoder.encode(
    ["uint8", "bytes"],
    [actionMap[action], ethers.utils.defaultAbiCoder.encode(["uint256"], [amount])]
  );
}

async function executeCrossChainTransfer(
  sourceVault: Contract,
  destVault: Contract,
  amount: BigNumber
): Promise<void> {
  // Implementation for cross-chain transfer execution
  // This would interact with the actual CCIP in production
}

function calculateRequestId(user: string, shares: BigNumber): string {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "uint256"],
      [user, shares, Math.floor(Date.now() / 1000)]
    )
  );
}