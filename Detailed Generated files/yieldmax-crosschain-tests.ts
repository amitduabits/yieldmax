// ==================== CROSS-CHAIN INTEGRATION TEST FRAMEWORK ====================

import { ethers } from "hardhat";
import { expect } from "chai";
import axios from "axios";
import { ChainlinkClient } from "./utils/chainlink-client";
import { CCIPSimulator } from "./utils/ccip-simulator";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// ==================== CROSS-CHAIN TEST CONFIGURATION ====================

const CHAIN_CONFIGS = {
  ethereum: {
    chainId: 1,
    rpc: process.env.ETHEREUM_FORK_RPC || "http://localhost:8545",
    ccipRouter: "0xE561d5E02207fb5eB32cca20a699E0d8919a1476",
    linkToken: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    blockTime: 12
  },
  arbitrum: {
    chainId: 42161,
    rpc: process.env.ARBITRUM_FORK_RPC || "http://localhost:8546",
    ccipRouter: "0x067Fe86Fdd9a14d24a3c5CB5Cc5A5b8FB0CCc0E3",
    linkToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    blockTime: 0.25
  },
  polygon: {
    chainId: 137,
    rpc: process.env.POLYGON_FORK_RPC || "http://localhost:8547",
    ccipRouter: "0x3C3D92629A02a8D95D5CB9650fe49C3544f69B43",
    linkToken: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1",
    blockTime: 2
  },
  optimism: {
    chainId: 10,
    rpc: process.env.OPTIMISM_FORK_RPC || "http://localhost:8548",
    ccipRouter: "0x27F39D0af3303703750D4001fCc1844c6491563c",
    linkToken: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6",
    blockTime: 2
  }
};

// ==================== CROSS-CHAIN SCENARIO TESTS ====================

describe("Cross-Chain Integration Tests", function () {
  let deployments: Map<string, any>;
  let ccipSimulator: CCIPSimulator;
  let chainlinkClient: ChainlinkClient;
  
  before(async function () {
    this.timeout(600000); // 10 minutes for setup
    
    // Deploy on all chains
    deployments = new Map();
    for (const [chainName, config] of Object.entries(CHAIN_CONFIGS)) {
      console.log(`Deploying on ${chainName}...`);
      const deployment = await deployOnChain(chainName, config);
      deployments.set(chainName, deployment);
    }
    
    // Setup CCIP simulator
    ccipSimulator = new CCIPSimulator(deployments);
    await ccipSimulator.initialize();
    
    // Setup Chainlink client
    chainlinkClient = new ChainlinkClient({
      dataStreams: process.env.CHAINLINK_DATA_STREAMS_URL,
      functions: process.env.CHAINLINK_FUNCTIONS_URL,
      automation: process.env.CHAINLINK_AUTOMATION_URL
    });
  });
  
  describe("Multi-Chain Rebalancing", function () {
    it("Should execute 4-chain rebalancing within 5 minutes", async function () {
      this.timeout(600000);
      
      const startTime = Date.now();
      const rebalanceAmount = ethers.utils.parseUnits("10000", 6);
      
      // Setup initial positions on all chains
      for (const [chainName, deployment] of deployments) {
        await setupPosition(deployment, rebalanceAmount);
      }
      
      // Execute multi-chain rebalancing
      const rebalanceInstructions = [
        { from: "ethereum", to: "arbitrum", amount: rebalanceAmount.div(4) },
        { from: "polygon", to: "optimism", amount: rebalanceAmount.div(4) },
        { from: "arbitrum", to: "polygon", amount: rebalanceAmount.div(4) },
        { from: "optimism", to: "ethereum", amount: rebalanceAmount.div(4) }
      ];
      
      const executionPromises = rebalanceInstructions.map(async (instruction) => {
        return executeRebalance(
          deployments.get(instruction.from),
          deployments.get(instruction.to),
          instruction.amount
        );
      });
      
      // Wait for all rebalances to complete
      const results = await Promise.all(executionPromises);
      
      // Verify timing
      const executionTime = Date.now() - startTime;
      expect(executionTime).to.be.lessThan(300000); // 5 minutes
      
      // Verify all succeeded
      results.forEach(result => {
        expect(result.success).to.be.true;
        expect(result.messageDelivered).to.be.true;
      });
      
      // Verify final balances
      await verifyFinalBalances(deployments, rebalanceAmount);
    });
    
    it("Should handle chain-specific gas optimization", async function () {
      const gasUsage = new Map<string, number>();
      
      // Measure gas on each chain
      for (const [chainName, deployment] of deployments) {
        const tx = await deployment.vault.deposit(
          ethers.utils.parseUnits("1000", 6),
          deployment.owner.address
        );
        const receipt = await tx.wait();
        gasUsage.set(chainName, receipt.gasUsed.toNumber());
      }
      
      // Verify Arbitrum uses least gas
      const arbitrumGas = gasUsage.get("arbitrum")!;
      const ethereumGas = gasUsage.get("ethereum")!;
      
      expect(arbitrumGas).to.be.lessThan(ethereumGas / 5);
      
      // Verify batching works on all chains
      for (const [chainName, deployment] of deployments) {
        const batchGas = await measureBatchGas(deployment);
        const individualGas = gasUsage.get(chainName)! * 10;
        
        expect(batchGas).to.be.lessThan(individualGas * 0.4); // 60% savings
      }
    });
  });
  
  describe("Cross-Chain Message Reliability", function () {
    it("Should handle message failures and retries", async function () {
      // Simulate CCIP outage
      ccipSimulator.simulateOutage("arbitrum", 60); // 60 second outage
      
      const ethereumDeployment = deployments.get("ethereum");
      const arbitrumDeployment = deployments.get("arbitrum");
      
      // Send message during outage
      const messagePromise = sendCrossChainMessage(
        ethereumDeployment,
        arbitrumDeployment,
        "test_payload"
      );
      
      // Should retry automatically
      const result = await messagePromise;
      expect(result.retries).to.be.greaterThan(0);
      expect(result.delivered).to.be.true;
    });
    
    it("Should prevent duplicate message processing", async function () {
      const polygonDeployment = deployments.get("polygon");
      const optimismDeployment = deployments.get("optimism");
      
      const messageId = ethers.utils.randomBytes(32);
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address"],
        [1000, polygonDeployment.owner.address]
      );
      
      // Send same message twice
      await ccipSimulator.deliverMessage(
        optimismDeployment.router.address,
        messageId,
        polygonDeployment.router.address,
        payload
      );
      
      // Second delivery should fail
      await expect(
        ccipSimulator.deliverMessage(
          optimismDeployment.router.address,
          messageId,
          polygonDeployment.router.address,
          payload
        )
      ).to.be.revertedWith("Already processed");
    });
  });
  
  describe("Yield Data Synchronization", function () {
    it("Should maintain yield data consistency across chains", async function () {
      // Update yield data via Chainlink
      const yieldUpdates = {
        aave: { ethereum: 3.2, arbitrum: 4.5, polygon: 3.8, optimism: 4.1 },
        compound: { ethereum: 2.9, arbitrum: 5.2, polygon: 4.1, optimism: 4.3 }
      };
      
      await chainlinkClient.pushYieldData(yieldUpdates);
      
      // Verify all chains receive updates
      for (const [chainName, deployment] of deployments) {
        const strategyEngine = deployment.strategyEngine;
        
        for (const [protocol, yields] of Object.entries(yieldUpdates)) {
          const chainYield = yields[chainName as keyof typeof yields];
          const storedYield = await strategyEngine.getProtocolYield(protocol, chainName);
          
          expect(storedYield).to.be.closeTo(
            ethers.utils.parseUnits(chainYield.toString(), 8),
            ethers.utils.parseUnits("0.01", 8) // 0.01% tolerance
          );
        }
      }
    });
    
    it("Should trigger rebalancing on significant yield changes", async function () {
      // Setup monitoring
      const ethereumDeployment = deployments.get("ethereum");
      const arbitrumDeployment = deployments.get("arbitrum");
      
      // Initial yield state
      await chainlinkClient.pushYieldData({
        aave: { ethereum: 3.0, arbitrum: 3.1 }
      });
      
      // Wait for initial state
      await time.increase(300); // 5 minutes
      
      // Significant yield change on Arbitrum
      await chainlinkClient.pushYieldData({
        aave: { ethereum: 3.0, arbitrum: 6.5 } // >2% difference
      });
      
      // Should trigger automatic rebalancing
      const rebalanceEvent = await waitForEvent(
        ethereumDeployment.vault,
        "RebalanceTriggered",
        60000 // 1 minute timeout
      );
      
      expect(rebalanceEvent.args.reason).to.equal("yield_differential");
      expect(rebalanceEvent.args.fromChain).to.equal(1); // Ethereum
      expect(rebalanceEvent.args.toChain).to.equal(42161); // Arbitrum
    });
  });
