import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { YieldMaxVault, MockERC20, StrategyEngine } from "../typechain-types";

describe("YieldMaxVault", function () {
  let vault: YieldMaxVault;
  let usdc: MockERC20;
  let strategyEngine: StrategyEngine;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let keeper: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2, keeper] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);

    // Deploy StrategyEngine
    const StrategyEngineFactory = await ethers.getContractFactory("StrategyEngine");
    strategyEngine = await StrategyEngineFactory.deploy();

    // Deploy Vault
    const VaultFactory = await ethers.getContractFactory("YieldMaxVault");
    vault = await VaultFactory.deploy(usdc.address, strategyEngine.address, keeper.address);

    // Setup
    await strategyEngine.authorizeVault(vault.address);
    await usdc.mint(user1.address, ethers.utils.parseUnits("10000", 6));
    await usdc.connect(user1).approve(vault.address, ethers.constants.MaxUint256);
  });

  describe("Deposits", function () {
    it("Should allow deposits and mint shares", async function () {
      const depositAmount = ethers.utils.parseUnits("1000", 6);
      
      await expect(vault.connect(user1).deposit(depositAmount, user1.address))
        .to.emit(vault, "Deposit")
        .withArgs(user1.address, user1.address, depositAmount, depositAmount);

      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
    });

    it("Should calculate shares correctly for subsequent deposits", async function () {
      const firstDeposit = ethers.utils.parseUnits("1000", 6);
      const secondDeposit = ethers.utils.parseUnits("500", 6);

      await vault.connect(user1).deposit(firstDeposit, user1.address);
      
      await usdc.mint(user2.address, secondDeposit);
      await usdc.connect(user2).approve(vault.address, ethers.constants.MaxUint256);
      await vault.connect(user2).deposit(secondDeposit, user2.address);

      expect(await vault.totalAssets()).to.equal(firstDeposit.add(secondDeposit));
    });

    it("Should revert on zero deposit", async function () {
      await expect(vault.connect(user1).deposit(0, user1.address))
        .to.be.revertedWith("Zero deposit");
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      const depositAmount = ethers.utils.parseUnits("1000", 6);
      await vault.connect(user1).deposit(depositAmount, user1.address);
    });

    it("Should allow withdrawals and burn shares", async function () {
      const withdrawAmount = ethers.utils.parseUnits("500", 6);
      
      await expect(vault.connect(user1).withdraw(withdrawAmount, user1.address, user1.address))
        .to.emit(vault, "Withdraw");

      expect(await usdc.balanceOf(user1.address)).to.equal(
        ethers.utils.parseUnits("9500", 6)
      );
    });

    it("Should enforce max withdrawal limit", async function () {
      const largeAmount = ethers.utils.parseUnits("200000", 6);
      
      await expect(vault.connect(user1).withdraw(largeAmount, user1.address, user1.address))
        .to.be.revertedWith("Exceeds max withdrawal");
    });
  });

  describe("Rebalancing", function () {
    it("Should only allow keeper to rebalance", async function () {
      await expect(vault.connect(user1).rebalance())
        .to.be.reverted;
    });

    it("Should enforce rebalance time delay", async function () {
      // First rebalance should work
      await vault.connect(keeper).rebalance();
      
      // Immediate second rebalance should fail
      await expect(vault.connect(keeper).rebalance())
        .to.be.revertedWith("Too soon");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency withdrawal", async function () {
      const depositAmount = ethers.utils.parseUnits("1000", 6);
      await vault.connect(user1).deposit(depositAmount, user1.address);
      
      await vault.connect(user1).emergencyWithdraw();
      
      expect(await vault.balanceOf(user1.address)).to.equal(0);
      expect(await usdc.balanceOf(user1.address)).to.equal(
        ethers.utils.parseUnits("10000", 6)
      );
    });

    it("Should allow admin to pause contract", async function () {
      await vault.connect(owner).pause();
      
      await expect(vault.connect(user1).deposit(1000, user1.address))
        .to.be.revertedWith("Pausable: paused");
    });
  });
});