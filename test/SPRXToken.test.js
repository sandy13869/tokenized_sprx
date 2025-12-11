const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SPRX Platform - Token Tests", function () {
  let sprxToken;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const SPRXToken = await ethers.getContractFactory("SPRXToken");
    sprxToken = await SPRXToken.deploy();
    await sprxToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await sprxToken.owner()).to.equal(owner.address);
    });

    it("Should assign the initial supply to the owner", async function () {
      const ownerBalance = await sprxToken.balanceOf(owner.address);
      expect(await sprxToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await sprxToken.name()).to.equal("SPRX Platform Token");
      expect(await sprxToken.symbol()).to.equal("SPRX");
    });
  });

  describe("Rewards", function () {
    it("Should reward tokens to users", async function () {
      const rewardAmount = ethers.parseEther("100");
      
      await sprxToken.rewardUser(user1.address, rewardAmount);
      
      expect(await sprxToken.balanceOf(user1.address)).to.equal(rewardAmount);
      expect(await sprxToken.rewards(user1.address)).to.equal(rewardAmount);
    });

    it("Should batch reward multiple users", async function () {
      const users = [user1.address, user2.address];
      const amounts = [ethers.parseEther("50"), ethers.parseEther("75")];
      
      await sprxToken.batchReward(users, amounts);
      
      expect(await sprxToken.balanceOf(user1.address)).to.equal(amounts[0]);
      expect(await sprxToken.balanceOf(user2.address)).to.equal(amounts[1]);
    });

    it("Should fail if non-owner tries to reward", async function () {
      const rewardAmount = ethers.parseEther("100");
      
      await expect(
        sprxToken.connect(user1).rewardUser(user2.address, rewardAmount)
      ).to.be.reverted;
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("50");
      
      await sprxToken.transfer(user1.address, transferAmount);
      expect(await sprxToken.balanceOf(user1.address)).to.equal(transferAmount);
      
      await sprxToken.connect(user1).transfer(user2.address, transferAmount);
      expect(await sprxToken.balanceOf(user2.address)).to.equal(transferAmount);
    });
  });

  describe("Burning", function () {
    it("Should burn tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      const initialSupply = await sprxToken.totalSupply();
      
      await sprxToken.burn(burnAmount);
      
      expect(await sprxToken.totalSupply()).to.equal(initialSupply - burnAmount);
    });
  });
});
