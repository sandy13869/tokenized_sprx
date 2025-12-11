const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SPRX Platform - Streaming Tests", function () {
  let sprxToken;
  let accessPass;
  let rightsManager;
  let owner;
  let organizer;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, organizer, user1, user2] = await ethers.getSigners();
    
    // Deploy contracts
    const SPRXToken = await ethers.getContractFactory("SPRXToken");
    sprxToken = await SPRXToken.deploy();
    await sprxToken.waitForDeployment();
    
    const StreamingAccessPass = await ethers.getContractFactory("StreamingAccessPass");
    accessPass = await StreamingAccessPass.deploy();
    await accessPass.waitForDeployment();
    
    const StreamingRightsManager = await ethers.getContractFactory("StreamingRightsManager");
    rightsManager = await StreamingRightsManager.deploy(
      await sprxToken.getAddress(),
      await accessPass.getAddress()
    );
    await rightsManager.waitForDeployment();
    
    // Transfer ownership of AccessPass to RightsManager
    await accessPass.transferOwnership(await rightsManager.getAddress());
    
    // Distribute tokens to users
    await sprxToken.transfer(user1.address, ethers.parseEther("10000"));
    await sprxToken.transfer(user2.address, ethers.parseEther("10000"));
  });

  describe("Event Creation", function () {
    it("Should create a new event", async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const endTime = startTime + 7200; // 2 hours duration
      
      await rightsManager.connect(organizer).createEvent(
        "NBA Finals Game 7",
        "Championship game with AR/VR viewing",
        startTime,
        endTime,
        ethers.parseEther("10"),  // standard
        ethers.parseEther("25"),  // vip
        ethers.parseEther("50")   // premium
      );
      
      const eventDetails = await rightsManager.getEventDetails(0);
      expect(eventDetails.name).to.equal("NBA Finals Game 7");
      expect(eventDetails.isActive).to.equal(true);
    });

    it("Should fail with invalid times", async function () {
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      
      await expect(
        rightsManager.createEvent(
          "Test Event",
          "Description",
          pastTime,
          pastTime + 3600,
          ethers.parseEther("10"),
          ethers.parseEther("25"),
          ethers.parseEther("50")
        )
      ).to.be.revertedWith("Start time must be in the future");
    });
  });

  describe("Access Purchase", function () {
    let eventId;
    
    beforeEach(async function () {
      const startTime = Math.floor(Date.now() / 1000) + 3600;
      const endTime = startTime + 7200;
      
      const tx = await rightsManager.connect(organizer).createEvent(
        "Test Event",
        "Test Description",
        startTime,
        endTime,
        ethers.parseEther("10"),
        ethers.parseEther("25"),
        ethers.parseEther("50")
      );
      
      eventId = 0; // First event
    });

    it("Should purchase standard access", async function () {
      const price = ethers.parseEther("10");
      
      // Approve tokens
      await sprxToken.connect(user1).approve(
        await rightsManager.getAddress(),
        price
      );
      
      // Purchase access
      await rightsManager.connect(user1).purchaseAccess(eventId, "standard");
      
      // Verify NFT was minted
      expect(await accessPass.balanceOf(user1.address)).to.equal(1);
      
      // Verify event access
      expect(await accessPass.hasEventAccess(eventId, user1.address)).to.equal(true);
    });

    it("Should purchase VIP access", async function () {
      const price = ethers.parseEther("25");
      
      await sprxToken.connect(user1).approve(
        await rightsManager.getAddress(),
        price
      );
      
      await rightsManager.connect(user1).purchaseAccess(eventId, "vip");
      
      expect(await accessPass.balanceOf(user1.address)).to.equal(1);
    });

    it("Should fail with insufficient tokens", async function () {
      const price = ethers.parseEther("10");
      
      // Approve but transfer away tokens first
      await sprxToken.connect(user1).approve(
        await rightsManager.getAddress(),
        price
      );
      await sprxToken.connect(user1).transfer(owner.address, ethers.parseEther("9995"));
      
      await expect(
        rightsManager.connect(user1).purchaseAccess(eventId, "standard")
      ).to.be.revertedWith("Insufficient SPRX tokens");
    });

    it("Should fail with invalid access level", async function () {
      const price = ethers.parseEther("10");
      
      await sprxToken.connect(user1).approve(
        await rightsManager.getAddress(),
        price
      );
      
      await expect(
        rightsManager.connect(user1).purchaseAccess(eventId, "invalid")
      ).to.be.revertedWith("Invalid access level");
    });
  });

  describe("Access Pass Validation", function () {
    it("Should validate active passes", async function () {
      const duration = 3600; // 1 hour
      
      await accessPass.mintAccessPass(
        user1.address,
        0,
        duration,
        "standard",
        "ipfs://test"
      );
      
      expect(await accessPass.isValidPass(0)).to.equal(true);
    });
  });
});
