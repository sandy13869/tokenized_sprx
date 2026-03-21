const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // ── Polygon Mainnet USDC address ──
  // Amoy testnet has no canonical USDC; use env override for testing.
  const USDC_ADDRESS =
    process.env.STABLECOIN_ADDRESS ||
    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"; // USDC on Polygon

  // ── 1. Deploy StreamToken (EIP-1967 transparent proxy) ──
  const StreamToken = await ethers.getContractFactory("StreamToken");
  const streamToken = await upgrades.deployProxy(
    StreamToken,
    [
      "Stream SPRX Token", // name
      "SPRX",              // symbol
      ethers.parseEther("1000000"), // 1 M initial supply
      deployer.address,    // default admin
    ],
    { initializer: "initialize" }
  );
  await streamToken.waitForDeployment();
  const tokenAddr = await streamToken.getAddress();
  console.log("StreamToken proxy:", tokenAddr);

  // ── 2. Deploy TokenizedAccess (EIP-1967 transparent proxy) ──
  const TokenizedAccess = await ethers.getContractFactory("TokenizedAccess");
  const tokenizedAccess = await upgrades.deployProxy(
    TokenizedAccess,
    [
      "SPRX Ticket",       // name
      "SPRX-TIX",          // symbol
      deployer.address,    // royalty receiver
      250,                 // 2.5 % royalty
      deployer.address,    // default admin
    ],
    { initializer: "initialize" }
  );
  await tokenizedAccess.waitForDeployment();
  const ticketAddr = await tokenizedAccess.getAddress();
  console.log("TokenizedAccess proxy:", ticketAddr);

  // ── 3. Deploy StreamAccessController (EIP-1967 transparent proxy) ──
  const Controller = await ethers.getContractFactory("StreamAccessController");
  const controller = await upgrades.deployProxy(
    Controller,
    [
      tokenAddr,           // streamToken
      ticketAddr,          // ticketContract
      USDC_ADDRESS,        // stablecoin (USDC)
      100,                 // sprxPerStable: 100 SPRX per 1 USDC
      500000,              // stableCostPerMinute: 0.50 USDC (6 decimals)
      100,                 // feeBps: 1 %
      deployer.address,    // default admin
    ],
    { initializer: "initialize" }
  );
  await controller.waitForDeployment();
  const accessAddr = await controller.getAddress();
  console.log("StreamAccessController proxy:", accessAddr);

  // ── 4. Grant MINTER_ROLE to controller so it can mint SPRX on buyTokens ──
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const grantTx = await streamToken.grantRole(MINTER_ROLE, accessAddr);
  await grantTx.wait();
  console.log("Controller granted MINTER_ROLE on StreamToken.");

  console.log("\n--- Deployment complete ---");
  console.log("VITE_APP_TOKEN_ADDRESS=" + tokenAddr);
  console.log("VITE_APP_TICKET_ADDRESS=" + ticketAddr);
  console.log("VITE_APP_ACCESS_ADDRESS=" + accessAddr);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
