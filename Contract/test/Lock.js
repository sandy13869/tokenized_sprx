const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Tokenized SPRX – Upgradeable Contracts (Transparent Proxy)", function () {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners();

    // Deploy a mock ERC-20 stablecoin (acts as USDC stand-in)
    const MockStable = await ethers.getContractFactory("StreamToken");
    const stablecoin = await upgrades.deployProxy(
      MockStable,
      ["Mock USDC", "mUSDC", ethers.parseUnits("10000000", 18), owner.address],
      { initializer: "initialize" }
    );
    await stablecoin.waitForDeployment();

    // StreamToken
    const StreamToken = await ethers.getContractFactory("StreamToken");
    const streamToken = await upgrades.deployProxy(
      StreamToken,
      ["Stream SPRX", "SPRX", ethers.parseEther("1000000"), owner.address],
      { initializer: "initialize" }
    );
    await streamToken.waitForDeployment();

    // TokenizedAccess
    const TokenizedAccess = await ethers.getContractFactory("TokenizedAccess");
    const ticket = await upgrades.deployProxy(
      TokenizedAccess,
      ["SPRX Ticket", "SPRX-TIX", owner.address, 250, owner.address],
      { initializer: "initialize" }
    );
    await ticket.waitForDeployment();

    // StreamAccessController
    const Controller = await ethers.getContractFactory("StreamAccessController");
    const controller = await upgrades.deployProxy(
      Controller,
      [
        await streamToken.getAddress(),
        await ticket.getAddress(),
        await stablecoin.getAddress(),
        100,     // sprxPerStable
        500000,  // stableCostPerMinute (0.50 "USDC")
        100,     // feeBps 1%
        owner.address,
      ],
      { initializer: "initialize" }
    );
    await controller.waitForDeployment();

    // Grant MINTER_ROLE to controller on streamToken
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await streamToken.grantRole(MINTER_ROLE, await controller.getAddress());

    return { owner, alice, bob, streamToken, ticket, controller, stablecoin };
  }

  describe("Deployment", function () {
    it("deploys all proxies behind EIP-1967", async function () {
      const { streamToken, ticket, controller } = await loadFixture(deployFixture);
      expect(await streamToken.getAddress()).to.be.properAddress;
      expect(await ticket.getAddress()).to.be.properAddress;
      expect(await controller.getAddress()).to.be.properAddress;
    });

    it("sets correct admin role", async function () {
      const { owner, streamToken, ticket, controller } = await loadFixture(deployFixture);
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      expect(await streamToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await ticket.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await controller.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("mints initial supply", async function () {
      const { owner, streamToken } = await loadFixture(deployFixture);
      const balance = await streamToken.balanceOf(owner.address);
      expect(balance).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("Burn for Access", function () {
    it("grants access when tokens are burned", async function () {
      const { owner, alice, streamToken, controller } = await loadFixture(deployFixture);

      // Transfer some SPRX to alice
      await streamToken.transfer(alice.address, ethers.parseEther("500"));

      // Alice approves controller to burn
      const controllerAddr = await controller.getAddress();
      await streamToken.connect(alice).approve(controllerAddr, ethers.parseEther("100"));

      // Burn for 10 minutes of access to event 1
      await controller.connect(alice).burnForAccess(1, 10, ethers.parseEther("100"));

      expect(await controller.hasAccess(alice.address, 1)).to.be.true;
    });
  });

  describe("Ticket Access", function () {
    it("grants access via NFT ticket", async function () {
      const { owner, alice, ticket, controller } = await loadFixture(deployFixture);
      await ticket.mintTicket(alice.address, 1, 1, "A1", "");
      expect(await controller.hasAccess(alice.address, 1)).to.be.true;
    });
  });

  describe("Upgradeability", function () {
    it("admin can upgrade StreamToken via transparent proxy", async function () {
      const { streamToken } = await loadFixture(deployFixture);
      const StreamTokenV2 = await ethers.getContractFactory("StreamToken");
      const upgraded = await upgrades.upgradeProxy(
        await streamToken.getAddress(),
        StreamTokenV2
      );
      expect(await upgraded.getAddress()).to.equal(await streamToken.getAddress());
    });
  });
});
