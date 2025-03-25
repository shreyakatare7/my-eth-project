// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const IoTAuth = await hre.ethers.getContractFactory("IoTAuth");
  console.log("Deploying IoTAuth contract...");

  // Deploy the contract
  const iotAuth = await IoTAuth.deploy();
  console.log("Transaction sent: ", iotAuth.deployTransaction.hash);

  // Wait for the transaction to be mined
  const receipt = await iotAuth.deployTransaction.wait();
  console.log("Contract deployed successfully!");

  // Contract address
  console.log("Contract address:", iotAuth.address);
}

// Run the deployment function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contract:", error);
    process.exit(1);
  });
