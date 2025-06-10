const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockERC20", function () {
  let token;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy("Test Token", "TEST", 18);
    await token.deployed();
  });

  it("Should have correct name and symbol", async function () {
    expect(await token.name()).to.equal("Test Token");
    expect(await token.symbol()).to.equal("TEST");
    expect(await token.decimals()).to.equal(18);
  });

  it("Should mint tokens", async function () {
    await token.mint(addr1.address, ethers.utils.parseEther("1000"));
    expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1000"));
  });
});
