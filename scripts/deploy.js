const hre = require("hardhat");

async function main() {
  console.log("Deploying SPRX Platform contracts...");

  // Deploy SPRX Token
  const SPRXToken = await hre.ethers.getContractFactory("SPRXToken");
  const sprxToken = await SPRXToken.deploy();
  await sprxToken.waitForDeployment();
  const tokenAddress = await sprxToken.getAddress();
  console.log(`SPRXToken deployed to: ${tokenAddress}`);

  // Deploy StreamingAccessPass NFT
  const StreamingAccessPass = await hre.ethers.getContractFactory("StreamingAccessPass");
  const accessPass = await StreamingAccessPass.deploy();
  await accessPass.waitForDeployment();
  const passAddress = await accessPass.getAddress();
  console.log(`StreamingAccessPass deployed to: ${passAddress}`);

  // Deploy StreamingRightsManager
  const StreamingRightsManager = await hre.ethers.getContractFactory("StreamingRightsManager");
  const rightsManager = await StreamingRightsManager.deploy(tokenAddress, passAddress);
  await rightsManager.waitForDeployment();
  const managerAddress = await rightsManager.getAddress();
  console.log(`StreamingRightsManager deployed to: ${managerAddress}`);

  // Grant necessary permissions
  console.log("\nSetting up permissions...");
  
  // Transfer ownership of AccessPass to RightsManager so it can mint NFTs
  await accessPass.transferOwnership(managerAddress);
  console.log("AccessPass ownership transferred to RightsManager");

  console.log("\n=== Deployment Summary ===");
  console.log(`SPRXToken: ${tokenAddress}`);
  console.log(`StreamingAccessPass: ${passAddress}`);
  console.log(`StreamingRightsManager: ${managerAddress}`);
  console.log("\nUpdate your .env file with these addresses!");
  
  return {
    sprxToken: tokenAddress,
    accessPass: passAddress,
    rightsManager: managerAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
