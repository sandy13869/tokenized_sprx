const { ethers, upgrades } = require("hardhat");

/**
 * Upgrade script – reads proxy addresses from env and upgrades implementations.
 * Uses EIP-1967 transparent proxy (ProxyAdmin handles authorization).
 *
 * Usage:
 *   STREAM_TOKEN_PROXY=0x... TICKET_PROXY=0x... ACCESS_PROXY=0x... \
 *     npx hardhat run scripts/upgrade.js --network polygon
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with:", deployer.address);

  if (process.env.STREAM_TOKEN_PROXY) {
    const StreamToken = await ethers.getContractFactory("StreamToken");
    const upgraded = await upgrades.upgradeProxy(
      process.env.STREAM_TOKEN_PROXY,
      StreamToken
    );
    await upgraded.waitForDeployment();
    console.log("StreamToken upgraded at:", process.env.STREAM_TOKEN_PROXY);
  }

  if (process.env.TICKET_PROXY) {
    const TokenizedAccess = await ethers.getContractFactory("TokenizedAccess");
    const upgraded = await upgrades.upgradeProxy(
      process.env.TICKET_PROXY,
      TokenizedAccess
    );
    await upgraded.waitForDeployment();
    console.log("TokenizedAccess upgraded at:", process.env.TICKET_PROXY);
  }

  if (process.env.ACCESS_PROXY) {
    const Controller = await ethers.getContractFactory(
      "StreamAccessController"
    );
    const upgraded = await upgrades.upgradeProxy(
      process.env.ACCESS_PROXY,
      Controller
    );
    await upgraded.waitForDeployment();
    console.log(
      "StreamAccessController upgraded at:",
      process.env.ACCESS_PROXY
    );
  }

  console.log("Upgrade complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
